import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import AppError from '../utils/appError.js';

// Helper to sanitize inputs and prevent prompt injection
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').substring(0, 500); // strip html tags, cap at 500 chars
};

const sanitizeArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => sanitizeString(item)).filter(Boolean);
};

// Determine AI Provider
const geminiApiKey = process.env.GEMINI_API_KEY || 
  (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith('sk-ant') && !process.env.ANTHROPIC_API_KEY.startsWith('mock_') 
    ? process.env.ANTHROPIC_API_KEY 
    : null);

const anthropicApiKey = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant') 
  ? process.env.ANTHROPIC_API_KEY 
  : null;

let geminiAi = null;
if (geminiApiKey) {
  try {
    geminiAi = new GoogleGenAI({ apiKey: geminiApiKey });
    console.log('[AI Service] Initialized with Google Gemini (gemini-3.5-flash-lite)');
  } catch (err) {
    console.error('[AI Service] Failed to initialize GoogleGenAI:', err);
  }
}

let anthropic = null;
if (anthropicApiKey) {
  try {
    anthropic = new Anthropic({ apiKey: anthropicApiKey });
    console.log('[AI Service] Initialized with Anthropic Claude');
  } catch (err) {
    console.error('[AI Service] Failed to initialize Anthropic:', err);
  }
}

const isMockMode = !geminiAi && !anthropic;
if (isMockMode) {
  console.warn('[AI Service] Running in Mock Mode. No valid Google Gemini or Anthropic API key provided.');
}

// Robust JSON parser that strips markdown fences
const parseJSONResponse = (text) => {
  let cleanText = (text || '').trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.substring(3);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  return JSON.parse(cleanText.trim());
};

// Normalization helpers for MongoDB schemas
const normalizeNumber = (val, fallback = 0) => {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const match = String(val).match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : fallback;
};

const normalizeRecipe = (recipe) => {
  if (!recipe || typeof recipe !== 'object') return recipe;
  return {
    title: recipe.title || 'Nutritious Recipe',
    ingredients: Array.isArray(recipe.ingredients)
      ? recipe.ingredients.map((ing) => {
          if (typeof ing === 'string') {
            return { name: ing, quantity: 1, unit: 'serving' };
          }
          return {
            name: ing.name || 'Ingredient',
            quantity: normalizeNumber(ing.quantity, 1),
            unit: ing.unit || '',
          };
        })
      : [{ name: 'Chef Special Ingredient', quantity: 100, unit: 'g' }],
    steps: Array.isArray(recipe.steps) && recipe.steps.length > 0
      ? recipe.steps.map(String)
      : ['Prepare ingredients and cook until fully ready to serve.'],
    nutrition: {
      calories: normalizeNumber(recipe.nutrition?.calories, 380),
      protein: normalizeNumber(recipe.nutrition?.protein, 20),
      carbs: normalizeNumber(recipe.nutrition?.carbs, 35),
      fats: normalizeNumber(recipe.nutrition?.fats, 12),
    },
    servings: normalizeNumber(recipe.servings, 2),
  };
};

/**
 * Generate a recipe based on ingredients, diet goal, meal type, allergies, and cuisine preference.
 */
