"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, LanguageSwitcher } from "@/components/ui";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth, getErrorMessage } from "@/contexts/AuthContext";
import { signInWithGoogle } from "@/lib/firebase";
import { Gender } from "@/types/auth";
import toast from "react-hot-toast";

type GenderType = "male" | "female" | "other" | "prefer_not_to_say" | "";

export default function RegisterPage() {
  const { t, isRTL } = useLanguage();
  const { register, socialAuth } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    gender: "" as GenderType,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        gender: formData.gender as Gender,
      });
      toast.success(
        t("auth", "registrationSuccess")
      );
      // Redirect to login page after successful registration
      router.push("/auth/login?registered=true");
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const result = await signInWithGoogle();
      const idToken = await result.user.getIdToken();

      const response = await socialAuth({ idToken });

      if (response.requiresProfileCompletion) {
        // Store firebase user info for profile completion
        sessionStorage.setItem(
          "pendingFirebaseUser",
          JSON.stringify({
            idToken,
            ...response.firebaseUser,
            missingFields: response.missingFields,
          })
        );
        // Redirect to complete profile page
        router.push("/auth/complete-profile");
      } else {
        toast.success(t("auth", "registrationSuccess"));
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Language Switcher - Fixed position */}
      <div className="fixed top-4 end-4 z-50">
        <LanguageSwitcher variant="full" className="bg-(--bg-card) border border-(--border) shadow-lg" />
      </div>

      {/* Background Image - Hidden on mobile */}
      <div className={cn("hidden lg:block lg:w-1/2 xl:w-3/5 relative", isRTL ? "order-2" : "order-1")}>
        <Image
          src="/images/auth-bg.png"
          alt={t("auth", "authBackgroundAlt")}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-r from-primary-900/60 to-primary-600/40" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold mb-4">
              {t("auth", "joinLamatfikr")}
            </h1>
            <p className="text-lg xl:text-xl text-white/80">
              {t("auth", "joinDescription")}
            </p>
          </div>
        </div>
      </div>

      {/* Auth Modal / Form */}
      <div className={cn("w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4 sm:p-8 bg-(--bg)", isRTL ? "order-1" : "order-2")}>
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600">{t("common", "appName")}</h1>
            <p className="text-(--text-muted) mt-2">
              {t("auth", "joinCommunity")}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-(--bg-card) rounded-2xl border border-(--border) shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-(--text)">
                {t("auth", "createAccount")}
              </h2>
              <p className="text-(--text-muted) mt-1">
                {t("auth", "fillDetails")}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Google Sign Up */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-(--border) bg-(--bg) hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
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
                {isGoogleLoading ? t("auth", "creatingAccount") : t("auth", "signUpWithGoogle")}
              </span>
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-(--border)" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-(--bg-card) text-(--text-muted)">
                  {t("auth", "orContinueWithEmail")}
                </span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-(--text) mb-1.5">
                    {t("auth", "firstName")}
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className={cn("absolute top-1/2 -translate-y-1/2 text-(--text-muted)", isRTL ? "right-3" : "left-3")}
                    />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder={t("auth", "firstNamePlaceholder")}
                      required
                      className={cn("w-full py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500", isRTL ? "pr-10 pl-4" : "pl-10 pr-4")}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-(--text) mb-1.5">
                    {t("auth", "lastName")}
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder={t("auth", "lastNamePlaceholder")}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-(--text) mb-1.5">
                  {t("auth", "username")}
                </label>
                <div className="relative">
                  <AtSign
                    size={18}
                    className={cn("absolute top-1/2 -translate-y-1/2 text-(--text-muted)", isRTL ? "right-3" : "left-3")}
                  />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder={t("auth", "usernamePlaceholder")}
                    required
                    className={cn("w-full py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500", isRTL ? "pr-10 pl-4" : "pl-10 pr-4")}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-(--text) mb-1.5">
                  {t("auth", "email")}
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className={cn("absolute top-1/2 -translate-y-1/2 text-(--text-muted)", isRTL ? "right-3" : "left-3")}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t("auth", "emailPlaceholder")}
                    required
                    className={cn("w-full py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500", isRTL ? "pr-10 pl-4" : "pl-10 pr-4")}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-(--text) mb-1.5">
                  {t("auth", "password")}
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className={cn("absolute top-1/2 -translate-y-1/2 text-(--text-muted)", isRTL ? "right-3" : "left-3")}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t("auth", "passwordPlaceholder")}
                    required
                    minLength={8}
                    className={cn("w-full py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500", isRTL ? "pr-10 pl-12" : "pl-10 pr-12")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn("absolute top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text)", isRTL ? "left-3" : "right-3")}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-(--text) mb-1.5">
                  {t("auth", "gender")}
                </label>
                <div className="relative">
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
                  >
                    <option value="">{t("auth", "selectGender")}</option>
                    <option value="male">{t("auth", "male")}</option>
                    <option value="female">{t("auth", "female")}</option>
                    <option value="other">{t("auth", "other")}</option>
                    <option value="prefer_not_to_say">{t("auth", "preferNotToSay")}</option>
                  </select>
                  <ChevronDown
                    size={18}
                    className={cn("absolute top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none", isRTL ? "left-3" : "right-3")}
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
                    {t("auth", "creatingAccount")}
                  </div>
                ) : (
                  t("auth", "createAccount")
                )}
              </Button>
            </form>

            {/* Login Link */}
            <p className="text-center text-(--text-muted) mt-6">
              {t("auth", "alreadyHaveAccount")}{" "}
              <Link
                href="/auth/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {t("auth", "signInLink")}
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-(--text-muted) mt-6">
            {t("auth", "createAccountAgreement")}{" "}
            <Link href="/terms-of-service" className="text-primary-600 hover:underline">
              {t("auth", "termsOfService")}
            </Link>{" "}
            {t("common", "and")}{" "}
            <Link href="/privacy-policy" className="text-primary-600 hover:underline">
              {t("auth", "privacyPolicy")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}