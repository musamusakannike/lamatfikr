"use client";

import { useState } from "react";
import Link from "next/link";

import { Navbar, Sidebar } from "@/components/layout";
import { Card, CardContent } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

function renderBlocks(text: string) {
  return text
    .split("\n\n")
    .map((block) => block.trim())
    .filter(Boolean);
}

export default function TermsOfServicePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isRTL, t } = useLanguage();

  const title = t("legal", "termsTitle");
  const updated = t("legal", "lastUpdated");
  const intro = t("legal", "termsIntro");
  const body = t("legal", "termsBody");
  const contact = t("legal", "contactUs");

  return (
    <div className="min-h-screen">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={cn("pt-16", isRTL ? "lg:pr-64" : "lg:pl-64")}>
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold">{title}</h1>
            <Link href="/privacy-policy" className="text-sm text-primary-600 hover:underline">
              {t("legal", "viewPrivacy")}
            </Link>
          </div>

          <Card>
            <CardContent className={cn("p-4 space-y-4", isRTL ? "text-right" : "text-left")}>
              <p className="text-sm text-(--text-muted)">{updated}</p>
              <p className="text-sm whitespace-pre-wrap">{intro}</p>
              <div className="space-y-3">
                {renderBlocks(body).map((block) => (
                  <p key={block} className="text-sm whitespace-pre-wrap leading-6">
                    {block}
                  </p>
                ))}
              </div>
              <p className="text-sm whitespace-pre-wrap">{contact}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
