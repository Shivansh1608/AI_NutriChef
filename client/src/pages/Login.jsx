import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

// Define Zod Validation Schema
const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address format' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configure React Hook Form
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      await login(data.email, data.password);
      toast.success('Welcome back to AI NutriChef!');
      navigate('/');
    } catch (err) {
      console.error('[Login] Error signing in:', err.message);
      setError(err.message);
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full space-y-6">
        
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-full bg-emerald-100 items-center justify-center text-emerald-700 font-semibold text-xl">
            🥗
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-500">Sign in to resume planning your nutrient journey.</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-semibold">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="email"
                placeholder="you@example.com"
                {...formRegister('email')}
                className={`w-full pl-10 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 transition-all ${
                  errors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-[10px] text-red-500 font-medium mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="password"
                placeholder="••••••••"
                {...formRegister('password')}
                className={`w-full pl-10 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 transition-all ${
                  errors.password
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
              />
            </div>
            {errors.password && (
              <p className="text-[10px] text-red-500 font-medium mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-sm animate-pulse-slow"
          >
            <ShieldCheck size={14} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-100">
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold text-emerald-600 hover:underline">
            Register Here
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
