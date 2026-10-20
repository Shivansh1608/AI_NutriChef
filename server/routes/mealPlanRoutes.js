import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import {
  generateWeeklyMealPlan,
  getMealPlans,
  getMealPlanById,
} from '../controllers/mealPlanController.js';

const router = express.Router();

router.use(protect);

router.post(
  '/generate',
  aiRateLimiter,
  [
    body('dietGoal')
      .optional()
      .isIn(['weight_loss', 'muscle_gain', 'maintenance'])
      .withMessage('Invalid diet goal'),
    body('dailyCalorieTarget')
      .optional()
      .isNumeric()
      .withMessage('Daily calorie target must be a number'),
  ],
  generateWeeklyMealPlan
);

router.get('/', getMealPlans);
router.get('/:id', getMealPlanById);

export default router;
