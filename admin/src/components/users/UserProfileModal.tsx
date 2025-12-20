"use client";

import { useState, useEffect, useCallback } from "react";
import { X, User, Briefcase, Heart, Tag, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient, getErrorMessage } from "@/lib/api";
import type { AdminUserProfile, AdminUserProfileResponse, UpdateAdminUserProfileData } from "@/types/admin-users";

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onProfileUpdate?: () => void;
}

export default function UserProfileModal({ isOpen, onClose, userId, onProfileUpdate }: UserProfileModalProps) {
    const { t, isRTL } = useLanguage();

    const [profile, setProfile] = useState<AdminUserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form data
    const [formData, setFormData] = useState<UpdateAdminUserProfileData>({});
    const [newInterest, setNewInterest] = useState("");
    const [newLanguage, setNewLanguage] = useState("");

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.get<AdminUserProfileResponse>(`/admin/users/${userId}/profile`);
            setProfile(data.profile);
            setFormData({
                firstName: data.profile.firstName,
                lastName: data.profile.lastName,
                bio: data.profile.bio,
                gender: data.profile.gender,
                birthday: data.profile.birthday ? data.profile.birthday.split("T")[0] : "",
                relationshipStatus: data.profile.relationshipStatus,
                address: data.profile.address,
                nationality: data.profile.nationality,
                city: data.profile.city,
                occupation: data.profile.occupation,
                website: data.profile.website,
                workingAt: data.profile.workingAt,
                school: data.profile.school,
                interests: data.profile.interests || [],
                languagesSpoken: data.profile.languagesSpoken || [],
                phone: data.profile.phone,
            });
        } catch (e) {
            setError(getErrorMessage(e) || t("adminUserProfile", "failedToLoad"));
        } finally {
            setLoading(false);
        }
    }, [userId, t]);

    useEffect(() => {
        if (isOpen && userId) {
            fetchProfile();
        }
    }, [isOpen, userId, fetchProfile]);

    const handleSave = async () => {
        if (!profile) return;

        setIsSaving(true);
        try {
            const updateData: UpdateAdminUserProfileData = {};

            // Only include changed fields
            if (formData.firstName !== profile.firstName) updateData.firstName = formData.firstName;
            if (formData.lastName !== profile.lastName) updateData.lastName = formData.lastName;
            if (formData.bio !== profile.bio) updateData.bio = formData.bio;
            if (formData.gender !== profile.gender) updateData.gender = formData.gender;
            if (formData.birthday !== (profile.birthday ? profile.birthday.split("T")[0] : "")) updateData.birthday = formData.birthday;
            if (formData.relationshipStatus !== profile.relationshipStatus) updateData.relationshipStatus = formData.relationshipStatus;
            if (formData.address !== profile.address) updateData.address = formData.address;
            if (formData.nationality !== profile.nationality) updateData.nationality = formData.nationality;
            if (formData.city !== profile.city) updateData.city = formData.city;
            if (formData.occupation !== profile.occupation) updateData.occupation = formData.occupation;
            if (formData.website !== profile.website) updateData.website = formData.website;
            if (formData.workingAt !== profile.workingAt) updateData.workingAt = formData.workingAt;
            if (formData.school !== profile.school) updateData.school = formData.school;
            if (formData.phone !== profile.phone) updateData.phone = formData.phone;
            if (JSON.stringify(formData.interests) !== JSON.stringify(profile.interests)) updateData.interests = formData.interests;
            if (JSON.stringify(formData.languagesSpoken) !== JSON.stringify(profile.languagesSpoken)) updateData.languagesSpoken = formData.languagesSpoken;

            await apiClient.patch(`/admin/users/${userId}/profile`, updateData);

            await fetchProfile();
            setIsEditMode(false);
            onProfileUpdate?.();
        } catch (e) {
            setError(getErrorMessage(e) || t("adminUserProfile", "failedToUpdate"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addInterest = () => {
        if (!newInterest.trim()) return;
        if (formData.interests && formData.interests.includes(newInterest.trim())) return;
        setFormData(prev => ({ ...prev, interests: [...(prev.interests || []), newInterest.trim()] }));
        setNewInterest("");
    };

    const removeInterest = (interest: string) => {
        setFormData(prev => ({ ...prev, interests: (prev.interests || []).filter(i => i !== interest) }));
    };

    const addLanguage = () => {
        if (!newLanguage.trim()) return;
        if (formData.languagesSpoken && formData.languagesSpoken.includes(newLanguage.trim())) return;
        setFormData(prev => ({ ...prev, languagesSpoken: [...(prev.languagesSpoken || []), newLanguage.trim()] }));
        setNewLanguage("");
    };

    const removeLanguage = (lang: string) => {
        setFormData(prev => ({ ...prev, languagesSpoken: (prev.languagesSpoken || []).filter(l => l !== lang) }));
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString();
    };

    const inputClasses = cn(
        "w-full px-3 py-2 rounded-lg text-sm",
        "bg-(--bg) border border-(--border)",
        "focus:border-primary-400 dark:focus:border-primary-500",
        "placeholder:text-(--text-muted)",
        "outline-none transition-all duration-200"
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className={cn(
                "bg-(--bg-card) rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col",
                isRTL ? "text-right" : "text-left"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-(--border)">
                    <h2 className="text-xl font-bold text-(--text)">
                        {t("adminUserProfile", "title")} - {profile?.username || ""}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-(--bg) rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className={cn("flex border-b border-(--border)", isRTL ? "flex-row-reverse" : "")}>
                    <button
                        onClick={() => setIsEditMode(false)}
                        className={cn(
                            "flex-1 py-3 text-sm font-medium transition-colors relative",
                            !isEditMode ? "text-primary-600 dark:text-primary-400" : "text-(--text-muted) hover:text-(--text)"
                        )}
                    >
                        {t("adminUserProfile", "viewMode")}
                        {!isEditMode && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />}
                    </button>
                    <button
                        onClick={() => setIsEditMode(true)}
                        className={cn(
                            "flex-1 py-3 text-sm font-medium transition-colors relative",
                            isEditMode ? "text-primary-600 dark:text-primary-400" : "text-(--text-muted) hover:text-(--text)"
                        )}
                    >
                        {t("adminUserProfile", "editMode")}
                        {isEditMode && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-(--text-muted)">{t("adminUserProfile", "loadingProfile")}</div>
                        </div>
                    ) : error ? (
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                            {error}
                        </div>
                    ) : profile ? (
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <Section title={t("adminUserProfile", "basicInfo")} icon={User}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label={t("adminUserProfile", "firstName")} value={profile.firstName} isEdit={isEditMode}>
                                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClasses} />
                                    </Field>
                                    <Field label={t("adminUserProfile", "lastName")} value={profile.lastName} isEdit={isEditMode}>
                                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClasses} />
                                    </Field>
                                    <Field label={t("adminUserProfile", "username")} value={`@${profile.username}`} isEdit={false} />
                                    <Field label={t("adminUserProfile", "email")} value={profile.email} isEdit={false} />
                                    <Field label={t("adminUserProfile", "phone")} value={profile.phone || "-"} isEdit={isEditMode}>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClasses} />
                                    </Field>
                                    <Field label={t("adminUserProfile", "birthday")} value={profile.birthday ? new Date(profile.birthday).toLocaleDateString() : "-"} isEdit={isEditMode}>
                                        <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} className={inputClasses} />
                                    </Field>
                                </div>
                                <Field label={t("adminUserProfile", "bio")} value={profile.bio || "-"} isEdit={isEditMode} fullWidth>
                                    <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className={cn(inputClasses, "resize-none")} />
                                </Field>
                            </Section>

                            {/* Personal Details */}
                            <Section title={t("adminUserProfile", "personalDetails")} icon={Heart}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label={t("adminUserProfile", "gender")} value={profile.gender || "-"} isEdit={isEditMode}>
                                        <select name="gender" value={formData.gender} onChange={handleChange} className={inputClasses}>
                                            <option value="">{t("adminUserProfile", "preferNotToSay")}</option>
                                            <option value="male">{t("adminUserProfile", "male")}</option>
                                            <option value="female">{t("adminUserProfile", "female")}</option>
                                            <option value="other">{t("adminUserProfile", "other")}</option>
                                        </select>
                                    </Field>
                                    <Field label={t("adminUserProfile", "relationshipStatus")} value={profile.relationshipStatus || "-"} isEdit={isEditMode}>
                                        <select name="relationshipStatus" value={formData.relationshipStatus} onChange={handleChange} className={inputClasses}>
                                            <option value="">-</option>
                                            <option value="Single">{t("adminUserProfile", "single")}</option>
                                            <option value="In a relationship">{t("adminUserProfile", "inRelationship")}</option>
                                            <option value="Engaged">{t("adminUserProfile", "engaged")}</option>
                                            <option value="Married">{t("adminUserProfile", "married")}</option>
                                            <option value="It's complicated">{t("adminUserProfile", "complicated")}</option>
                                        </select>
                                    </Field>
                                    <Field label={t("adminUserProfile", "nationality")} value={profile.nationality || "-"} isEdit={isEditMode}>
                                        <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className={inputClasses} />
                                    </Field>
                                    <Field label={t("adminUserProfile", "city")} value={profile.city || "-"} isEdit={isEditMode}>
                                        <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClasses} />
                                    </Field>
                                    <Field label={t("adminUserProfile", "location")} value={profile.address || "-"} isEdit={isEditMode} fullWidth>
                                        <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClasses} />
                                    </Field>
                                </div>
                            </Section>

                            {/* Professional */}
                            <Section title={t("adminUserProfile", "professional")} icon={Briefcase}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label={t("adminUserProfile", "occupation")} value={profile.occupation || "-"} isEdit={isEditMode}>
                                        <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} className={inputClasses} />
                                    </Field>
                                    <Field label={t("adminUserProfile", "workingAt")} value={profile.workingAt || "-"} isEdit={isEditMode}>
                                        <input type="text" name="workingAt" value={formData.workingAt} onChange={handleChange} className={inputClasses} />
                                    </Field>
                                    <Field label={t("adminUserProfile", "school")} value={profile.school || "-"} isEdit={isEditMode}>
                                        <input type="text" name="school" value={formData.school} onChange={handleChange} className={inputClasses} />
                                    </Field>
                                    <Field label={t("adminUserProfile", "website")} value={profile.website || "-"} isEdit={isEditMode}>
                                        <input type="url" name="website" value={formData.website} onChange={handleChange} className={inputClasses} placeholder="https://" />
                                    </Field>
                                </div>
                            </Section>

                            {/* Interests & Languages */}
                            <Section title={t("adminUserProfile", "interestsLanguages")} icon={Tag}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-(--text-muted) mb-2 block">{t("adminUserProfile", "interests")}</label>
                                        {isEditMode ? (
                                            <div className="space-y-2">
                                                <div className={cn("flex gap-2", isRTL ? "flex-row-reverse" : "")}>
                                                    <input
                                                        value={newInterest}
                                                        onChange={(e) => setNewInterest(e.target.value)}
                                                        placeholder={t("adminUserProfile", "interestsPlaceholder")}
                                                        className={inputClasses}
                                                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                                                    />
                                                    <button type="button" onClick={addInterest} disabled={!newInterest.trim()} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(formData.interests || []).map((interest) => (
                                                        <div key={interest} className="bg-primary-100 dark:bg-primary-900 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                                            <span>{interest}</span>
                                                            <button type="button" onClick={() => removeInterest(interest)} className="hover:text-red-500">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {profile.interests.length > 0 ? profile.interests.map((interest) => (
                                                    <span key={interest} className="bg-primary-100 dark:bg-primary-900 px-3 py-1 rounded-full text-sm">{interest}</span>
                                                )) : <span className="text-(--text-muted)">-</span>}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-(--text-muted) mb-2 block">{t("adminUserProfile", "languagesSpoken")}</label>
                                        {isEditMode ? (
                                            <div className="space-y-2">
                                                <div className={cn("flex gap-2", isRTL ? "flex-row-reverse" : "")}>
                                                    <input
                                                        value={newLanguage}
                                                        onChange={(e) => setNewLanguage(e.target.value)}
                                                        placeholder={t("adminUserProfile", "languagesPlaceholder")}
                                                        className={inputClasses}
                                                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
                                                    />
                                                    <button type="button" onClick={addLanguage} disabled={!newLanguage.trim()} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(formData.languagesSpoken || []).map((lang) => (
                                                        <div key={lang} className="bg-primary-100 dark:bg-primary-900 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                                            <span>{lang}</span>
                                                            <button type="button" onClick={() => removeLanguage(lang)} className="hover:text-red-500">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {profile.languagesSpoken.length > 0 ? profile.languagesSpoken.map((lang) => (
                                                    <span key={lang} className="bg-primary-100 dark:bg-primary-900 px-3 py-1 rounded-full text-sm">{lang}</span>
                                                )) : <span className="text-(--text-muted)">-</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Section>

                            {/* Account Status */}
                            <Section title={t("adminUserProfile", "accountStatus")} icon={User}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label={t("adminUserProfile", "role")} value={profile.role} isEdit={false} />
                                    <Field label={t("adminUserProfile", "banned")} value={profile.isBanned ? t("adminUsers", "yes") : t("adminUsers", "no")} isEdit={false} />
                                    <Field label={t("adminUserProfile", "emailVerified")} value={profile.emailVerified ? t("adminUsers", "yes") : t("adminUsers", "no")} isEdit={false} />
                                    <Field label={t("adminUserProfile", "verified")} value={profile.effectiveVerified ? t("adminUsers", "yes") : t("adminUsers", "no")} isEdit={false} />
                                    <Field label={t("adminUserProfile", "createdAt")} value={formatDate(profile.createdAt)} isEdit={false} />
                                    <Field label={t("adminUserProfile", "lastActive")} value={formatDate(profile.lastActive)} isEdit={false} />
                                </div>
                            </Section>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                {isEditMode && profile && (
                    <div className={cn("flex items-center justify-end gap-3 p-4 border-t border-(--border)", isRTL ? "flex-row-reverse" : "")}>
                        <button onClick={() => setIsEditMode(false)} className="px-4 py-2 rounded-lg border border-(--border) hover:bg-(--bg) transition-colors">
                            {t("adminUserProfile", "cancel")}
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors">
                            {isSaving ? t("adminUserProfile", "saving") : t("adminUserProfile", "saveChanges")}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ size?: number; className?: string }>; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-(--text)">
                <Icon size={20} className="text-primary-500" />
                {title}
            </h3>
            {children}
        </div>
    );
}

function Field({ label, value, isEdit, children, fullWidth }: { label: string; value?: string; isEdit: boolean; children?: React.ReactNode; fullWidth?: boolean }) {
    return (
        <div className={fullWidth ? "md:col-span-2" : ""}>
            <label className="text-sm font-medium text-(--text-muted) mb-1 block">{label}</label>
            {isEdit && children ? (
                children
            ) : (
                <div className="text-(--text)">{value || "-"}</div>
            )}
        </div>
    );
}
