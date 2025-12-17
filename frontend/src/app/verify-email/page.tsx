"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button, LanguageSwitcher } from "@/components/ui";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient, getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";

interface VerifyEmailResponse {
  message: string;
}

function VerifyEmailContent() {
  const { t, isRTL } = useLanguage();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      setMessage(t("auth", "noVerificationToken"));
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await apiClient.get<VerifyEmailResponse>(
          `/auth/verify-email?token=${token}`
        );
        setStatus("success");
        setMessage(response.message || t("auth", "emailVerifiedSuccess"));
        toast.success(t("auth", "emailVerifiedSuccess"));
      } catch (err) {
        setStatus("error");
        const errorMessage = getErrorMessage(err);
        setMessage(errorMessage || t("auth", "verificationFailed"));
      }
    };

    verifyEmail();
  }, [token, t]);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setIsResending(true);
    try {
      await apiClient.post<VerifyEmailResponse>("/auth/resend-verification", {
        email: resendEmail,
      });
      toast.success(t("auth", "verificationEmailSent"));
      setResendEmail("");
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-(--text) mb-2">
              {t("auth", "verifyingEmail")}
            </h2>
            <p className="text-(--text-muted)">
              {t("auth", "pleaseWait")}
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-(--text) mb-2">
              {t("auth", "emailVerified")}
            </h2>
            <p className="text-(--text-muted) mb-6">
              {message}
            </p>
            <Link href="/auth/login">
              <Button variant="primary" className="w-full py-3">
                {t("auth", "proceedToLogin")}
              </Button>
            </Link>
          </div>
        );

      case "error":
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-(--text) mb-2">
              {t("auth", "verificationFailed")}
            </h2>
            <p className="text-(--text-muted) mb-6">
              {message}
            </p>

            {/* Resend verification form */}
            <div className="mt-8 pt-6 border-t border-(--border)">
              <p className="text-sm text-(--text-muted) mb-4">
                {t("auth", "resendVerificationPrompt")}
              </p>
              <form onSubmit={handleResendVerification} className="space-y-4">
                <div className="relative">
                  <Mail
                    size={18}
                    className={`absolute top-1/2 -translate-y-1/2 text-(--text-muted) ${isRTL ? "right-3" : "left-3"}`}
                  />
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder={t("auth", "emailPlaceholder")}
                    required
                    className={`w-full py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full py-3"
                  disabled={isResending}
                >
                  {isResending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("auth", "sendingVerification")}
                    </div>
                  ) : (
                    t("auth", "resendVerificationEmail")
                  )}
                </Button>
              </form>
            </div>

            <Link
              href="/auth/login"
              className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              {t("auth", "backToLogin")}
            </Link>
          </div>
        );

      case "no-token":
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Mail className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-(--text) mb-2">
              {t("auth", "noVerificationToken")}
            </h2>
            <p className="text-(--text-muted) mb-6">
              {t("auth", "checkEmailForLink")}
            </p>

            {/* Resend verification form */}
            <div className="mt-8 pt-6 border-t border-(--border)">
              <p className="text-sm text-(--text-muted) mb-4">
                {t("auth", "resendVerificationPrompt")}
              </p>
              <form onSubmit={handleResendVerification} className="space-y-4">
                <div className="relative">
                  <Mail
                    size={18}
                    className={`absolute top-1/2 -translate-y-1/2 text-(--text-muted) ${isRTL ? "right-3" : "left-3"}`}
                  />
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder={t("auth", "emailPlaceholder")}
                    required
                    className={`w-full py-2.5 rounded-lg border border-(--border) bg-(--bg) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full py-3"
                  disabled={isResending}
                >
                  {isResending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("auth", "sendingVerification")}
                    </div>
                  ) : (
                    t("auth", "resendVerificationEmail")
                  )}
                </Button>
              </form>
            </div>

            <Link
              href="/auth/login"
              className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              {t("auth", "backToLogin")}
            </Link>
          </div>
        );
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
              {t("auth", "emailVerificationTitle")}
            </h1>
            <p className="text-lg xl:text-xl text-white/80">
              {t("auth", "emailVerificationSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4 sm:p-8 bg-(--bg) ${isRTL ? "order-1" : "order-2"}`}>
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600">{t("common", "appName")}</h1>
            <p className="text-(--text-muted) mt-2">{t("auth", "emailVerificationTitle")}</p>
          </div>

          {/* Card */}
          <div className="bg-(--bg-card) rounded-2xl border border-(--border) shadow-xl p-6 sm:p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-(--bg)">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
