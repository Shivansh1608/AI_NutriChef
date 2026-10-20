import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Sparkles, Flame, ShieldAlert, CheckCircle, ClipboardList, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const RecipeGenerator = () => {
  const navigate = useNavigate();

  // Form states
  const [ingredients, setIngredients] = useState([]);
  const [ingInput, setIngInput] = useState('');
  const [dietGoal, setDietGoal] = useState('maintenance');
  const [mealType, setMealType] = useState('breakfast');
  const [allergies, setAllergies] = useState([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [cuisinePreference, setCuisinePreference] = useState('');

  // Execution states
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [error, setError] = useState(null);

  // Ingredient pill handlers
  const handleAddIngredient = (e) => {
    e.preventDefault();
    const val = ingInput.trim();
    if (val && !ingredients.includes(val)) {
      setIngredients([...ingredients, val]);
      setIngInput('');
    }
  };

  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Allergy pill handlers
  const handleAddAllergy = (e) => {
    e.preventDefault();
    const val = allergyInput.trim();
    if (val && !allergies.includes(val)) {
      setAllergies([...allergies, val]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (index) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  // Generate recipe via API
  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (ingredients.length === 0) {
      toast.error('Please enter at least one ingredient');
      return;
    }

    setGenerating(true);
    setGeneratedRecipe(null);
    setHasSaved(false);
    setError(null);

    try {
      const res = await api.post('/recipes/generate', {
        ingredients,
        dietGoal,
        mealType,
        allergies,
        cuisinePreference: cuisinePreference.trim() || undefined,
      });

      setGeneratedRecipe(res.data.data.recipe);
      toast.success('Recipe generated successfully!');
    } catch (err) {
      console.error('[RecipeGenerator] Error generating recipe:', err);
      const errMsg = err.response?.data?.message || 'Error occurred while generating the recipe. Please try again.';
      setError(errMsg);
      toast.error('Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  // Save recipe via API
  const handleSave = async () => {
    if (!generatedRecipe || hasSaved) return;

    setSaving(true);
    try {
      await api.post('/recipes', {
        title: generatedRecipe.title,
        ingredients: generatedRecipe.ingredients,
        steps: generatedRecipe.steps,
        nutrition: generatedRecipe.nutrition,
        mealType: mealType,
        tags: [cuisinePreference.trim(), dietGoal].filter(Boolean),
        source: 'ai_generated',
      });

      setHasSaved(true);
      toast.success('Recipe saved to your favorites!');
    } catch (err) {
      console.error('[RecipeGenerator] Error saving recipe:', err);
      const errMsg = err.response?.data?.message || 'Error saving recipe.';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form Panel */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Sparkles className="text-emerald-500" size={16} /> Setup Parameters
          </h2>
          
          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Ingredients Pill Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Ingredients you have *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. eggs, spinach, onion"
                  value={ingInput}
                  onChange={(e) => setIngInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient(e)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="p-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ingredients.map((ing, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full border border-emerald-100">
                    {ing}
                    <button type="button" onClick={() => handleRemoveIngredient(i)}>
                      <X size={10} className="hover:text-red-500 transition-colors" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Diet Goal Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Diet Goal</label>
              <select
                value={dietGoal}
                onChange={(e) => setDietGoal(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="maintenance">Maintenance / Balanced</option>
              </select>
            </div>

            {/* Meal Type Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Meal Type</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            {/* Allergies Pill Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Allergies to Avoid</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. peanuts, dairy, gluten"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAllergy(e)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  className="p-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {allergies.map((allergy, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-full border border-red-100">
                    {allergy}
                    <button type="button" onClick={() => handleRemoveAllergy(i)}>
                      <X size={10} className="hover:text-red-500 transition-colors" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Cuisine Preference */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Cuisine Preference (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Indian, Italian, Mexican"
                value={cuisinePreference}
                onChange={(e) => setCuisinePreference(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-lg text-sm transition-all cursor-pointer shadow-sm"
            >
              <Sparkles size={16} />
              {generating ? 'Generating recipe...' : 'Generate Recipe'}
            </button>
          </form>
        </div>

        {/* Right Preview Panel */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
          
          {/* 1. Initial State Placeholder */}
          {!generating && !generatedRecipe && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <ChefHat className="text-slate-300 mb-4 animate-bounce" size={48} />
              <h3 className="font-bold text-slate-700 text-base">Your Recipe Preview</h3>
              <p className="text-slate-400 text-xs mt-2 max-w-sm">
                Enter your ingredients and preferences, then click Generate to get an AI recipe tailored to your goals.
              </p>
            </div>
          )}

          {/* 2. Loading Skeleton */}
          {generating && (
            <div className="flex-1 space-y-6 animate-pulse">
              <div className="space-y-2">
                <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-14 bg-slate-100 rounded-xl"></div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-4 bg-slate-100 rounded w-5/6"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-10 bg-slate-100 rounded w-full"></div>
                <div className="h-10 bg-slate-100 rounded w-full"></div>
              </div>
            </div>
          )}

          {/* 3. Error Banner */}
          {error && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-red-600 bg-red-50/50 border border-red-100 rounded-2xl">
              <ShieldAlert className="mb-3" size={32} />
              <h3 className="font-bold text-sm">Recipe Generation Error</h3>
              <p className="text-xs text-slate-600 mt-2 max-w-md">{error}</p>
            </div>
          )}

          {/* 4. Generated Recipe View */}
          {generatedRecipe && (
            <div className="flex-1 flex flex-col justify-between space-y-6">
              
              <div>
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {mealType}
                    </span>
                    <h2 className="text-xl font-bold text-slate-800 mt-2">{generatedRecipe.title}</h2>
                    <p className="text-xs text-slate-400 mt-1">Serves: {generatedRecipe.servings || 2}</p>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving || hasSaved}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                      hasSaved
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {hasSaved ? <CheckCircle size={14} /> : <Sparkles size={14} />}
                    {hasSaved ? 'Saved to Favorites' : saving ? 'Saving...' : 'Save Recipe'}
                  </button>
                </div>

                {/* Macro Badges */}
                <div className="grid grid-cols-4 gap-3 mt-6">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col items-center">
                    <Flame className="text-orange-500 mb-1" size={14} />
                    <span className="text-[10px] uppercase font-medium text-slate-400">Calories</span>
                    <span className="text-xs font-bold text-slate-700">{generatedRecipe.nutrition?.calories} kcal</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col items-center">
                    <span className="text-emerald-600 font-extrabold text-[10px] mb-1">P</span>
                    <span className="text-[10px] uppercase font-medium text-slate-400">Protein</span>
                    <span className="text-xs font-bold text-slate-700">{generatedRecipe.nutrition?.protein}g</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col items-center">
                    <span className="text-blue-500 font-extrabold text-[10px] mb-1">C</span>
                    <span className="text-[10px] uppercase font-medium text-slate-400">Carbs</span>
                    <span className="text-xs font-bold text-slate-700">{generatedRecipe.nutrition?.carbs}g</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col items-center">
                    <span className="text-amber-500 font-extrabold text-[10px] mb-1">F</span>
                    <span className="text-[10px] uppercase font-medium text-slate-400">Fats</span>
                    <span className="text-xs font-bold text-slate-700">{generatedRecipe.nutrition?.fats}g</span>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3">
                    <ClipboardList size={16} className="text-slate-500" /> Ingredients
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {generatedRecipe.ingredients?.map((ing, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
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
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3">
                    <ClipboardList size={16} className="text-slate-500" /> Cooking Instructions
                  </h3>
                  <ol className="space-y-3">
                    {generatedRecipe.steps?.map((step, i) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-3 leading-relaxed">
                        <span className="flex-shrink-0 h-5 w-5 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center font-bold text-[10px]">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RecipeGenerator;
