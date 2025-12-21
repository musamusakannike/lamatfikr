"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, LanguageSwitcher } from "@/components/ui";
import { cn } from "@/lib/utils";
import { User, AtSign, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth, getErrorMessage } from "@/contexts/AuthContext";
import { Gender } from "@/types/auth";
import toast from "react-hot-toast";

interface PendingFirebaseUser {
  idToken: string;
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  missingFields?: string[];
}

type GenderType = "male" | "female" | "other" | "prefer_not_to_say" | "";

export default function CompleteProfilePage() {
  const { t, isRTL } = useLanguage();
  const { completeSocialProfile } = useAuth();
  const router = useRouter();
  const [pendingUser, setPendingUser] = useState<PendingFirebaseUser | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    gender: "" as GenderType,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("pendingFirebaseUser");
    if (!storedUser) {
      router.push("/auth/login");
      return;
    }

    try {
      const userData = JSON.parse(storedUser) as PendingFirebaseUser;
      setPendingUser(userData);

      // Pre-fill form with available data
      if (userData.displayName) {
        const nameParts = userData.displayName.split(" ");
        setFormData((prev) => ({
          ...prev,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
        }));
      }

      // Generate username from email
      if (userData.email) {
        const baseUsername = userData.email.split("@")[0]
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .substring(0, 25);
        setFormData((prev) => ({
          ...prev,
          username: baseUsername,
        }));
      }
    } catch {
      router.push("/auth/login");
    }
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    setIsLoading(true);
    setError(null);

    try {
      await completeSocialProfile({
        idToken: pendingUser.idToken,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        gender: formData.gender as Gender,
      });

      // Clear stored data
      sessionStorage.removeItem("pendingFirebaseUser");
      toast.success(t("auth", "profileCompleted"));
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!pendingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--bg)">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Language Switcher - Fixed position */}
      <div className="fixed top-4 end-4 z-50">
        <LanguageSwitcher
          variant="full"
          className="bg-(--bg-card) border border-(--border) shadow-lg"
        />
      </div>

      {/* Background Image - Hidden on mobile */}
      <div
        className={cn(
          "hidden lg:block lg:w-1/2 xl:w-3/5 relative",
          isRTL ? "order-2" : "order-1"
        )}
      >
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
              {t("auth", "almostThere")}
            </h1>
            <p className="text-lg xl:text-xl text-white/80">
              {t("auth", "completeProfileDescription")}
            </p>
          </div>
        </div>
      </div>

      {/* Auth Modal / Form */}
      <div
        className={cn(
          "w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4 sm:p-8 bg-(--bg)",
          isRTL ? "order-1" : "order-2"
        )}
      >
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600">
              {t("common", "appName")}
            </h1>
            <p className="text-(--text-muted) mt-2">
              {t("auth", "completeYourProfile")}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-(--bg-card) rounded-2xl border border-(--border) shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              {/* User Avatar */}
              {pendingUser.photoURL && (
                <div className="flex justify-center mb-4">
                  <Image
                    src={pendingUser.photoURL}
                    alt={t("auth", "profileImageAlt")}
                    width={80}
                    height={80}
                    className="rounded-full border-4 border-primary-100"
                  />
                </div>
              )}
              <h2 className="text-2xl font-bold text-(--text)">
                {t("auth", "completeYourProfile")}
              </h2>
              <p className="text-(--text-muted) mt-1">
                {pendingUser.email && (
                  <span className="block text-sm">{pendingUser.email}</span>
                )}
                {t("auth", "fillRemainingDetails")}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Profile Completion Form */}
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
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 text-(--text-muted)",
                        isRTL ? "right-3" : "left-3"
                      )}
                    />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder={t("auth", "firstNamePlaceholder")}
                      required
                      className={cn(
                        "w-full py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500",
                        isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                      )}
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
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 text-(--text-muted)",
                      isRTL ? "right-3" : "left-3"
                    )}
                  />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder={t("auth", "usernamePlaceholder")}
                    required
                    pattern="^[a-zA-Z0-9_]+$"
                    minLength={2}
                    maxLength={30}
                    className={cn(
                      "w-full py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500",
                      isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                    )}
                  />
                </div>
                <p className="text-xs text-(--text-muted) mt-1">
                  {t("auth", "usernameHint")}
                </p>
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
                    <option value="prefer_not_to_say">
                      {t("auth", "preferNotToSay")}
                    </option>
                  </select>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none",
                      isRTL ? "left-3" : "right-3"
                    )}
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
                    {t("auth", "completing")}
                  </div>
                ) : (
                  t("auth", "completeProfile")
                )}
              </Button>
            </form>

            {/* Cancel Link */}
            <p className="text-center text-(--text-muted) mt-6">
              <Link
                href="/auth/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
                onClick={() => sessionStorage.removeItem("pendingFirebaseUser")}
              >
                {t("common", "cancel")}
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
