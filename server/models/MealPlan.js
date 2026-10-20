import mongoose from 'mongoose';

const dailyMealsSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: [true, 'Day of the week is required (e.g. Monday)'],
      enum: {
        values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        message: 'Day must be a valid day of the week',
      },
    },
    meals: {
      breakfast: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        required: [true, 'Breakfast meal reference is required'],
      },
      lunch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        required: [true, 'Lunch meal reference is required'],
      },
      dinner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        required: [true, 'Dinner meal reference is required'],
      },
      snacks: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Recipe',
        },
      ],
    },
  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Meal plan must belong to a user'],
    },
    weekStartDate: {
      type: Date,
      required: [true, 'Week start date is required'],
    },
    goal: {
      type: String,
      required: [true, 'Meal plan goal is required'],
      trim: true,
    },
    days: {
      type: [dailyMealsSchema],
      validate: [
        (arr) => arr.length === 7,
        'A meal plan must cover exactly 7 days',
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup of a user's recent meal plan
mealPlanSchema.index({ user: 1, weekStartDate: -1 });

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

export default MealPlan;
