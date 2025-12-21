"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, LanguageSwitcher } from "@/components/ui";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth, getErrorMessage } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const { t, isRTL } = useLanguage();
  const { resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError(t("auth", "invalidResetToken"));
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError(t("auth", "invalidResetToken"));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t("auth", "passwordsDoNotMatch"));
      toast.error(t("auth", "passwordsDoNotMatch"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await resetPassword({ token, password: formData.password });
      setIsSuccess(true);
      toast.success(t("auth", "passwordResetSuccess"));
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Language Switcher - Fixed position */}
      <div className="fixed top-4 end-4 z-50">
        <LanguageSwitcher variant="full" className="bg-(--bg-card) border border-(--border) shadow-lg" />
      </div>

      {/* Background Image - Hidden on mobile */}
      <div className={`hidden lg:block lg:w-1/2 xl:w-3/5 relative ${isRTL ? "order-2" : "order-1"}`}>
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
              {t("auth", "resetPasswordTitle")}
            </h1>
            <p className="text-lg xl:text-xl text-white/80">
              {t("auth", "resetPasswordSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Auth Modal / Form */}
      <div className={`w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4 sm:p-8 bg-(--bg) ${isRTL ? "order-1" : "order-2"}`}>
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600">{t("common", "appName")}</h1>
            <p className="text-(--text-muted) mt-2">{t("auth", "resetPasswordTitle")}</p>
          </div>

          {/* Form Card */}
          <div className="bg-(--bg-card) rounded-2xl border border-(--border) shadow-xl p-6 sm:p-8">
            {!isSuccess ? (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-(--text)">{t("auth", "resetPasswordTitle")}</h2>
                  <p className="text-(--text-muted) mt-1">
                    {t("auth", "resetPasswordSubtitle")}
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-(--text) mb-1.5">
                      {t("auth", "newPassword")}
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className={`absolute top-1/2 -translate-y-1/2 text-(--text-muted) ${isRTL ? "right-3" : "left-3"}`}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={t("auth", "passwordPlaceholder")}
                        required
                        minLength={8}
                        className={`w-full py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 ${isRTL ? "pr-10 pl-12" : "pl-10 pr-12"}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text) ${isRTL ? "left-3" : "right-3"}`}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-xs text-(--text-muted) mt-1">
                      {t("auth", "passwordRequirements")}
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-(--text) mb-1.5">
                      {t("auth", "confirmPassword")}
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className={`absolute top-1/2 -translate-y-1/2 text-(--text-muted) ${isRTL ? "right-3" : "left-3"}`}
                      />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder={t("auth", "confirmPasswordPlaceholder")}
                        required
                        minLength={8}
                        className={`w-full py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 ${isRTL ? "pr-10 pl-12" : "pl-10 pr-12"}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text) ${isRTL ? "left-3" : "right-3"}`}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-3 mt-2"
                    disabled={isLoading || !token}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("auth", "resettingPassword")}
                      </div>
                    ) : (
                      t("auth", "resetPassword")
                    )}
                  </Button>
                </form>

                {/* Back to Login Link */}
                <p className="text-center text-(--text-muted) mt-6">
                  {t("auth", "rememberPassword")}{" "}
                  <Link
                    href="/auth/login"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {t("auth", "signIn")}
                  </Link>
                </p>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <CheckCircle size={64} className="text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-(--text) mb-2">
                    {t("auth", "passwordResetSuccess")}
                  </h2>
                  <p className="text-(--text-muted) mb-6">
                    {t("auth", "passwordResetSuccessMessage")}
                  </p>

                  {/* Login Button */}
                  <Button
                    variant="primary"
                    className="w-full py-3"
                    onClick={() => router.push("/auth/login")}
                  >
                    {t("auth", "proceedToLogin")}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-(--text-muted) mt-6">
            {t("auth", "termsAgreement")}{" "}
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
