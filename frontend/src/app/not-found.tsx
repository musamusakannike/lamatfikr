"use client";

import Link from "next/link";
import { useState } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { Button, Card, CardContent } from "@/components/ui";
import { ArrowLeft, Home, SearchX } from "lucide-react";

export default function NotFound() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-16 lg:pl-64">
        <div className="max-w-2xl mx-auto p-4">
          <Card className="overflow-hidden">
            <div className="relative">
              <div className="h-28 bg-linear-to-br from-primary-500 via-primary-600 to-primary-700" />
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_0%,white,transparent_35%)]" />
              <div className="absolute left-4 -bottom-6 w-12 h-12 rounded-2xl bg-(--bg-card) border border-(--border) shadow-sm flex items-center justify-center">
                <SearchX className="text-primary-600 dark:text-primary-400" size={22} />
              </div>
            </div>

            <CardContent className="pt-10 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">404</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-(--text)">Page not found</h1>
                <p className="text-(--text-muted)">
                  The page you’re looking for doesn’t exist, or it may have been moved.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Link href="/" className="sm:flex-1">
                  <Button variant="primary" className="w-full gap-2">
                    <Home size={18} />
                    Go to home
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="sm:flex-1 gap-2"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft size={18} />
                  Go back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
