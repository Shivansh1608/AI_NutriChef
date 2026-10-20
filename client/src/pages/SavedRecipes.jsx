import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Bookmark, Search, Trash2, Eye, Flame, X, ClipboardList, UtensilsCrossed } from 'lucide-react';

const fetchSavedRecipes = async ({ tag, mealType, page }) => {
  let url = `/recipes?page=${page}&limit=6`;
  if (tag) url += `&tag=${tag}`;
  if (mealType) url += `&mealType=${mealType}`;
  
  const res = await api.get(url);
  return res.data.data;
};

const SavedRecipes = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [mealType, setMealType] = useState('');
  const [tag, setTag] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Fetch saved recipes
  const { data, isLoading, isError } = useQuery({
    queryKey: ['savedRecipes', { tag, mealType, page }],
    queryFn: () => fetchSavedRecipes({ tag, mealType, page }),
  });

  // Mutation: Delete Recipe
  const deleteMutation = useMutation({
    mutationFn: async (recipeId) => {
      await api.delete(`/recipes/${recipeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['savedRecipes']);
      toast.success('Recipe removed from favorites');
      if (selectedRecipe) setSelectedRecipe(null);
    },
    onError: (err) => {
      console.error('[SavedRecipes] Error deleting recipe:', err);
      const errMsg = err.response?.data?.message || 'Failed to delete recipe.';
      toast.error(errMsg);
    },
  });

  const handleDelete = (recipeId, e) => {
    e.stopPropagation(); // prevent modal from popping up
    if (window.confirm('Are you sure you want to delete this recipe from your favorites?')) {
      deleteMutation.mutate(recipeId);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (data?.pagination?.pages || 1)) {
      setPage(newPage);
    }
  };

  const handleFilterChange = (type, val) => {
    setPage(1);
    if (type === 'mealType') setMealType(val);
    if (type === 'tag') setTag(val);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* 1. Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bookmark className="text-emerald-500" size={20} /> Saved Recipes
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Your collection of curated and generated meals.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Tag Filter */}
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Filter by tag..."
              value={tag}
              onChange={(e) => handleFilterChange('tag', e.target.value)}
              className="pl-8 pr-3 py-2 w-full md:w-40 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Meal Type Filter */}
          <select
            value={mealType}
            onChange={(e) => handleFilterChange('mealType', e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 flex-1 md:flex-initial"
          >
            <option value="">All Meals</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snacks</option>
          </select>
        </div>
      </div>

      {/* 2. Grid of Saved Recipes */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-6 bg-slate-200 rounded w-2/3"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              <div className="flex gap-2 pt-3">
                <div className="h-10 bg-slate-50 rounded flex-1"></div>
                <div className="h-10 bg-slate-50 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-red-600">
          Failed to fetch saved recipes. Please reload the page.
        </div>
      ) : data?.recipes?.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center min-h-[300px]">
          <UtensilsCrossed className="text-slate-300 mb-4" size={48} />
          <h3 className="font-bold text-slate-700 text-base">No Recipes Found</h3>
          <p className="text-slate-500 text-xs mt-2 max-w-sm">
            Try adjusting your search filters or start generating customized plates from the Recipe Generator page.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.recipes.map((recipe) => (
              <div
                key={recipe._id}
                onClick={() => setSelectedRecipe(recipe)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-500/50 cursor-pointer transition-all group"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {recipe.mealType}
                    </span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-0.5">
                      <Flame size={12} className="text-orange-500" />
                      {recipe.nutrition?.calories} kcal
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 capitalize">{recipe.source.replace('_', ' ')}</p>
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    {recipe.tags?.slice(0, 3).map((t, i) => (
                      <span key={i} className="text-[9px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-100">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                    <Eye size={12} /> View Details
                  </span>
                  <button
                    onClick={(e) => handleDelete(recipe._id, e)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {data.pagination?.pages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 px-2">
                Page {page} of {data.pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === data.pagination.pages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Detailed Recipe Modal */}
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
                  Cooking Instructions
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
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={(e) => handleDelete(selectedRecipe._id, e)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors cursor-pointer"
              >
                Delete from Favorites
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedRecipes;
