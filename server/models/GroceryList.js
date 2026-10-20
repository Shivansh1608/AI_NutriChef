import mongoose from 'mongoose';

const groceryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Item quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      default: '',
      trim: true,
    },
    checked: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      required: [true, 'Item category is required'],
      default: 'Produce',
      enum: {
        values: ['Produce', 'Dairy', 'Protein', 'Pantry', 'Spices', 'Other'],
        message: 'Category must be: Produce, Dairy, Protein, Pantry, Spices, or Other',
      },
    },
  },
  { _id: true } // We keep _id for subdocuments so we can PATCH individual item checklist states
);

const groceryListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Grocery list must belong to a user'],
    },
    mealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealPlan',
      required: [true, 'Grocery list must reference a meal plan'],
    },
    items: [groceryItemSchema],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
groceryListSchema.index({ user: 1, mealPlan: 1 });

const GroceryList = mongoose.model('GroceryList', groceryListSchema);

export default GroceryList;