export const generateRecipe = async ({ ingredients, dietGoal, mealType, allergies, cuisinePreference }) => {
  const cleanIngredients = sanitizeArray(ingredients);
  const cleanAllergies = sanitizeArray(allergies);
  const cleanDietGoal = sanitizeString(dietGoal);
  const cleanMealType = sanitizeString(mealType);
  const cleanCuisine = sanitizeString(cuisinePreference);

  // 1. Google Gemini Provider
  if (geminiAi) {
    try {
      const prompt = `You are an expert culinary chef and certified nutritionist. Generate a customized, delicious recipe in valid JSON format matching this exact schema:
{
  "title": "Recipe Name",
  "ingredients": [{"name": "ingredient name", "quantity": 100, "unit": "g"}],
  "steps": ["Step 1 description", "Step 2 description"],
  "nutrition": {"calories": 380, "protein": 20, "carbs": 40, "fats": 12},
  "servings": 2
}

Constraints:
- Available ingredients: ${cleanIngredients.join(', ') || 'Chef choice'}
- Dietary goal: ${cleanDietGoal || 'balanced'}
- Meal type: ${cleanMealType || 'any'}
- Allergies to strictly avoid: ${cleanAllergies.join(', ') || 'none'}
- Cuisine preference: ${cleanCuisine || 'any'}`;

      const res = await geminiAi.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = parseJSONResponse(res.text);
      return normalizeRecipe(parsed);
    } catch (err) {
      console.error('[AI Service - Gemini] Recipe generation failed:', err.message);
      throw new AppError('AI recipe generation failed. Please try again.', 502);
    }
  }

  // 2. Anthropic Claude Provider
  if (anthropic) {
    const systemPrompt = `You are a master culinary chef and expert nutritionist. Your task is to generate a recipe in valid JSON format. Return only raw, parsing-ready JSON matching this exact schema:
{
  "title": "Recipe Name",
  "ingredients": [{"name": "ingredient name", "quantity": number, "unit": "g/tbsp/etc"}],
  "steps": ["Step 1 description", "Step 2 description"],
  "nutrition": {"calories": number, "protein": number, "carbs": number, "fats": number},
  "servings": number
}`;

    const userPrompt = `Generate a customized recipe using these parameters:
- Available ingredients: ${cleanIngredients.join(', ') || 'Chef\'s choice'}
- Dietary goal: ${cleanDietGoal || 'balanced'}
- Meal type: ${cleanMealType || 'any'}
- Allergies to avoid: ${cleanAllergies.join(', ') || 'none'}
- Cuisine preference: ${cleanCuisine || 'any'}`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const responseText = response.content[0].text;
      return normalizeRecipe(parseJSONResponse(responseText));
    } catch (err) {
      console.error(`[AI Service - Claude] Recipe generation attempt failed: ${err.message}`);
      throw new AppError('AI recipe generation failed. Please try again.', 502);
    }
  }

  // 3. Fallback Mock Provider
  await new Promise((res) => setTimeout(res, 1200));
  return normalizeRecipe({
    title: `${cleanCuisine || 'Healthy'} ${cleanMealType || 'Dish'}`,
    ingredients: cleanIngredients.length > 0 
      ? cleanIngredients.map(ing => ({ name: ing, quantity: 100, unit: 'g' })).concat([{ name: 'Olive Oil', quantity: 1, unit: 'tbsp' }])
      : [{ name: 'Quinoa', quantity: 100, unit: 'g' }, { name: 'Mixed Vegetables', quantity: 150, unit: 'g' }, { name: 'Tofu', quantity: 120, unit: 'g' }],
    steps: [
      'Wash and prepare all the ingredients thoroughly.',
      'Heat olive oil in a pan over medium heat, then saute the ingredients.',
      'Simmer for 10-15 minutes, stirring occasionally, until fully cooked.',
      'Garnish with fresh herbs and serve warm.'
    ],
    nutrition: { calories: 380, protein: 18, carbs: 42, fats: 12 },
    servings: 2
  });
};

/**
 * Generate a 7-day weekly meal plan based on preferences.
 */
