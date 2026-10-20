import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import RecipeGenerator from './pages/RecipeGenerator';
import MealPlanner from './pages/MealPlanner';
import GroceryList from './pages/GroceryList';
import SavedRecipes from './pages/SavedRecipes';
import NutritionChatbot from './pages/NutritionChatbot';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Configure TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes inside Layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="recipe-generator" element={<RecipeGenerator />} />
              <Route path="meal-planner" element={<MealPlanner />} />
              <Route path="grocery-list" element={<GroceryList />} />
              <Route path="saved-recipes" element={<SavedRecipes />} />
              <Route path="chatbot" element={<NutritionChatbot />} />
            </Route>

            {/* Wildcard redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#334155',
              color: '#fff',
              fontSize: '12px',
              borderRadius: '8px',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
