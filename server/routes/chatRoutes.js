import express from 'express';
import { protect } from '../middleware/auth.js';
import { getChatHistory } from '../controllers/chatController.js';

const router = express.Router();

router.use(protect);

router.get('/history/:sessionId', getChatHistory);

export default router;
