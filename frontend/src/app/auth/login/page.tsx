"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Dummy submit - simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    alert(
      `Login submitted!\n\nData:\n- Email/Username: ${formData.emailOrUsername}`
    );
    setIsLoading(false);
  };

  const handleGoogleSignIn = () => {
    alert("Google Sign In clicked! (This is a dummy action)");
  };

  return (
    <div className="min-h-screen flex">
      {/* Background Image - Hidden on mobile */}
      <div className="hidden lg:block lg:w-1/2 xl:w-3/5 relative">
        <Image
          src="/images/auth-bg.png"
          alt="Authentication background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-r from-primary-900/60 to-primary-600/40" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold mb-4">
              Welcome Back
            </h1>
            <p className="text-lg xl:text-xl text-white/80">
              Sign in to continue your journey with LamatFikr. Your community
              awaits.
            </p>
          </div>
        </div>
      </div>

      {/* Auth Modal / Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4 sm:p-8 bg-(--bg)">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600">LamatFikr</h1>
            <p className="text-(--text-muted) mt-2">Welcome back</p>
          </div>

          {/* Form Card */}
          <div className="bg-(--bg-card) rounded-2xl border border-(--border) shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-(--text)">Sign In</h2>
              <p className="text-(--text-muted) mt-1">
                Enter your credentials to continue
              </p>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-(--border) bg-(--bg) hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium text-(--text)">
                Sign in with Google
              </span>
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-(--border)" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-(--bg-card) text-(--text-muted)">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email or Username */}
              <div>
                <label className="block text-sm font-medium text-(--text) mb-1.5">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)"
                  />
                  <input
                    type="text"
                    name="emailOrUsername"
                    value={formData.emailOrUsername}
                    onChange={handleChange}
                    placeholder="john@example.com or johndoe"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-(--text)">
                    Password
                  </label>
                  <Link
                    href="#"
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text)"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-(--text-muted)"
                >
                  Remember me for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Register Link */}
            <p className="text-center text-(--text-muted) mt-6">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-(--text-muted) mt-6">
            By signing in, you agree to our{" "}
            <Link href="#" className="text-primary-600 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-primary-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}