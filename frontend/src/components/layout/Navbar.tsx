"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, Button } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Search,
  Bell,
  MessageCircle,
  Menu,
  X,
  Sun,
  Moon,
  Plus,
} from "lucide-react";

interface NavbarProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export function Navbar({ onMenuToggle, isSidebarOpen }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--bg-card)] border-b border-[var(--border)] backdrop-blur-sm bg-opacity-95">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              Lamatfikr
            </span>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-xl hidden sm:block">
          <div
            className={cn(
              "relative flex items-center transition-all duration-200",
              searchFocused && "scale-[1.02]"
            )}
          >
            <Search
              size={18}
              className="absolute left-3 text-[var(--text-muted)]"
            />
            <input
              type="text"
              placeholder="Search posts, people, communities..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-transparent focus:border-primary-400 focus:bg-[var(--bg-card)] outline-none transition-all duration-200 text-sm"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
          >
            <Search size={20} />
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="hidden sm:flex gap-1.5"
          >
            <Plus size={16} />
            <span>Create</span>
          </Button>

          <Button variant="ghost" size="icon" className="relative">
            <MessageCircle size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
          </Button>

          <Button variant="ghost" size="icon" className="relative">
            <Bell size={20} />
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1">
              5
            </span>
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {resolvedTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </Button>

          <Avatar
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
            alt="User"
            size="sm"
            online
            className="ml-1 cursor-pointer"
          />
        </div>
      </div>
    </header>
  );
}
