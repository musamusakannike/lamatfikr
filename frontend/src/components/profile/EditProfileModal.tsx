"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Modal, Button } from "@/components/ui";
import {
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Link as LinkIcon,
  Calendar,
  Heart,
  FileText,
  Save,
  X,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { profileApi } from "@/lib/api/index";
import { getErrorMessage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate?: () => void;
}

const DEFAULT_AVATAR = "/images/default-avatar.svg";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  workingAt: string;
  school: string;
  website: string;
  birthday: string;
  relationshipStatus: string;
  avatar: string;
  coverPhoto: string;
}

const emptyFormData: ProfileFormData = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  phone: "",
  bio: "",
  location: "",
  workingAt: "",
  school: "",
  website: "",
  birthday: "",
  relationshipStatus: "",
  avatar: "",
  coverPhoto: "",
};

const relationshipOptions = [
  "Single",
  "In a relationship",
  "Engaged",
  "Married",
  "It's complicated",
  "Prefer not to say",
];

function FormField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-(--text-muted)">
        <Icon size={16} className="text-primary-500" />
        {label}
      </label>
      {children}
    </div>
  );
}

export function EditProfileModal({ isOpen, onClose, onProfileUpdate }: EditProfileModalProps) {
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>(emptyFormData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [activeSection, setActiveSection] = useState<"basic" | "details" | "photos">("basic");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isOpen) return;
      try {
        setIsLoading(true);
        const { profile } = await profileApi.getProfile();
        setFormData({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          username: profile.username || "",
          email: profile.email || "",
          phone: profile.phone || "",
          bio: profile.bio || "",
          location: profile.address || "",
          workingAt: profile.workingAt || "",
          school: profile.school || "",
          website: profile.website || "",
          birthday: profile.birthday ? profile.birthday.split("T")[0] : "",
          relationshipStatus: profile.relationshipStatus || "",
          avatar: profile.avatar || "",
          coverPhoto: profile.coverPhoto || "",
        });
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen]);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "lamatfikr");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!response.ok) throw new Error("Failed to upload image");
    const data = await response.json();
    return data.secure_url;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const avatarUrl = await uploadToCloudinary(file);
      await profileApi.updateAvatar(avatarUrl);
      setFormData((prev) => ({ ...prev, avatar: avatarUrl }));
      toast.success("Profile photo updated!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      const coverPhotoUrl = await uploadToCloudinary(file);
      await profileApi.updateCoverPhoto(coverPhotoUrl);
      setFormData((prev) => ({ ...prev, coverPhoto: coverPhotoUrl }));
      toast.success("Cover photo updated!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await profileApi.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        bio: formData.bio || undefined,
        birthday: formData.birthday || undefined,
        relationshipStatus: formData.relationshipStatus || undefined,
        address: formData.location || undefined,
        website: formData.website || undefined,
        workingAt: formData.workingAt || undefined,
        school: formData.school || undefined,
      });
      toast.success("Profile updated successfully!");
      refreshUser();
      onProfileUpdate?.();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses = cn(
    "w-full px-3 py-2.5 rounded-lg text-sm",
    "bg-primary-50/80 dark:bg-primary-950/40",
    "border border-(--border)",
    "focus:border-primary-400 dark:focus:border-primary-500",
    "placeholder:text-(--text-muted)",
    "outline-none transition-all duration-200"
  );

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Edit Profile">
        <div className="p-8 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Edit Profile">
      <form onSubmit={handleSubmit}>
        <div className="p-4">
          {/* Section tabs */}
          <div className="flex border-b border-(--border) mb-6">
            <button
              type="button"
              onClick={() => setActiveSection("basic")}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                activeSection === "basic"
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-(--text-muted) hover:text-(--text)"
              )}
            >
              Basic Info
              {activeSection === "basic" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("details")}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                activeSection === "details"
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-(--text-muted) hover:text-(--text)"
              )}
            >
              Details
              {activeSection === "details" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("photos")}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                activeSection === "photos"
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-(--text-muted) hover:text-(--text)"
              )}
            >
              Photos
              {activeSection === "photos" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
              )}
            </button>
          </div>

          {/* Basic Info Section */}
          {activeSection === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="First Name" icon={User}>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={inputClasses}
                    placeholder="Enter first name"
                  />
                </FormField>
                <FormField label="Last Name" icon={User}>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={inputClasses}
                    placeholder="Enter last name"
                  />
                </FormField>
              </div>

              <FormField label="Username" icon={User}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)">
                    @
                  </span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={cn(inputClasses, "pl-8")}
                    placeholder="username"
                  />
                </div>
              </FormField>

              <FormField label="Bio" icon={FileText}>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className={cn(inputClasses, "resize-none")}
                  placeholder="Tell others about yourself..."
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Email" icon={Mail}>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClasses}
                    placeholder="email@example.com"
                  />
                </FormField>
                <FormField label="Phone" icon={Phone}>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClasses}
                    placeholder="+1 234 567 8900"
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Details Section */}
          {activeSection === "details" && (
            <div className="space-y-4">
              <FormField label="Location" icon={MapPin}>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="City, Country"
                />
              </FormField>

              <FormField label="Works at" icon={Briefcase}>
                <input
                  type="text"
                  name="workingAt"
                  value={formData.workingAt}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Company name"
                />
              </FormField>

              <FormField label="Education" icon={GraduationCap}>
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="School or University"
                />
              </FormField>

              <FormField label="Website" icon={LinkIcon}>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="https://yourwebsite.com"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Birthday" icon={Calendar}>
                  <input
                    type="date"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </FormField>
                <FormField label="Relationship Status" icon={Heart}>
                  <select
                    name="relationshipStatus"
                    value={formData.relationshipStatus}
                    onChange={handleChange}
                    className={inputClasses}
                  >
                    {relationshipOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          )}

          {/* Photos Section */}
          {activeSection === "photos" && (
            <div className="space-y-6">
              {/* Cover Photo */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-(--text-muted) mb-2">
                  <Camera size={16} className="text-primary-500" />
                  Cover Photo
                </label>
                <div className="relative h-40 rounded-xl overflow-hidden bg-primary-100 dark:bg-primary-900/50">
                  {formData.coverPhoto && (
                    <Image
                      src={formData.coverPhoto}
                      alt="Cover photo"
                      fill
                      className="object-cover"
                    />
                  )}
                  <div className={cn(
                    "absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity",
                    isUploadingCover ? "opacity-100" : "opacity-0 hover:opacity-100"
                  )}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => coverInputRef.current?.click()}
                      className="gap-2"
                      disabled={isUploadingCover}
                    >
                      {isUploadingCover ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Camera size={16} />
                      )}
                      {isUploadingCover ? "Uploading..." : "Change Cover"}
                    </Button>
                  </div>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Profile Photo */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-(--text-muted) mb-2">
                  <Camera size={16} className="text-primary-500" />
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/50">
                    {formData.avatar ? (
                      <Image
                        src={formData.avatar}
                        alt="Profile photo"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src={DEFAULT_AVATAR}
                        alt="Default avatar"
                        fill
                        className="object-cover"
                      />
                    )}
                    <div className={cn(
                      "absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity cursor-pointer",
                      isUploadingAvatar ? "opacity-100" : "opacity-0 hover:opacity-100"
                    )}
                      onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
                    >
                      {isUploadingAvatar ? (
                        <Loader2 size={24} className="text-white animate-spin" />
                      ) : (
                        <Camera size={24} className="text-white" />
                      )}
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => avatarInputRef.current?.click()}
                      className="gap-2"
                      disabled={isUploadingAvatar}
                    >
                      {isUploadingAvatar ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Camera size={16} />
                      )}
                      {isUploadingAvatar ? "Uploading..." : "Upload Photo"}
                    </Button>
                    <p className="text-xs text-(--text-muted) mt-1">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-(--border)">
          <Button type="button" variant="ghost" onClick={onClose}>
            <X size={16} className="mr-2" />
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
