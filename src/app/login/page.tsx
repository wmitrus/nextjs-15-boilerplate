'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import logger from '@/lib/logger/client';

import {
  loginSchema,
  type LoginFormData,
  type LoginResponse,
} from './validation';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginResponse, setLoginResponse] = useState<LoginResponse | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginResponse(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: LoginResponse = await response.json();
      setLoginResponse(result);

      if (result.success) {
        // Handle successful login (e.g., redirect, store token, etc.)
        logger.info(
          `Login successful for user: ${result.user?.email || 'unknown'}`,
        );
        reset();
      }
    } catch (error) {
      logger.error(
        `Login request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      setLoginResponse({
        success: false,
        message: 'Network error. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Sign In</h1>
          <p className="text-gray-600">
            Welcome back! Please sign in to your account.
          </p>
        </div>

        {/* Login Form */}
        <div className="rounded-lg bg-white p-8 shadow-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Response Message */}
          {loginResponse && (
            <div
              className={`mt-6 rounded-md p-4 ${
                loginResponse.success
                  ? 'border border-green-200 bg-green-50 text-green-800'
                  : 'border border-red-200 bg-red-50 text-red-800'
              }`}
            >
              <p className="text-sm">{loginResponse.message}</p>
              {loginResponse.success && loginResponse.user && (
                <div className="mt-2 text-xs">
                  <p>Welcome, {loginResponse.user.name}!</p>
                  <p>Email: {loginResponse.user.email}</p>
                </div>
              )}
            </div>
          )}

          {/* Demo Credentials */}
          <div className="mt-6 rounded-md bg-gray-50 p-4">
            <h3 className="mb-2 text-sm font-medium text-gray-700">
              Demo Credentials:
            </h3>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                <strong>Email:</strong> demo@example.com
              </p>
              <p>
                <strong>Password:</strong> demo123
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="font-medium text-indigo-600 hover:text-indigo-500 focus:underline focus:outline-none"
              onClick={() => {
                // TODO: Implement sign up functionality
                logger.info('Sign up button clicked');
              }}
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
