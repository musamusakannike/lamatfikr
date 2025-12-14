"use client";

import { useState, useRef } from "react";
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
} from "lucide-react";
import Image from "next/image";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

const initialFormData: ProfileFormData = {
  firstName: "John",
  lastName: "Doe",
  username: "johndoe",
  email: "john.doe@example.com",
  phone: "+1 234 567 8900",
  bio: "Full-stack developer passionate about building great products. Love coffee, coding, and creating meaningful connections.",
  location: "San Francisco, CA",
  workingAt: "Tech Startup Inc.",
  school: "Stanford University",
  website: "https://johndoe.dev",
  birthday: "1995-01-15",
  relationshipStatus: "Single",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop",
  coverPhoto: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop",
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

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<"basic" | "details" | "photos">("basic");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, avatar: url }));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, coverPhoto: url }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // TODO: Implement actual API call
    console.log("Saving profile:", formData);

    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 1000);
  };

  const inputClasses = cn(
    "w-full px-3 py-2.5 rounded-lg text-sm",
    "bg-primary-50/80 dark:bg-primary-950/40",
    "border border-(--border)",
    "focus:border-primary-400 dark:focus:border-primary-500",
    "placeholder:text-(--text-muted)",
    "outline-none transition-all duration-200"
  );

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
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => coverInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Camera size={16} />
                      Change Cover
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
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {formData.firstName.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Camera size={24} className="text-white" />
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
                    >
                      <Camera size={16} />
                      Upload Photo
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
