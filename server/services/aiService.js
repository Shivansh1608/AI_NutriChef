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

// Initialize Anthropic client
const isMockMode = !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith('mock_');
let anthropic = null;

if (!isMockMode) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
} else {
  console.warn('[AI Service] Running in Mock Mode. No Anthropic API Key provided.');
}

// Robust JSON parser that strips markdown fences
const parseJSONResponse = (text) => {
  let cleanText = text.trim();
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

/**
 * Generate a recipe based on ingredients, diet goal, meal type, allergies, and cuisine preference.
 */
export const generateRecipe = async ({ ingredients, dietGoal, mealType, allergies, cuisinePreference }) => {
  const cleanIngredients = sanitizeArray(ingredients);
  const cleanAllergies = sanitizeArray(allergies);
  const cleanDietGoal = sanitizeString(dietGoal);
  const cleanMealType = sanitizeString(mealType);
  const cleanCuisine = sanitizeString(cuisinePreference);

  if (isMockMode) {
    // Return realistic mock recipe
    await new Promise((res) => setTimeout(res, 1500)); // simulate latency
    return {
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
      nutrition: {
        calories: 380,
        protein: 18,
        carbs: 42,
        fats: 12
      },
      servings: 2
    };
  }

  const systemPrompt = `You are a master culinary chef and expert nutritionist. Your task is to generate a recipe in valid JSON format. Do not write any normal text, explanation, or markdown formatting fences (like \`\`\`json). Return only raw, parsing-ready JSON matching this exact schema:
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

  let attempts = 2;
  while (attempts > 0) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const responseText = response.content[0].text;
      return parseJSONResponse(responseText);
    } catch (err) {
      console.error(`[AI Service] Recipe generation attempt failed: ${err.message}`);
      attempts -= 1;
      if (attempts === 0) {
        throw new AppError('AI recipe generation failed. Please try again.', 502);
      }
    }
  }
};

/**
 * Generate a 7-day weekly meal plan based on preferences.
 */
export const generateWeeklyMealPlan = async ({ dietGoal, allergies, cuisinePreference, dailyCalorieTarget }) => {
  const cleanDietGoal = sanitizeString(dietGoal);
  const cleanAllergies = sanitizeArray(allergies);
  const cleanCuisine = sanitizeString(cuisinePreference);
  const cleanCalories = Number(dailyCalorieTarget) || 2000;

  if (isMockMode) {
    await new Promise((res) => setTimeout(res, 2500)); // simulate latency
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mockRecipes = [
      {
        title: 'Avocado Toast with Poached Egg',
        ingredients: [{ name: 'Bread', quantity: 2, unit: 'slices' }, { name: 'Avocado', quantity: 1, unit: 'whole' }, { name: 'Egg', quantity: 1, unit: 'large' }],
        steps: ['Toast bread.', 'Mash avocado and spread.', 'Top with poached egg.'],
        nutrition: { calories: 350, protein: 14, carbs: 28, fats: 18 },
        servings: 1
      },
      {
        title: 'Grilled Salmon with Quinoa',
        ingredients: [{ name: 'Salmon Fillet', quantity: 150, unit: 'g' }, { name: 'Quinoa', quantity: 80, unit: 'g' }, { name: 'Asparagus', quantity: 100, unit: 'g' }],
        steps: ['Cook quinoa.', 'Grill salmon and asparagus until cooked.', 'Serve together.'],
        nutrition: { calories: 580, protein: 38, carbs: 40, fats: 22 },
        servings: 1
      },
      {
        title: 'Turkey Spinach Wrap',
        ingredients: [{ name: 'Tortilla Wrap', quantity: 1, unit: 'whole' }, { name: 'Turkey Breast', quantity: 100, unit: 'g' }, { name: 'Spinach', quantity: 50, unit: 'g' }],
        steps: ['Lay wrap flat.', 'Place ingredients in center.', 'Roll up tightly.'],
        nutrition: { calories: 320, protein: 24, carbs: 30, fats: 8 },
        servings: 1
      },
      {
        title: 'Greek Yogurt with Blueberries',
        ingredients: [{ name: 'Greek Yogurt', quantity: 200, unit: 'g' }, { name: 'Blueberries', quantity: 50, unit: 'g' }, { name: 'Honey', quantity: 1, unit: 'tsp' }],
        steps: ['Scoop yogurt into a bowl.', 'Top with fresh berries.', 'Drizzle honey.'],
        nutrition: { calories: 220, protein: 18, carbs: 22, fats: 4 },
        servings: 1
      }
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
  }

  const systemPrompt = `You are an expert nutritionist and meal planner. Generate a 7-day meal plan based on the user's preferences. You must output ONLY a valid JSON object matching the schema below. Keep recipes concise so the JSON response fits cleanly within token limits. Do not use markdown wrappers.
Schema:
{
  "days": [
    {
      "day": "Monday",
      "meals": {
        "breakfast": {
          "title": "string",
          "ingredients": [{"name": "string", "quantity": number, "unit": "string"}],
          "steps": ["string"],
          "nutrition": {"calories": number, "protein": number, "carbs": number, "fats": number},
          "servings": number
        },
        "lunch": {
          "title": "string",
          "ingredients": [{"name": "string", "quantity": number, "unit": "string"}],
          "steps": ["string"],
          "nutrition": {"calories": number, "protein": number, "carbs": number, "fats": number},
          "servings": number
        },
        "dinner": {
          "title": "string",
          "ingredients": [{"name": "string", "quantity": number, "unit": "string"}],
          "steps": ["string"],
          "nutrition": {"calories": number, "protein": number, "carbs": number, "fats": number},
          "servings": number
        },
        "snacks": [
          {
            "title": "string",
            "ingredients": [{"name": "string", "quantity": number, "unit": "string"}],
            "steps": ["string"],
            "nutrition": {"calories": number, "protein": number, "carbs": number, "fats": number},
            "servings": number
          }
        ]
      }
    }
  ]
}
Generate for all days Monday through Sunday.`;

  const userPrompt = `Create a 7-day meal plan with:
- Dietary goal: ${cleanDietGoal || 'balanced'}
- Allergies to avoid: ${cleanAllergies.join(', ') || 'none'}
- Cuisine preference: ${cleanCuisine || 'any'}
- Target daily calories: ${cleanCalories} kcal`;

  let attempts = 2;
  while (attempts > 0) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const responseText = response.content[0].text;
      return parseJSONResponse(responseText);
    } catch (err) {
      console.error(`[AI Service] Meal plan generation attempt failed: ${err.message}`);
      attempts -= 1;
      if (attempts === 0) {
        throw new AppError('AI weekly meal plan generation failed. Please try again.', 502);
      }
    }
  }
};

/**
 * Stream conversational responses from Claude for the chatbot.
 */
export const streamChatResponse = async ({ messages, onToken }) => {
  const formattedMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: sanitizeString(msg.content)
  }));

  const systemPrompt = `You are NutriChef, a friendly, knowledgeable kitchen and nutrition assistant.
Give practical, safe, evidence-based cooking, diet, and nutrition advice.
Avoid giving medical diagnoses or prescribing clinical treatments; suggest consulting a medical professional for medical concerns.
Keep responses engaging, concise, and structured (use lists or bolding where helpful).`;

  if (isMockMode) {
    const mockReply = `Hello! I'm NutriChef. Since we are running in development/mock mode, I'm happy to assist you. 

Here are some tips for a balanced diet:
1. **Incorporate variety**: Eat a range of colorful vegetables, lean proteins, and whole grains.
2. **Hydrate**: Drink plenty of water throughout the day.
3. **Be mindful of peanut allergies**: If you have allergies, check labels carefully and use substitutes like sunflower seed butter.

Let me know if you want me to generate some recipes or review your meal plan!`;

    // Stream mock tokens
    const tokens = mockReply.split(' ');
    for (const token of tokens) {
      onToken(token + ' ');
      await new Promise((res) => setTimeout(res, 80));
    }
    return;
  }

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
  } catch (err) {
    console.error('[AI Service] Claude streaming error:', err);
    throw new AppError('Nutrition assistant communication failed.', 502);
  }
};

/**
 * Consolidate and categorize grocery items using AI.
 */
export const generateGroceryListFromMealPlan = async (mealPlanDoc) => {
  // Extract all ingredients from the meal plan
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

  if (isMockMode) {
    await new Promise((res) => setTimeout(res, 1000));
    // Concat / aggregate manually for mock
    const categoriesMap = {
      'Bread': 'Pantry',
      'Avocado': 'Produce',
      'Egg': 'Dairy',
      'Salmon Fillet': 'Protein',
      'Quinoa': 'Pantry',
      'Asparagus': 'Produce',
      'Tortilla Wrap': 'Pantry',
      'Turkey Breast': 'Protein',
      'Spinach': 'Produce',
      'Greek Yogurt': 'Dairy',
      'Blueberries': 'Produce',
      'Honey': 'Pantry'
    };

    const aggregated = {};
    rawIngredients.forEach(ing => {
      const key = ing.name.trim();
      if (aggregated[key]) {
        aggregated[key].quantity += ing.quantity;
      } else {
        aggregated[key] = {
          name: key,
          quantity: ing.quantity,
          unit: ing.unit || '',
          checked: false,
          category: categoriesMap[key] || 'Other'
        };
      }
    });

    return {
      items: Object.values(aggregated)
    };
  }

  const systemPrompt = `You are an expert culinary coordinator. You will receive a list of ingredients compiled from a 7-day meal plan. Your task is to aggregate them and return a valid JSON object matching the schema below.
Rules:
1. Merge duplicate ingredients of the same name (e.g. "Chicken Breast" and "chicken breasts" -> "Chicken Breast").
2. Sum up their quantities if they have the same unit. If the units differ (e.g. grams vs pieces), do your best to convert them to a unified format or represent them clearly.
3. Categorize every ingredient into exactly one of these: Produce, Dairy, Protein, Pantry, Spices, Other.
4. Output ONLY the raw JSON object. Do not wrap in markdown syntax.

Schema:
{
  "items": [
    { "name": "Ingredient Name", "quantity": number, "unit": "unit", "category": "Produce/Dairy/Protein/Pantry/Spices/Other" }
  ]
}`;

  const userPrompt = `Aggregate and categorize these ingredients:
${JSON.stringify(rawIngredients, null, 2)}`;

  let attempts = 2;
  while (attempts > 0) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 2500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const responseText = response.content[0].text;
      return parseJSONResponse(responseText);
    } catch (err) {
      console.error(`[AI Service] Grocery consolidation attempt failed: ${err.message}`);
      attempts -= 1;
      if (attempts === 0) {
        throw new AppError('AI grocery list compilation failed. Please try again.', 502);
      }
    }
  }
};
