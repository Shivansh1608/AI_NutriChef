import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Sparkles, ShoppingBag, Eye, Clock, Flame, ChevronRight, X } from 'lucide-react';

const fetchMealPlans = async () => {
  const res = await api.get('/meal-plans');
  return res.data.data.mealPlans;
};

const MealPlanner = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Local selection states
  const [dietGoal, setDietGoal] = useState(user?.profile?.dietGoal || 'maintenance');
  const [calorieTarget, setCalorieTarget] = useState(user?.profile?.dailyCalorieTarget || 2000);
  const [activeDay, setActiveDay] = useState('Monday');
  const [selectedRecipe, setSelectedRecipe] = useState(null); // For recipe detail modal

  // Fetch meal plans
  const { data: mealPlans, isLoading, isError } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: fetchMealPlans,
  });

  const activePlan = mealPlans?.[0]; // Get the most recent meal plan

  // Mutation: Generate Weekly Plan
  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/meal-plans/generate', {
        dietGoal,
        dailyCalorieTarget: Number(calorieTarget),
      });
      return res.data.data.mealPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mealPlans']);
      toast.success('Successfully generated 7-day meal plan!');
    },
    onError: (err) => {
      console.error('[MealPlanner] Error generating plan:', err);
      const errMsg = err.response?.data?.message || 'Failed to generate weekly meal plan.';
      toast.error(errMsg);
    },
  });

  // Mutation: Generate Grocery List
  const generateGroceryMutation = useMutation({
    mutationFn: async (planId) => {
      const res = await api.post(`/grocery-lists/generate/${planId}`);
      return res.data.data.groceryList;
    },
    onSuccess: (groceryList) => {
      queryClient.invalidateQueries(['groceryLists']);
      toast.success('Grocery list compiled successfully!');
      navigate('/grocery-list', { state: { selectedListId: groceryList._id } });
    },
    onError: (err) => {
      console.error('[MealPlanner] Error compiling grocery list:', err);
      const errMsg = err.response?.data?.message || 'Failed to generate grocery list.';
      toast.error(errMsg);
    },
  });

  const handleGeneratePlan = () => {
    generatePlanMutation.mutate();
  };

  const handleGenerateGrocery = () => {
    if (!activePlan) return;
    generateGroceryMutation.mutate(activePlan._id);
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Calculate daily totals for calories and protein
  const getDayTotals = (dayName) => {
    if (!activePlan) return { calories: 0, protein: 0 };
    const dayData = activePlan.days.find((d) => d.day === dayName);
    if (!dayData) return { calories: 0, protein: 0 };

    const meals = [dayData.meals.breakfast, dayData.meals.lunch, dayData.meals.dinner];
    const snacks = dayData.meals.snacks || [];

    let calories = 0;
    let protein = 0;

    meals.forEach((meal) => {
      if (meal && meal.nutrition) {
        calories += meal.nutrition.calories || 0;
        protein += meal.nutrition.protein || 0;
      }
    });

    snacks.forEach((snack) => {
      if (snack && snack.nutrition) {
        calories += snack.nutrition.calories || 0;
        protein += snack.nutrition.protein || 0;
      }
    });

    return { calories, protein };
  };

  const activeDayMeals = activePlan?.days.find((d) => d.day === activeDay)?.meals;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* 1. Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-emerald-500" size={22} /> Weekly Meal Planner
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Generate and manage your custom 7-day nutritional strategy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Diet Goal select */}
          <select
            value={dietGoal}
            onChange={(e) => setDietGoal(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500"
          >
            <option value="weight_loss">Weight Loss</option>
            <option value="muscle_gain">Muscle Gain</option>
            <option value="maintenance">Maintenance</option>
          </select>

          {/* Calorie select */}
          <input
            type="number"
            placeholder="Calories"
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg w-24 focus:outline-none focus:border-emerald-500"
          />

          <button
            onClick={handleGeneratePlan}
            disabled={generatePlanMutation.isPending}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Sparkles size={14} />
            {generatePlanMutation.isPending ? 'Generating...' : 'Generate New Plan'}
          </button>
        </div>
      </div>

      {/* 2. Main Planner Board */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4 mx-auto"></div>
          <div className="h-10 bg-slate-100 rounded w-3/4 mx-auto"></div>
          <div className="grid grid-cols-4 gap-6 mt-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-32 bg-slate-50 rounded-xl"></div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-red-600">
          Failed to fetch meal plans. Please reload the page.
        </div>
      ) : !activePlan ? (
        // No Active Plan State
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center min-h-[300px]">
          <Calendar className="text-slate-300 mb-4" size={48} />
          <h3 className="font-bold text-slate-700 text-base">No Weekly Plan Active</h3>
          <p className="text-slate-500 text-xs mt-2 max-w-sm">
            You don't have an active meal plan for this week. Use the generator options above to request a custom 7-day guide.
          </p>
        </div>
      ) : (
        // Active Plan State
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Days Navigation Column */}
          <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">Weekly Schedule</h3>
            {daysOfWeek.map((dayName) => {
              const totals = getDayTotals(dayName);
              const isActive = activeDay === dayName;
              return (
                <button
                  key={dayName}
                  onClick={() => setActiveDay(dayName)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex justify-between items-center cursor-pointer ${
                    isActive ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{dayName}</p>
                    <p className={`text-[10px] ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {totals.calories} kcal • {totals.protein}g protein
                    </p>
                  </div>
                  <ChevronRight size={14} className={isActive ? 'text-emerald-600' : 'text-slate-300'} />
                </button>
              );
            })}

            <div className="pt-4 border-t border-slate-100 mt-4 px-3">
              <button
                onClick={handleGenerateGrocery}
                disabled={generateGroceryMutation.isPending}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <ShoppingBag size={13} />
                {generateGroceryMutation.isPending ? 'Compiling...' : 'Compile Shopping List'}
              </button>
            </div>
          </div>

          {/* Meals Display Cards Grid */}
          <div className="lg:col-span-9 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">{activeDay} Meal Details</h2>
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                Daily Totals: {getDayTotals(activeDay).calories} kcal
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Breakfast Card */}
              {activeDayMeals?.breakfast && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Breakfast
                      </span>
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-0.5">
                        <Flame size={12} className="text-orange-500" />
                        {activeDayMeals.breakfast.nutrition?.calories} kcal
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{activeDayMeals.breakfast.title}</h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {activeDayMeals.breakfast.steps?.[0] || 'No description available.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRecipe(activeDayMeals.breakfast)}
                    className="mt-4 pt-3 border-t border-slate-50 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye size={12} /> View Complete Recipe
                  </button>
                </div>
              )}

              {/* Lunch Card */}
              {activeDayMeals?.lunch && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Lunch
                      </span>
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-0.5">
                        <Flame size={12} className="text-orange-500" />
                        {activeDayMeals.lunch.nutrition?.calories} kcal
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{activeDayMeals.lunch.title}</h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {activeDayMeals.lunch.steps?.[0] || 'No description available.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRecipe(activeDayMeals.lunch)}
                    className="mt-4 pt-3 border-t border-slate-50 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye size={12} /> View Complete Recipe
                  </button>
                </div>
              )}

              {/* Dinner Card */}
              {activeDayMeals?.dinner && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Dinner
                      </span>
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-0.5">
                        <Flame size={12} className="text-orange-500" />
                        {activeDayMeals.dinner.nutrition?.calories} kcal
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{activeDayMeals.dinner.title}</h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {activeDayMeals.dinner.steps?.[0] || 'No description available.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRecipe(activeDayMeals.dinner)}
                    className="mt-4 pt-3 border-t border-slate-50 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye size={12} /> View Complete Recipe
                  </button>
                </div>
              )}

              {/* Snack Card */}
              {activeDayMeals?.snacks && activeDayMeals.snacks.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Snack
                      </span>
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-0.5">
                        <Flame size={12} className="text-orange-500" />
                        {activeDayMeals.snacks[0].nutrition?.calories} kcal
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{activeDayMeals.snacks[0].title}</h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {activeDayMeals.snacks[0].steps?.[0] || 'No description available.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRecipe(activeDayMeals.snacks[0])}
                    className="mt-4 pt-3 border-t border-slate-50 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye size={12} /> View Complete Recipe
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Recipe Detail Modal Backdrop */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {selectedRecipe.mealType}
                </span>
                <h3 className="font-bold text-slate-800 text-base mt-2">{selectedRecipe.title}</h3>
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Macros */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-center">
                  <p className="text-[9px] uppercase text-slate-400 font-semibold">Calories</p>
                  <p className="text-xs font-bold text-slate-700">{selectedRecipe.nutrition?.calories} kcal</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] uppercase text-slate-400 font-semibold">Protein</p>
                  <p className="text-xs font-bold text-slate-700">{selectedRecipe.nutrition?.protein}g</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] uppercase text-slate-400 font-semibold">Carbs</p>
                  <p className="text-xs font-bold text-slate-700">{selectedRecipe.nutrition?.carbs}g</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] uppercase text-slate-400 font-semibold">Fats</p>
                  <p className="text-xs font-bold text-slate-700">{selectedRecipe.nutrition?.fats}g</p>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100">
                  Ingredients
                </h4>
                <ul className="space-y-1 text-xs text-slate-600">
                  {selectedRecipe.ingredients?.map((ing, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-emerald-500 font-semibold">•</span>
                      <span>
                        <span className="font-semibold text-slate-800">
                          {ing.quantity} {ing.unit}
                        </span>{' '}
                        {ing.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Steps */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100">
                  Steps
                </h4>
                <ol className="space-y-2.5 text-xs text-slate-600">
                  {selectedRecipe.steps?.map((step, idx) => (
                    <li key={idx} className="flex gap-2.5 leading-relaxed">
                      <span className="flex-shrink-0 h-4.5 w-4.5 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center font-bold text-[9px]">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanner;
