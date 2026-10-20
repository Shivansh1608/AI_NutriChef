import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Ingredient quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipe must belong to a user'],
    },
    title: {
      type: String,
      required: [true, 'Recipe title is required'],
      trim: true,
    },
    ingredients: {
      type: [ingredientSchema],
      validate: [
        (arr) => arr.length > 0,
        'Recipe must have at least one ingredient',
      ],
    },
    steps: {
      type: [String],
      validate: [
        (arr) => arr.length > 0,
        'Recipe must have at least one cooking step',
      ],
    },
    nutrition: {
      calories: {
        type: Number,
        required: [true, 'Calories target is required'],
        min: [0, 'Calories cannot be negative'],
      },
      protein: {
        type: Number,
        required: [true, 'Protein content is required'],
        min: [0, 'Protein cannot be negative'],
      },
      carbs: {
        type: Number,
        required: [true, 'Carbohydrates content is required'],
        min: [0, 'Carbohydrates cannot be negative'],
      },
      fats: {
        type: Number,
        required: [true, 'Fats content is required'],
        min: [0, 'Fats cannot be negative'],
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    mealType: {
      type: String,
      required: [true, 'Meal type is required'],
      enum: {
        values: ['breakfast', 'lunch', 'dinner', 'snack'],
        message: 'Meal type must be: breakfast, lunch, dinner, or snack',
      },
    },
    source: {
      type: String,
      enum: {
        values: ['ai_generated', 'user_created'],
        message: 'Source must be: ai_generated or user_created',
      },
      default: 'ai_generated',
    },
    isSaved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query speed
recipeSchema.index({ user: 1, mealType: 1 });
recipeSchema.index({ user: 1, tags: 1 });

const Recipe = mongoose.model('Recipe', recipeSchema);

export default Recipe;
