import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/appError.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    // 1) Getting token and check if it exists
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verification of token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_secret_key_12345');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Your token has expired! Please log in again.', 401));
      }
      return next(new AppError('Invalid token. Please log in again!', 401));
    }

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 4) Grant access to protected route
    req.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};
