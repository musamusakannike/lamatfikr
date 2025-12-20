"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Modal, Button } from "@/components/ui";
import {
    Lock,
    Globe,
    Users,
    Mail,
    Phone,
    MapPin,
    Calendar,
    User,
    Briefcase,
    GraduationCap,
    Link as LinkIcon,
    Heart,
    Tag,
    Languages,
    Save,
    X,
    Loader2,
    Shield,
} from "lucide-react";
import { profileApi, type PrivacySettings } from "@/lib/api/profile";
import { getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface PrivacySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type PrivacyLevel = "everyone" | "friends" | "nobody";

interface PrivacyField {
    key: keyof PrivacySettings;
    labelKey: string;
    icon: React.ElementType;
    category: string;
}

const privacyFields: PrivacyField[] = [
    // Contact Information
    { key: "whoCanSeeMyEmail", labelKey: "email", icon: Mail, category: "contact" },
    { key: "whoCanSeeMyPhone", labelKey: "phone", icon: Phone, category: "contact" },

    // Personal Information
    { key: "whoCanSeeMyBirthday", labelKey: "birthday", icon: Calendar, category: "personal" },
    { key: "whoCanSeeMyGender", labelKey: "gender", icon: User, category: "personal" },
    { key: "whoCanSeeMyNationality", labelKey: "nationality", icon: Globe, category: "personal" },
    { key: "whoCanSeeMyCity", labelKey: "city", icon: MapPin, category: "personal" },
    { key: "whoCanSeeMyRelationshipStatus", labelKey: "relationshipStatus", icon: Heart, category: "personal" },

    // Professional Information
    { key: "whoCanSeeMyOccupation", labelKey: "occupation", icon: Briefcase, category: "professional" },
    { key: "whoCanSeeMyWorkingAt", labelKey: "workingAt", icon: Briefcase, category: "professional" },
    { key: "whoCanSeeMySchool", labelKey: "school", icon: GraduationCap, category: "professional" },
    { key: "whoCanSeeMyWebsite", labelKey: "website", icon: LinkIcon, category: "professional" },

    // Interests & Languages
    { key: "whoCanSeeMyInterests", labelKey: "interests", icon: Tag, category: "interests" },
    { key: "whoCanSeeMyLanguages", labelKey: "languagesSpoken", icon: Languages, category: "interests" },

    // Location
    { key: "whoCanSeeMyLocation", labelKey: "location", icon: MapPin, category: "location" },

    // Social
    { key: "whoCanFollowMe", labelKey: "followMe", icon: Users, category: "social" },
    { key: "whoCanMessageMe", labelKey: "messageMe", icon: Mail, category: "social" },
];

const categories = [
    { key: "contact", labelKey: "contactInformation" },
    { key: "personal", labelKey: "personalInformation" },
    { key: "professional", labelKey: "professionalInformation" },
    { key: "interests", labelKey: "interestsAndLanguages" },
    { key: "location", labelKey: "locationInformation" },
    { key: "social", labelKey: "socialSettings" },
];

function PrivacySelector({
    value,
    onChange,
    t,
}: {
    value: PrivacyLevel;
    onChange: (value: PrivacyLevel) => void;
    t: (section: string, key: string) => string;
}) {
    const options: { value: PrivacyLevel; icon: React.ElementType; labelKey: string }[] = [
        { value: "everyone", icon: Globe, labelKey: "everyone" },
        { value: "friends", icon: Users, labelKey: "friends" },
        { value: "nobody", icon: Lock, labelKey: "nobody" },
    ];

    return (
        <div className="flex gap-2">
            {options.map((option) => {
                const Icon = option.icon;
                const isSelected = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            isSelected
                                ? "bg-primary-600 text-white dark:bg-primary-500"
                                : "bg-primary-50 text-(--text-muted) hover:bg-primary-100 dark:bg-primary-950/40 dark:hover:bg-primary-900/60"
                        )}
                    >
                        <Icon size={14} />
                        {t("profile", option.labelKey)}
                    </button>
                );
            })}
        </div>
    );
}

export function PrivacySettingsModal({ isOpen, onClose }: PrivacySettingsModalProps) {
    const { t } = useLanguage();
    const [settings, setSettings] = useState<PrivacySettings>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!isOpen) return;
            try {
                setIsLoading(true);
                const { privacySettings } = await profileApi.getPrivacySettings();
                setSettings(privacySettings);
            } catch (error) {
                toast.error(getErrorMessage(error));
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [isOpen]);

    const handleChange = (key: keyof PrivacySettings, value: PrivacyLevel) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            await profileApi.updatePrivacySettings(settings);
            toast.success(t("profile", "privacyUpdatedSuccessfully"));
            onClose();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} size="lg" title={t("profile", "privacySettings")}>
                <div className="p-8 flex items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-primary-500" />
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" title={t("profile", "privacySettings")}>
            <form onSubmit={handleSubmit}>
                <div className="p-4">
                    {/* Description */}
                    <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-950/40 rounded-lg border border-(--border)">
                        <div className="flex items-start gap-3">
                            <Shield size={20} className="text-primary-600 dark:text-primary-400 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-sm mb-1">{t("profile", "privacySettings")}</h3>
                                <p className="text-xs text-(--text-muted)">
                                    {t("profile", "privacySettingsDescription")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Privacy Settings by Category */}
                    <div className="space-y-6">
                        {categories.map((category) => {
                            const categoryFields = privacyFields.filter((f) => f.category === category.key);
                            if (categoryFields.length === 0) return null;

                            return (
                                <div key={category.key}>
                                    <h4 className="text-sm font-semibold mb-3 text-(--text)">
                                        {t("profile", category.labelKey)}
                                    </h4>
                                    <div className="space-y-3">
                                        {categoryFields.map((field) => {
                                            const Icon = field.icon;
                                            const value = (settings[field.key] as PrivacyLevel) || "everyone";

                                            return (
                                                <div
                                                    key={field.key}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-primary-50/50 dark:bg-primary-950/20 border border-(--border)"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Icon size={16} className="text-primary-500" />
                                                        <span className="text-sm font-medium">
                                                            {t("profile", field.labelKey)}
                                                        </span>
                                                    </div>
                                                    <PrivacySelector
                                                        value={value}
                                                        onChange={(newValue) => handleChange(field.key, newValue)}
                                                        t={t}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-(--border)">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        <X size={16} className="mr-2" />
                        {t("profile", "cancel")}
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSaving}>
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        ) : (
                            <Save size={16} className="mr-2" />
                        )}
                        {t("profile", "saveChanges")}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
