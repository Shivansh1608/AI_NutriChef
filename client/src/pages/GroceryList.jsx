import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { ShoppingBag, ChevronDown, CheckSquare, Square, ClipboardList, Check, RefreshCw } from 'lucide-react';

const fetchMealPlans = async () => {
  const res = await api.get('/meal-plans');
  return res.data.data.mealPlans;
};

const fetchGroceryLists = async () => {
  const res = await api.get('/grocery-lists');
  return res.data.data.groceryLists;
};

const fetchGroceryListDetails = async (listId) => {
  if (!listId) return null;
  const res = await api.get(`/grocery-lists/${listId}`);
  return res.data.data.groceryList;
};

const GroceryList = () => {
  const queryClient = useQueryClient();
  const location = useLocation();

  // Selected state IDs
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedListId, setSelectedListId] = useState('');

  // Sync with navigated state (e.g. from MealPlanner redirect)
  useEffect(() => {
    if (location.state?.selectedListId) {
      setSelectedListId(location.state.selectedListId);
    }
  }, [location.state]);

  // Fetch queries
  const { data: mealPlans } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: fetchMealPlans,
  });

  const { data: groceryLists } = useQuery({
    queryKey: ['groceryLists'],
    queryFn: fetchGroceryLists,
  });

  // Automatically select the first plan and first list if none selected
  useEffect(() => {
    if (mealPlans?.length > 0 && !selectedPlanId) {
      setSelectedPlanId(mealPlans[0]._id);
    }
  }, [mealPlans, selectedPlanId]);

  useEffect(() => {
    if (groceryLists?.length > 0 && !selectedListId) {
      setSelectedListId(groceryLists[0]._id);
    }
  }, [groceryLists, selectedListId]);

  // Fetch active grocery list details
  const { data: activeList, isLoading: loadingDetails } = useQuery({
    queryKey: ['groceryListDetails', selectedListId],
    queryFn: () => fetchGroceryListDetails(selectedListId),
    enabled: !!selectedListId,
  });

  // Mutation: Generate Grocery List
  const generateListMutation = useMutation({
    mutationFn: async (planId) => {
      const res = await api.post(`/grocery-lists/generate/${planId}`);
      return res.data.data.groceryList;
    },
    onSuccess: (newList) => {
      queryClient.invalidateQueries(['groceryLists']);
      setSelectedListId(newList._id);
      toast.success('Shopping list compiled!');
    },
    onError: (err) => {
      console.error('[GroceryList] Error generating list:', err);
      const errMsg = err.response?.data?.message || 'Failed to generate shopping list.';
      toast.error(errMsg);
    },
  });

  // Mutation: Toggle Item Checked State (Optimistic Updates)
  const toggleItemMutation = useMutation({
    mutationFn: async ({ listId, itemId }) => {
      const res = await api.patch(`/grocery-lists/${listId}/items/${itemId}`);
      return res.data.data.groceryList;
    },
    onMutate: async ({ listId, itemId }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries(['groceryListDetails', listId]);

      // Snapshot previous value
      const previousList = queryClient.getQueryData(['groceryListDetails', listId]);

      // Optimistically update the list cache
      queryClient.setQueryData(['groceryListDetails', listId], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item._id === itemId ? { ...item, checked: !item.checked } : item
          ),
        };
      });

      return { previousList };
    },
    onError: (err, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousList) {
        queryClient.setQueryData(['groceryListDetails', variables.listId], context.previousList);
      }
      toast.error('Failed to update item state.');
    },
    onSuccess: (updatedList, variables) => {
      // Ensure local cache matches server
      queryClient.setQueryData(['groceryListDetails', variables.listId], updatedList);
    },
  });

  const handleGenerate = () => {
    if (!selectedPlanId) {
      toast.error('Please select a weekly meal plan first');
      return;
    }
    generateListMutation.mutate(selectedPlanId);
  };

  const handleToggle = (itemId) => {
    if (!selectedListId) return;
    toggleItemMutation.mutate({ listId: selectedListId, itemId });
  };

  // Group items by category
  const getGroupedItems = () => {
    if (!activeList || !activeList.items) return {};
    const groups = {};
    activeList.items.forEach((item) => {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  };

  const groupedItems = getGroupedItems();
  const categoriesOrder = ['Produce', 'Dairy', 'Protein', 'Pantry', 'Spices', 'Other'];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* 1. Header controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="text-emerald-500" size={22} /> Smart Grocery List
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Consolidate and check off items aggregated from your meal plans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Plan select */}
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 flex-1 md:flex-initial"
          >
            <option value="" disabled>Select Weekly Plan</option>
            {mealPlans?.map((plan) => (
              <option key={plan._id} value={plan._id}>
                Plan: {new Date(plan.weekStartDate).toLocaleDateString()} ({plan.goal})
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerate}
            disabled={generateListMutation.isPending || !selectedPlanId}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw size={14} className={generateListMutation.isPending ? 'animate-spin' : ''} />
            {generateListMutation.isPending ? 'Compiling...' : 'Generate List'}
          </button>
        </div>
      </div>

      {/* 2. Main List Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Active Checklist */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
          {loadingDetails ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-1/3"></div>
              <div className="space-y-3">
                <div className="h-10 bg-slate-100 rounded w-full"></div>
                <div className="h-10 bg-slate-100 rounded w-full"></div>
                <div className="h-10 bg-slate-100 rounded w-full"></div>
              </div>
            </div>
          ) : !activeList ? (
            <div className="flex flex-col items-center justify-center text-center p-12 min-h-[350px]">
              <ClipboardList className="text-slate-300 mb-4" size={48} />
              <h3 className="font-bold text-slate-700 text-base">No List Selected</h3>
              <p className="text-slate-500 text-xs mt-2 max-w-xs">
                Select an existing shopping list from the history panel or compile a new list from your active meal plan.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <ClipboardList size={18} className="text-emerald-500" /> Compiled Ingredients
                </h2>
                <span className="text-xs text-slate-400">
                  Total Items: {activeList.items?.length || 0}
                </span>
              </div>

              <div className="space-y-6">
                {categoriesOrder.map((category) => {
                  const items = groupedItems[category];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={category} className="space-y-2.5">
                      <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50/50 px-3 py-1 rounded-md w-fit">
                        {category}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1">
                        {items.map((item) => (
                          <button
                            key={item._id}
                            onClick={() => handleToggle(item._id)}
                            className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:border-slate-200 hover:bg-slate-50/50 text-left transition-all cursor-pointer w-full group"
                          >
                            <span className="flex-shrink-0 text-slate-400 group-hover:text-emerald-600 transition-colors">
                              {item.checked ? (
                                <CheckSquare size={18} className="text-emerald-600 fill-emerald-50" />
                              ) : (
                                <Square size={18} />
                              )}
                            </span>
                            <span className={`text-xs ${item.checked ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                              {item.name} <span className="text-slate-400 font-normal">({item.quantity} {item.unit})</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Saved History Panel */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">Saved Grocery Lists</h3>
          
          {groceryLists?.length === 0 ? (
            <p className="text-slate-500 text-xs px-2 py-4 text-center">No compiled lists yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto scrollbar-hidden">
              {groceryLists?.map((list) => {
                const isSelected = selectedListId === list._id;
                return (
                  <button
                    key={list._id}
                    onClick={() => setSelectedListId(list._id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">Shopping List</p>
                      <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>
                        Compiled: {new Date(list.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">
                      {list.items?.length || 0} items
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default GroceryList;
