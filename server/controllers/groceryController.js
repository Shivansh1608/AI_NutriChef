import GroceryList from '../models/GroceryList.js';
import MealPlan from '../models/MealPlan.js';
import * as aiService from '../services/aiService.js';
import AppError from '../utils/appError.js';

export const generateGroceryList = async (req, res, next) => {
  try {
    const { mealPlanId } = req.params;

    // 1) Find the meal plan and verify ownership
    const mealPlan = await MealPlan.findById(mealPlanId).populate({
      path: 'days.meals.breakfast days.meals.lunch days.meals.dinner days.meals.snacks',
      model: 'Recipe',
    });

    if (!mealPlan) {
      return next(new AppError('Meal plan not found', 404));
    }

    if (mealPlan.user.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to access this resource', 403));
    }

    // 2) Compile the grocery list via the AI service
    const groceryData = await aiService.generateGroceryListFromMealPlan(mealPlan);

    // 3) Create and save GroceryList document
    const groceryList = await GroceryList.create({
      user: req.user._id,
      mealPlan: mealPlanId,
      items: groceryData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit || '',
        category: item.category || 'Other',
        checked: false,
      })),
      generatedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Grocery list generated successfully',
      data: {
        groceryList,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getGroceryListById = async (req, res, next) => {
  try {
    const groceryList = await GroceryList.findById(req.params.id);

    if (!groceryList) {
      return next(new AppError('Grocery list not found', 404));
    }

    // Verify ownership
    if (groceryList.user.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to view this grocery list', 403));
    }

    res.status(200).json({
      success: true,
      data: {
        groceryList,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const toggleGroceryItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;

    const groceryList = await GroceryList.findById(id);
    if (!groceryList) {
      return next(new AppError('Grocery list not found', 404));
    }

    // Verify ownership
    if (groceryList.user.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to modify this grocery list', 403));
    }

    // Find the subdocument item
    const item = groceryList.items.id(itemId);
    if (!item) {
      return next(new AppError('Item not found in grocery list', 404));
    }

    // Toggle checked state
    item.checked = !item.checked;
    await groceryList.save();

    res.status(200).json({
      success: true,
      message: 'Item status updated successfully',
      data: {
        groceryList,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getSavedGroceryLists = async (req, res, next) => {
  try {
    const lists = await GroceryList.find({ user: req.user._id }).sort({ generatedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        groceryLists: lists,
      },
    });
  } catch (err) {
    next(err);
  }
};
