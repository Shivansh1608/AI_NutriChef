import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ChefHat,
  CalendarDays,
  ShoppingBag,
  MessageSquare,
  Bookmark,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

const fetchRecentRecipes = async () => {
  const res = await api.get('/recipes?page=1&limit=3');
  return res.data.data.recipes;
};

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch recent activity recipes
  const { data: recentRecipes, isLoading, isError } = useQuery({
    queryKey: ['recentRecipes'],
    queryFn: fetchRecentRecipes,
  });

  const cards = [
    {
      title: 'Generate a Recipe',
      desc: 'From ingredients you already have',
      path: '/recipe-generator',
      icon: ChefHat,
      color: 'bg-emerald-500',
    },
    {
      title: 'Plan Your Week',
      desc: 'Get a full 7-day meal plan',
      path: '/meal-planner',
      icon: CalendarDays,
      color: 'bg-blue-500',
    },
    {
      title: 'Grocery List',
      desc: 'Build a shopping list from your plan',
      path: '/grocery-list',
      icon: ShoppingBag,
      color: 'bg-amber-500',
    },
    {
      title: 'Ask NutriChef',
      desc: 'Chat about nutrition & recipes',
      path: '/chatbot',
      icon: MessageSquare,
      color: 'bg-indigo-500',
    },
    {
      title: 'Saved Recipes',
      desc: 'Browse & search your saved recipes',
      path: '/saved-recipes',
      icon: Bookmark,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
            Welcome back, {user?.name} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Diet goal: <span className="font-semibold text-emerald-600 capitalize">{user?.profile?.dietGoal?.replace('_', ' ')}</span>
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 flex items-center gap-3">
            <TrendingUp className="text-emerald-500" size={20} />
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400">Calorie Target</p>
              <p className="text-sm font-bold text-slate-700">{user?.profile?.dailyCalorieTarget || 2000} kcal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Action Cards */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="text-emerald-500" size={18} /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.path}
                className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-40 relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-xl ${card.color} text-white shadow-sm`}>
                    <Icon size={24} />
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{card.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{card.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity / Saved Recipes */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Bookmark className="text-emerald-500" size={18} /> Recent Saved Recipes
          </h2>
          <Link
            to="/saved-recipes"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
          >
            View all saved recipes <ArrowRight size={12} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border border-slate-100 rounded-xl p-4 space-y-3 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="flex gap-2 pt-2">
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-6 text-slate-500 text-sm">
            Failed to load recipes. Please check your network connection.
          </div>
        ) : recentRecipes?.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
            <ChefHat className="mx-auto text-slate-300 mb-3" size={36} />
            <p className="text-slate-500 text-sm">No saved recipes yet.</p>
            <p className="text-xs text-slate-400 mt-1">Generate a custom recipe and save it to display it here.</p>
            <Link
              to="/recipe-generator"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              Start Generating
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentRecipes?.map((recipe) => (
              <div
                key={recipe._id}
                className="border border-slate-100 rounded-xl p-4 flex flex-col justify-between hover:shadow-sm transition-all"
              >
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">
                    {recipe.mealType}
                  </span>
                  <h3 className="font-bold text-slate-800 text-sm mt-2 line-clamp-1">{recipe.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{recipe.ingredients.length} ingredients</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center text-xs text-slate-600">
                  <span className="font-medium">{recipe.nutrition.calories} kcal</span>
                  <span className="text-slate-400 capitalize">{recipe.source.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
