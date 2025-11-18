'use client';
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function LoginPage({ onBack }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6 relative">
      <button
        onClick={onBack}
        className="absolute top-6 right-6 p-2 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-full transition-colors"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-neutral-900 font-medium text-3xl mb-2">
            {isSignup ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="text-neutral-600">
            {isSignup ? 'Start building AI agents for your business' : 'Log in to access Agent Studio'}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8 border border-neutral-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 rounded-xl bg-neutral-100 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-[#ff5436] focus:ring-[#ff5436]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 rounded-xl bg-neutral-100 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-[#ff5436] focus:ring-[#ff5436]"
                required
              />
            </div>

            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-neutral-700">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl bg-neutral-100 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-[#ff5436] focus:ring-[#ff5436]"
                  required
                />
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {!isSignup && (
              <div className="text-right">
                <button type="button" className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#ff5436] hover:bg-[#ff5436]/90 text-white rounded-xl text-base disabled:opacity-50"
            >
              {loading ? 'Loading...' : isSignup ? 'Create Account' : 'Log In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-600">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button type="button" onClick={() => setIsSignup(!isSignup)} className="text-[#ff5436] hover:text-[#ff5436]/80 transition-colors">
                {isSignup ? 'Log in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
