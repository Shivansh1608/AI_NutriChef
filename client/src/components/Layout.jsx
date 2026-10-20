import React from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ChefHat,
  CalendarDays,
  ShoppingBag,
  MessageSquare,
  Bookmark,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

const Layout = () => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // If auth is loading, render a full screen loader skeleton
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading AI NutriChef...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Recipe Generator', path: '/recipe-generator', icon: ChefHat },
    { name: 'Meal Planner', path: '/meal-planner', icon: CalendarDays },
    { name: 'Grocery List', path: '/grocery-list', icon: ShoppingBag },
    { name: 'Nutrition Chatbot', path: '/chatbot', icon: MessageSquare },
    { name: 'Saved Recipes', path: '/saved-recipes', icon: Bookmark },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between fixed h-full z-10">
        <div>
          {/* Logo Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2">
            <span className="text-xl">🥗</span>
            <span className="font-bold text-emerald-600 tracking-wide text-lg">AI NutriChef</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-emerald-700' : 'text-slate-500'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Details */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50">
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
              {user?.name ? user.name[0].toUpperCase() : <UserIcon size={16} />}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-slate-700 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate capitalize">{user?.profile?.dietGoal?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="pl-64 flex-1 flex flex-col min-h-screen">
        {/* 2. Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            {navItems.find((item) => item.path === location.pathname)?.name || 'AI NutriChef'}
          </h2>
          <div className="flex items-center gap-6">
            <span className="text-sm text-slate-600 font-medium">
              Hi, <span className="font-semibold text-slate-800">{user?.name}</span>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all cursor-pointer"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </header>

        {/* 3. Main Dashboard Content Area */}
        <main className="p-8 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
