import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import {
  generateRecipePreview,
  saveRecipe,
  getSavedRecipes,
  deleteRecipe,
} from '../controllers/recipeController.js';

const router = express.Router();

// Apply authentication to all routes below
router.use(protect);

router.post(
  '/generate',
  aiRateLimiter,
  [
    body('ingredients').isArray().withMessage('Ingredients must be an array'),
    body('dietGoal')
      .optional()
      .isIn(['weight_loss', 'muscle_gain', 'maintenance'])
      .withMessage('Invalid diet goal'),
  ],
  generateRecipePreview
);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Recipe title is required'),
    body('ingredients').isArray({ min: 1 }).withMessage('Recipe must have at least one ingredient'),
    body('steps').isArray({ min: 1 }).withMessage('Recipe must have at least one cooking step'),
    body('nutrition.calories').isNumeric().withMessage('Calories must be a number'),
    body('nutrition.protein').isNumeric().withMessage('Protein must be a number'),
    body('nutrition.carbs').isNumeric().withMessage('Carbohydrates must be a number'),
    body('nutrition.fats').isNumeric().withMessage('Fats must be a number'),
    body('mealType').isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  ],
  saveRecipe
);

router.get('/', getSavedRecipes);
router.delete('/:id', deleteRecipe);

export default router;