export const generateWeeklyMealPlan = async ({ dietGoal, allergies, cuisinePreference, dailyCalorieTarget }) => {
  const cleanDietGoal = sanitizeString(dietGoal);
  const cleanAllergies = sanitizeArray(allergies);
  const cleanCuisine = sanitizeString(cuisinePreference);
  const cleanCalories = Number(dailyCalorieTarget) || 2000;

  // 1. Google Gemini Provider
  if (geminiAi) {
    try {
      const prompt = `You are an expert nutritionist and meal planner. Generate a complete 7-day meal plan for Monday through Sunday.
Requirements:
- Dietary goal: ${cleanDietGoal || 'balanced'}
- Allergies to strictly avoid: ${cleanAllergies.join(', ') || 'none'}
- Cuisine preference: ${cleanCuisine || 'any'}
- Daily target calories: ~${cleanCalories} kcal

You must return valid JSON matching this schema:
{
  "days": [
    {
      "day": "Monday",
      "meals": {
        "breakfast": {
          "title": "string",
          "ingredients": [{"name": "string", "quantity": 100, "unit": "g"}],
          "steps": ["string"],
          "nutrition": {"calories": 400, "protein": 20, "carbs": 40, "fats": 15},
          "servings": 1
        },
        "lunch": {
          "title": "string",
          "ingredients": [{"name": "string", "quantity": 150, "unit": "g"}],
          "steps": ["string"],
          "nutrition": {"calories": 600, "protein": 35, "carbs": 60, "fats": 20},
          "servings": 1
        },
        "dinner": {
          "title": "string",
          "ingredients": [{"name": "string", "quantity": 150, "unit": "g"}],
          "steps": ["string"],
          "nutrition": {"calories": 650, "protein": 40, "carbs": 55, "fats": 22},
          "servings": 1
        },
        "snacks": [
          {
            "title": "string",
            "ingredients": [{"name": "string", "quantity": 50, "unit": "g"}],
            "steps": ["string"],
            "nutrition": {"calories": 200, "protein": 10, "carbs": 25, "fats": 5},
            "servings": 1
          }
        ]
      }
    }
  ]
}
Include days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.`;

      const res = await geminiAi.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = parseJSONResponse(res.text);
      if (parsed?.days && Array.isArray(parsed.days)) {
        parsed.days = parsed.days.map((d) => ({
          day: d.day,
          meals: {
            breakfast: normalizeRecipe(d.meals?.breakfast),
            lunch: normalizeRecipe(d.meals?.lunch),
            dinner: normalizeRecipe(d.meals?.dinner),
            snacks: Array.isArray(d.meals?.snacks)
              ? d.meals.snacks.map(normalizeRecipe)
              : [normalizeRecipe(d.meals?.snacks)],
          },
        }));
      }
      return parsed;
    } catch (err) {
      console.error('[AI Service - Gemini] Weekly meal plan generation failed:', err.message);
      throw new AppError('AI weekly meal plan generation failed. Please try again.', 502);
    }
  }

  // 2. Anthropic Claude Provider
  if (anthropic) {
    const systemPrompt = `You are an expert nutritionist and meal planner. Generate a 7-day meal plan based on the user's preferences. Return ONLY valid JSON.`;
    const userPrompt = `Create a 7-day meal plan with:
- Dietary goal: ${cleanDietGoal || 'balanced'}
- Allergies to avoid: ${cleanAllergies.join(', ') || 'none'}
- Cuisine preference: ${cleanCuisine || 'any'}
- Target daily calories: ${cleanCalories} kcal`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const parsed = parseJSONResponse(response.content[0].text);
      if (parsed?.days && Array.isArray(parsed.days)) {
        parsed.days = parsed.days.map((d) => ({
          day: d.day,
          meals: {
            breakfast: normalizeRecipe(d.meals?.breakfast),
            lunch: normalizeRecipe(d.meals?.lunch),
            dinner: normalizeRecipe(d.meals?.dinner),
            snacks: Array.isArray(d.meals?.snacks)
              ? d.meals.snacks.map(normalizeRecipe)
              : [normalizeRecipe(d.meals?.snacks)],
          },
        }));
      }
      return parsed;
    } catch (err) {
      console.error(`[AI Service - Claude] Meal plan generation attempt failed: ${err.message}`);
      throw new AppError('AI weekly meal plan generation failed. Please try again.', 502);
    }
  }

  // 3. Fallback Mock Provider
  await new Promise((res) => setTimeout(res, 1800));
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mockRecipes = [
    normalizeRecipe({
      title: 'Avocado Toast with Poached Egg',
      ingredients: [{ name: 'Bread', quantity: 2, unit: 'slices' }, { name: 'Avocado', quantity: 1, unit: 'whole' }, { name: 'Egg', quantity: 1, unit: 'large' }],
      steps: ['Toast bread.', 'Mash avocado and spread.', 'Top with poached egg.'],
      nutrition: { calories: 350, protein: 14, carbs: 28, fats: 18 },
      servings: 1
    }),
    normalizeRecipe({
      title: 'Grilled Salmon with Quinoa',
      ingredients: [{ name: 'Salmon Fillet', quantity: 150, unit: 'g' }, { name: 'Quinoa', quantity: 80, unit: 'g' }, { name: 'Asparagus', quantity: 100, unit: 'g' }],
      steps: ['Cook quinoa.', 'Grill salmon and asparagus until cooked.', 'Serve together.'],
      nutrition: { calories: 580, protein: 38, carbs: 40, fats: 22 },
      servings: 1
    }),
    normalizeRecipe({
      title: 'Turkey Spinach Wrap',
      ingredients: [{ name: 'Tortilla Wrap', quantity: 1, unit: 'whole' }, { name: 'Turkey Breast', quantity: 100, unit: 'g' }, { name: 'Spinach', quantity: 50, unit: 'g' }],
      steps: ['Lay wrap flat.', 'Place ingredients in center.', 'Roll up tightly.'],
      nutrition: { calories: 320, protein: 24, carbs: 30, fats: 8 },
      servings: 1
    }),
    normalizeRecipe({
      title: 'Greek Yogurt with Blueberries',
      ingredients: [{ name: 'Greek Yogurt', quantity: 200, unit: 'g' }, { name: 'Blueberries', quantity: 50, unit: 'g' }, { name: 'Honey', quantity: 1, unit: 'tsp' }],
      steps: ['Scoop yogurt into a bowl.', 'Top with fresh berries.', 'Drizzle honey.'],
      nutrition: { calories: 220, protein: 18, carbs: 22, fats: 4 },
      servings: 1
    })
  ];

  return {
    days: daysOfWeek.map(day => ({
      day,
      meals: {
        breakfast: mockRecipes[0],
        lunch: mockRecipes[2],
        dinner: mockRecipes[1],
        snacks: [mockRecipes[3]]
      }
    }))
  };
};

