import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import AppError from '../utils/appError.js';

const signToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'development_secret_key_12345',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    message: statusCode === 201 ? 'User registered successfully' : 'User logged in successfully',
    data: {
      token,
      user,
    },
  });
};

export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errMsgs = errors.array().map((err) => err.msg).join('. ');
      return next(new AppError(errMsgs, 400));
    }

    const { name, email, password, profile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email address is already in use.', 409)); // 409 Conflict
    }

    const user = await User.create({
      name,
      email,
      password,
      profile: profile || {},
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errMsgs = errors.array().map((err) => err.msg).join('. ');
      return next(new AppError(errMsgs, 400));
    }

    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // 2) Check if user exists & password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 3) If everything ok, send token to client
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    // req.user was attached by protect middleware
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { dietGoal, allergies, cuisinePreference, dailyCalorieTarget } = req.body;

    // Find and update user profile field values
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (dietGoal) user.profile.dietGoal = dietGoal;
    if (allergies !== undefined) user.profile.allergies = allergies;
    if (cuisinePreference !== undefined) user.profile.cuisinePreference = cuisinePreference;
    if (dailyCalorieTarget !== undefined) user.profile.dailyCalorieTarget = dailyCalorieTarget;

    await user.save({ validateBeforeSave: true });

    // Clean password from output just in case
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};
