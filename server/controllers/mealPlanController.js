import MealPlan from '../models/MealPlan.js';
import Recipe from '../models/Recipe.js';
import * as aiService from '../services/aiService.js';
import AppError from '../utils/appError.js';

export const generateWeeklyMealPlan = async (req, res, next) => {
  try {
    const { dietGoal, allergies, cuisinePreference, dailyCalorieTarget } = req.body;

    // 1) Request meal plan structure from AI
    const mealPlanData = await aiService.generateWeeklyMealPlan({
      dietGoal,
      allergies,
      cuisinePreference,
      dailyCalorieTarget,
    });

    // 2) Parse the generated daily plans and save Recipe documents for each meal
    const daysData = [];

    for (const dayPlan of mealPlanData.days) {
      const { day, meals } = dayPlan;

      // Save breakfast
      const breakfastDoc = await Recipe.create({
        user: req.user._id,
        title: meals.breakfast.title,
        ingredients: meals.breakfast.ingredients,
        steps: meals.breakfast.steps,
        nutrition: meals.breakfast.nutrition,
        mealType: 'breakfast',
        tags: ['MealPlan', day],
        source: 'ai_generated',
        isSaved: false, // Not favorited/saved to gallery yet
      });

      // Save lunch
      const lunchDoc = await Recipe.create({
        user: req.user._id,
        title: meals.lunch.title,
        ingredients: meals.lunch.ingredients,
        steps: meals.lunch.steps,
        nutrition: meals.lunch.nutrition,
        mealType: 'lunch',
        tags: ['MealPlan', day],
        source: 'ai_generated',
        isSaved: false,
      });

      // Save dinner
      const dinnerDoc = await Recipe.create({
        user: req.user._id,
        title: meals.dinner.title,
        ingredients: meals.dinner.ingredients,
        steps: meals.dinner.steps,
        nutrition: meals.dinner.nutrition,
        mealType: 'dinner',
        tags: ['MealPlan', day],
        source: 'ai_generated',
        isSaved: false,
      });

      // Save snacks (supports single or array of snacks)
      const snackIds = [];
      const snacksInput = Array.isArray(meals.snacks) ? meals.snacks : [meals.snacks].filter(Boolean);
      
      for (const snack of snacksInput) {
        const snackDoc = await Recipe.create({
          user: req.user._id,
          title: snack.title,
          ingredients: snack.ingredients,
          steps: snack.steps,
          nutrition: snack.nutrition,
          mealType: 'snack',
          tags: ['MealPlan', day],
          source: 'ai_generated',
          isSaved: false,
        });
        snackIds.push(snackDoc._id);
      }

      daysData.push({
        day,
        meals: {
          breakfast: breakfastDoc._id,
          lunch: lunchDoc._id,
          dinner: dinnerDoc._id,
          snacks: snackIds,
        },
      });
    }

    // Determine week start date (previous or current Monday)
    const weekStartDate = new Date();
    const currentDay = weekStartDate.getDay();
    const diff = weekStartDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    weekStartDate.setDate(diff);
    weekStartDate.setHours(0, 0, 0, 0);

    // 3) Create MealPlan document
    const newMealPlan = await MealPlan.create({
      user: req.user._id,
      weekStartDate,
      goal: dietGoal || 'balanced',
      days: daysData,
    });

    // Populate the newly created meal plan to return rich data
    const populatedPlan = await MealPlan.findById(newMealPlan._id).populate({
      path: 'days.meals.breakfast days.meals.lunch days.meals.dinner days.meals.snacks',
      model: 'Recipe',
    });

    res.status(201).json({
      success: true,
      message: 'Weekly meal plan generated successfully',
      data: {
        mealPlan: populatedPlan,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getMealPlans = async (req, res, next) => {
  try {
    const mealPlans = await MealPlan.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'days.meals.breakfast days.meals.lunch days.meals.dinner days.meals.snacks',
        model: 'Recipe',
      });

    res.status(200).json({
      success: true,
      data: {
        mealPlans,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getMealPlanById = async (req, res, next) => {
  try {
    const mealPlan = await MealPlan.findById(req.params.id).populate({
      path: 'days.meals.breakfast days.meals.lunch days.meals.dinner days.meals.snacks',
      model: 'Recipe',
    });

    if (!mealPlan) {
      return next(new AppError('Meal plan not found', 404));
    }

    // Verify ownership
    if (mealPlan.user.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to view this meal plan', 403));
    }

    res.status(200).json({
      success: true,
      data: {
        mealPlan,
      },
    });
  } catch (err) {
    next(err);
  }
};
