import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Recipe from '../models/Recipe.js';
import MealPlan from '../models/MealPlan.js';
import GroceryList from '../models/GroceryList.js';
import ChatMessage from '../models/ChatMessage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure env path relative to script location
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDB = async () => {
  const connUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-nutrichef';
  
  try {
    await mongoose.connect(connUri);
    console.log('[Seeder] Connected to MongoDB');

    // Clean current databases
    await User.deleteMany({});
    await Recipe.deleteMany({});
    await MealPlan.deleteMany({});
    await GroceryList.deleteMany({});
    await ChatMessage.deleteMany({});
    console.log('[Seeder] Cleared all existing database collections');

    // 1. Create a demo user
    const demoUser = await User.create({
      name: 'Shivansh',
      email: 'demo@example.com',
      password: 'password123', // Will be hashed via pre-save hook
      profile: {
        dietGoal: 'weight_loss',
        allergies: ['peanuts'],
        cuisinePreference: 'Indian',
        dailyCalorieTarget: 1800,
      },
    });
    console.log(`[Seeder] Created Demo User: ${demoUser.name} (${demoUser.email})`);

    // 2. Create sample recipes
    const avocadoToast = await Recipe.create({
      user: demoUser._id,
      title: 'Protein Avocado Toast',
      ingredients: [
        { name: 'Whole Wheat Bread', quantity: 2, unit: 'slices' },
        { name: 'Avocado', quantity: 1, unit: 'whole' },
        { name: 'Egg', quantity: 2, unit: 'large' },
        { name: 'Cherry Tomatoes', quantity: 50, unit: 'g' },
      ],
      steps: [
        'Toast the whole wheat bread slices until golden brown.',
        'Mash the avocado in a small bowl with a pinch of salt and pepper.',
        'Poach or fry the eggs to your preference (sunny-side up recommended).',
        'Spread mashed avocado over toast, top with cooked eggs and sliced cherry tomatoes.',
      ],
      nutrition: {
        calories: 450,
        protein: 22,
        carbs: 35,
        fats: 25,
      },
      tags: ['Quick', 'High-Protein', 'Breakfast'],
      mealType: 'breakfast',
      source: 'user_created',
      isSaved: true,
    });

    const lemonChicken = await Recipe.create({
      user: demoUser._id,
      title: 'Grilled Lemon Herb Chicken',
      ingredients: [
        { name: 'Chicken Breast', quantity: 200, unit: 'g' },
        { name: 'Lemon Juice', quantity: 2, unit: 'tbsp' },
        { name: 'Olive Oil', quantity: 1, unit: 'tbsp' },
        { name: 'Garlic Cloves', quantity: 2, unit: 'cloves' },
        { name: 'Broccoli', quantity: 150, unit: 'g' },
        { name: 'Brown Rice', quantity: 100, unit: 'g' },
      ],
      steps: [
        'Marinate the chicken breast in lemon juice, olive oil, minced garlic, and herbs for 15 minutes.',
        'Cook brown rice according to packet instructions.',
        'Grill the chicken breast in a hot pan for 6-8 minutes on each side until fully cooked.',
        'Steam the broccoli florets for 5 minutes.',
        'Serve grilled chicken alongside brown rice and steamed broccoli.',
      ],
      nutrition: {
        calories: 520,
        protein: 42,
        carbs: 45,
        fats: 14,
      },
      tags: ['High-Protein', 'Low-Fat', 'Dinner'],
      mealType: 'dinner',
      source: 'ai_generated',
      isSaved: true,
    });

    const berryShake = await Recipe.create({
      user: demoUser._id,
      title: 'Berry Protein Shake',
      ingredients: [
        { name: 'Whey Protein Powder', quantity: 1, unit: 'scoop' },
        { name: 'Mixed Berries (Frozen)', quantity: 100, unit: 'g' },
        { name: 'Almond Milk (Unsweetened)', quantity: 250, unit: 'ml' },
        { name: 'Chia Seeds', quantity: 1, unit: 'tbsp' },
      ],
      steps: [
        'Add almond milk, mixed berries, whey protein powder, and chia seeds into a high-speed blender.',
        'Blend on high for 45-60 seconds until smooth and creamy.',
        'Pour into a shaker or glass and serve immediately.',
      ],
      nutrition: {
        calories: 280,
        protein: 30,
        carbs: 18,
        fats: 8,
      },
      tags: ['Shake', 'Snack', 'High-Protein'],
      mealType: 'snack',
      source: 'ai_generated',
      isSaved: true,
    });

    console.log('[Seeder] Created 3 Sample Recipes');

    // 3. Create a sample MealPlan
    const startOfWeek = new Date();
    // Set to previous Monday to represent the beginning of the week
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const daysData = daysOfWeek.map((dayName) => ({
      day: dayName,
      meals: {
        breakfast: avocadoToast._id,
        lunch: lemonChicken._id, // reuse for simplicity of demo
        dinner: lemonChicken._id,
        snacks: [berryShake._id],
      },
    }));

    const sampleMealPlan = await MealPlan.create({
      user: demoUser._id,
      weekStartDate: startOfWeek,
      goal: 'weight_loss',
      days: daysData,
    });
    console.log(`[Seeder] Created MealPlan for week starting ${startOfWeek.toDateString()}`);

    // 4. Create a GroceryList
    await GroceryList.create({
      user: demoUser._id,
      mealPlan: sampleMealPlan._id,
      items: [
        { name: 'Whole Wheat Bread', quantity: 14, unit: 'slices', checked: false, category: 'Pantry' },
        { name: 'Avocado', quantity: 7, unit: 'whole', checked: false, category: 'Produce' },
        { name: 'Egg', quantity: 14, unit: 'large', checked: true, category: 'Dairy' },
        { name: 'Cherry Tomatoes', quantity: 350, unit: 'g', checked: false, category: 'Produce' },
        { name: 'Chicken Breast', quantity: 2800, unit: 'g', checked: false, category: 'Protein' },
        { name: 'Broccoli', quantity: 2100, unit: 'g', checked: false, category: 'Produce' },
        { name: 'Brown Rice', quantity: 1400, unit: 'g', checked: false, category: 'Pantry' },
        { name: 'Whey Protein Powder', quantity: 7, unit: 'scoop', checked: false, category: 'Other' },
      ],
      generatedAt: new Date(),
    });
    console.log('[Seeder] Created GroceryList');

    // 5. Create some sample ChatMessages
    const mockSession = 'session-12345';
    await ChatMessage.create([
      {
        user: demoUser._id,
        sessionId: mockSession,
        role: 'user',
        content: 'Hi, I need a high-protein breakfast idea that does not contain peanuts.',
      },
      {
        user: demoUser._id,
        sessionId: mockSession,
        role: 'assistant',
        content: 'Hello Shivansh! Since you are looking for a peanut-free high-protein breakfast, I highly recommend a Spinach and Mushroom Egg Omelette. It is packed with high-quality protein from eggs and is completely peanut-free. You can also pair it with avocado toast on whole wheat bread for healthy fats and slow-digesting carbs.',
      },
    ]);
    console.log('[Seeder] Created Chat Message logs');

    console.log('[Seeder] Seeding database successfully completed!');
  } catch (err) {
    console.error('[Seeder] Critical database seeding error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[Seeder] Disconnected from MongoDB');
  }
};

seedDB();
