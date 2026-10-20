import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

// Config & Middleware
import connectDB from './config/db.js';
import globalErrorHandler from './middleware/error.js';
import AppError from './utils/appError.js';

// Sockets & Routes
import { initChatSocket } from './sockets/chatSocket.js';
import authRouter from './routes/authRoutes.js';
import recipeRouter from './routes/recipeRoutes.js';
import mealPlanRouter from './routes/mealPlanRoutes.js';
import groceryRouter from './routes/groceryRoutes.js';
import chatRouter from './routes/chatRoutes.js';

// Connect DB
connectDB();

const app = express();
const httpServer = createServer(app);

// Setup Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initChatSocket(io);

// Security Headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ].filter(Boolean),
    credentials: true,
  })
);

// Morgan logger in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Request parsers with size limit controls
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mounted Routes
app.use('/api/auth', authRouter);
app.use('/api/recipes', recipeRouter);
app.use('/api/meal-plans', mealPlanRouter);
app.use('/api/grocery-lists', groceryRouter);
app.use('/api/chat', chatRouter);

// Catch-all route handler for non-existent endpoints
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler Middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`[Server] running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export { app, httpServer };
