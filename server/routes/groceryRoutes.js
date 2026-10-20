import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  generateGroceryList,
  getGroceryListById,
  toggleGroceryItem,
  getSavedGroceryLists,
} from '../controllers/groceryController.js';

const router = express.Router();

router.use(protect);

router.post('/generate/:mealPlanId', generateGroceryList);
router.get('/', getSavedGroceryLists);
router.get('/:id', getGroceryListById);
router.patch('/:id/items/:itemId', toggleGroceryItem);

export default router;