/**
 * Stream conversational responses from Gemini or Claude for the chatbot.
 */
export const streamChatResponse = async ({ messages, onToken }) => {
  const formattedMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: sanitizeString(msg.content)
  }));

  const systemPrompt = `You are NutriChef, a friendly, knowledgeable culinary and nutrition AI assistant.
Give practical, delicious, evidence-based cooking, diet, and nutrition advice.
Avoid giving clinical medical diagnoses; advise consulting a healthcare professional for serious conditions.
Keep responses engaging, concise, structured, and easy to read using markdown bullets or numbered steps.`;

  // 1. Google Gemini Streaming
  if (geminiAi) {
    try {
      const contents = formattedMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const responseStream = await geminiAi.models.generateContentStream({
        model: 'gemini-3.5-flash-lite',
        contents,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          onToken(chunk.text);
        }
      }
      return;
    } catch (err) {
      console.error('[AI Service - Gemini] Chat streaming error:', err);
      throw new AppError('Nutrition assistant communication failed: ' + err.message, 502);
    }
  }

  // 2. Anthropic Claude Streaming
  if (anthropic) {
    try {
      const stream = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        system: systemPrompt,
        messages: formattedMessages,
        stream: true,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          onToken(event.delta.text);
        }
      }
      return;
    } catch (err) {
      console.error('[AI Service - Claude] Streaming error:', err);
      throw new AppError('Nutrition assistant communication failed.', 502);
    }
  }

  // 3. Fallback Mock Streaming
  const lastUserMsg = formattedMessages.filter(m => m.role === 'user').pop()?.content || '';
  const mockReply = `Hello! I'm NutriChef. 

Regarding your question about "${lastUserMsg || 'healthy eating'}":
1. **Focus on Whole Foods**: Prioritize vegetables, high-fiber grains, and lean protein.
2. **Hydration**: Drink 2–3 liters of water daily.
3. **Consistency**: Small daily habits beat extreme diets.

Let me know what recipes or meal plans you would like to explore next!`;

  const tokens = mockReply.split(' ');
  for (const token of tokens) {
    onToken(token + ' ');
    await new Promise((res) => setTimeout(res, 50));
  }
};

