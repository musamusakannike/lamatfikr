"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, Button } from "@/components/ui";
import {
  CheckCircle,
  Camera,
  User,
  FileText,
  MapPin,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
} from "lucide-react";
import { profileApi } from "@/lib/api/index";
import type { User as UserType } from "@/types/auth";

interface CompletionStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  action: string;
}

interface ProfileCompletionProps {
  onEditProfile?: () => void;
}

const getCompletionSteps = (profile: UserType | null): CompletionStep[] => [
  {
    id: "avatar",
    label: "Add profile photo",
    description: "Help others recognize you",
    icon: Camera,
    completed: !!profile?.avatar,
    action: "Upload Photo",
  },
  {
    id: "bio",
    label: "Write a bio",
    description: "Tell others about yourself",
    icon: FileText,
    completed: !!profile?.bio,
    action: "Add Bio",
  },
  {
    id: "details",
    label: "Add personal details",
    description: "Share your phone and birthday",
    icon: User,
    completed: !!(profile?.phone || profile?.birthday),
    action: "Add Details",
  },
  {
    id: "location",
    label: "Add your location",
    description: "Let others know where you're from",
    icon: MapPin,
    completed: !!profile?.address,
    action: "Add Location",
  },
  {
    id: "work",
    label: "Add work experience",
    description: "Share your professional background",
    icon: Briefcase,
    completed: !!(profile?.workingAt || profile?.school),
    action: "Add Work",
  },
];

export function ProfileCompletion({ onEditProfile }: ProfileCompletionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [profile, setProfile] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const { profile: profileData } = await profileApi.getProfile();
        setProfile(profileData);
      } catch (error) {
        console.error("Failed to fetch profile for completion:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const completionSteps = getCompletionSteps(profile);
  const completedCount = completionSteps.filter((step) => step.completed).length;
  const totalSteps = completionSteps.length;
  const completionPercentage = Math.round((completedCount / totalSteps) * 100);
  const isComplete = completedCount === totalSteps;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-primary-500" />
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Complete your profile</h3>
              <p className="text-sm text-(--text-muted)">
                {completedCount} of {totalSteps} steps completed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress circle */}
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-primary-100 dark:text-primary-900/50"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${completionPercentage * 1.256} 125.6`}
                  strokeLinecap="round"
                  className="text-primary-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {completionPercentage}%
              </span>
            </div>
            {isExpanded ? (
              <ChevronUp size={20} className="text-(--text-muted)" />
            ) : (
              <ChevronDown size={20} className="text-(--text-muted)" />
            )}
          </div>
        </button>

        {/* Steps */}
        {isExpanded && (
          <div className="mt-4 space-y-3">
            {completionSteps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-colors",
                  step.completed
                    ? "bg-green-50 dark:bg-green-900/20"
                    : "bg-primary-50 dark:bg-primary-900/30"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    step.completed
                      ? "bg-green-100 dark:bg-green-900/50"
                      : "bg-primary-100 dark:bg-primary-900/50"
                  )}
                >
                  {step.completed ? (
                    <CheckCircle
                      size={20}
                      className="text-green-600 dark:text-green-400"
                    />
                  ) : (
                    <step.icon
                      size={20}
                      className="text-primary-600 dark:text-primary-400"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-medium text-sm",
                      step.completed && "line-through text-(--text-muted)"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-(--text-muted) truncate">
                    {step.description}
                  </p>
                </div>
                {!step.completed && (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={onEditProfile}
                  >
                    {step.action}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
