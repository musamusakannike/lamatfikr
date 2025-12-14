"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AtSign,
  ChevronDown,
} from "lucide-react";

type Gender = "male" | "female" | "other" | "prefer_not_to_say" | "";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    gender: "" as Gender,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Dummy submit - simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    alert(
      `Registration submitted!\n\nData:\n- Name: ${formData.firstName} ${formData.lastName}\n- Username: ${formData.username}\n- Email: ${formData.email}\n- Gender: ${formData.gender}`
    );
    setIsLoading(false);
  };

  const handleGoogleSignUp = () => {
    alert("Google Sign Up clicked! (This is a dummy action)");
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
              Join LamatFikr
            </h1>
            <p className="text-lg xl:text-xl text-white/80">
              Connect with like-minded individuals, share your thoughts, and be
              part of a vibrant community.
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
            <p className="text-(--text-muted) mt-2">
              Join our community today
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-(--bg-card) rounded-2xl border border-(--border) shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-(--text)">
                Create Account
              </h2>
              <p className="text-(--text-muted) mt-1">
                Fill in your details to get started
              </p>
            </div>

            {/* Google Sign Up */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
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
                Sign up with Google
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-(--text) mb-1.5">
                    First Name
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)"
                    />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-(--text) mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-(--text) mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <AtSign
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)"
                  />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="johndoe"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-(--text) mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)"
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-(--text) mb-1.5">
                  Password
                </label>
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
                    minLength={8}
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

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-(--text) mb-1.5">
                  Gender
                </label>
                <div className="relative">
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  <ChevronDown
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none"
                  />
                </div>
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
                    Creating account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Login Link */}
            <p className="text-center text-(--text-muted) mt-6">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-(--text-muted) mt-6">
            By creating an account, you agree to our{" "}
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