/**
 * Consolidate and categorize grocery items using AI.
 */
export const generateGroceryListFromMealPlan = async (mealPlanDoc) => {
  const rawIngredients = [];
  mealPlanDoc.days.forEach(dayPlan => {
    ['breakfast', 'lunch', 'dinner'].forEach(mealKey => {
      const meal = dayPlan.meals[mealKey];
      if (meal && Array.isArray(meal.ingredients)) {
        rawIngredients.push(...meal.ingredients);
      }
    });
    if (Array.isArray(dayPlan.meals.snacks)) {
      dayPlan.meals.snacks.forEach(snack => {
        if (snack && Array.isArray(snack.ingredients)) {
          rawIngredients.push(...snack.ingredients);
        }
      });
    }
  });

  // 1. Google Gemini Provider
  if (geminiAi) {
    try {
      const prompt = `You are an expert culinary coordinator. You will receive a list of ingredients compiled from a 7-day meal plan.
Your task is to aggregate them and return a valid JSON object matching the schema below.
Rules:
1. Merge duplicate ingredients of the same name.
2. Sum up quantities where units match.
3. Categorize every ingredient into exactly one of: Produce, Dairy, Protein, Pantry, Spices, Other.

Schema:
{
  "items": [
    { "name": "Ingredient Name", "quantity": 200, "unit": "g", "category": "Produce" }
  ]
}

Ingredients:
${JSON.stringify(rawIngredients, null, 2)}`;

      const res = await geminiAi.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      return parseJSONResponse(res.text);
    } catch (err) {
      console.error('[AI Service - Gemini] Grocery aggregation failed:', err.message);
      // Fallback to local aggregation below
    }
  }

  // 2. Anthropic Claude Provider
  if (anthropic) {
    try {
      const systemPrompt = `You are an expert culinary coordinator. Output ONLY valid JSON with schema {"items": [{"name": string, "quantity": number, "unit": string, "category": string}]}.`;
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 2500,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Aggregate: ${JSON.stringify(rawIngredients, null, 2)}` }],
      });
      return parseJSONResponse(response.content[0].text);
    } catch (err) {
      console.error('[AI Service - Claude] Grocery consolidation attempt failed:', err.message);
    }
  }

  // 3. Fallback Local Aggregation
  const categoriesMap = {
    Bread: 'Pantry',
    Avocado: 'Produce',
    Egg: 'Dairy',
    'Salmon Fillet': 'Protein',
    Quinoa: 'Pantry',
    Asparagus: 'Produce',
    'Tortilla Wrap': 'Pantry',
    'Turkey Breast': 'Protein',
    Spinach: 'Produce',
    'Greek Yogurt': 'Dairy',
    Blueberries: 'Produce',
    Honey: 'Pantry',
  };

  const aggregated = {};
  rawIngredients.forEach(ing => {
    const key = (ing.name || '').trim();
    if (!key) return;
    if (aggregated[key]) {
      aggregated[key].quantity += normalizeNumber(ing.quantity, 1);
    } else {
      aggregated[key] = {
        name: key,
        quantity: normalizeNumber(ing.quantity, 1),
        unit: ing.unit || '',
        checked: false,
        category: categoriesMap[key] || 'Other',
      };
    }
  });

  return {
    items: Object.values(aggregated),
  };
};
