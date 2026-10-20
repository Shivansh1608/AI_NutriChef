import Recipe from '../models/Recipe.js';
import * as aiService from '../services/aiService.js';
import AppError from '../utils/appError.js';

export const generateRecipePreview = async (req, res, next) => {
  try {
    const { ingredients, dietGoal, mealType, allergies, cuisinePreference } = req.body;

    const recipeData = await aiService.generateRecipe({
      ingredients,
      dietGoal,
      mealType,
      allergies,
      cuisinePreference,
    });

    res.status(200).json({
      success: true,
      message: 'Recipe generated successfully',
      data: {
        recipe: recipeData,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const saveRecipe = async (req, res, next) => {
  try {
    const { title, ingredients, steps, nutrition, tags, mealType, source } = req.body;

    const recipe = await Recipe.create({
      user: req.user._id,
      title,
      ingredients,
      steps,
      nutrition,
      tags: tags || [],
      mealType,
      source: source || 'ai_generated',
      isSaved: true,
    });

    res.status(201).json({
      success: true,
      message: 'Recipe saved successfully',
      data: {
        recipe,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getSavedRecipes = async (req, res, next) => {
  try {
    const { tag, mealType, page = 1, limit = 9 } = req.query;

    const query = { user: req.user._id, isSaved: true };

    if (tag) {
      query.tags = { $in: [tag] };
    }
    if (mealType) {
      query.mealType = mealType;
    }

    const skipIndex = (Number(page) - 1) * Number(limit);

    const total = await Recipe.countDocuments(query);
    const recipes = await Recipe.find(query)
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: {
        recipes,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return next(new AppError('Recipe not found', 404));
    }

    // Verify ownership
    if (recipe.user.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to delete this recipe', 403));
    }

    // If it's linked in a meal plan, we might want to flag isSaved as false rather than deleting 
    // to preserve reference integrity, or delete directly if not linked.
    // To make it simple and reliable: just set isSaved = false so the user doesn't see it,
    // or delete it. Since it has a user ref, deleting is fine. Let's delete it.
    await Recipe.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Recipe deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
