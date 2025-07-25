import React, { useState, useRef, useEffect } from "react";
import {
  Edit3,
  Save,
  X,
  Camera,
  Trash2,
  Upload,
  User,
  Mail,
  FileText,
  Palette,
} from "lucide-react";
import Button from "./ui/Button";
import { useProfile } from "../hooks/useProfile";

const ProfileEditForm = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    bio: "",
  });

  const fileInputRef = useRef(null);

  // Use our custom hooks
  const {
    currentUser,
    userStats,
    isProfileUpdateLoading,
    isAvatarLoading,
    isLoading,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    ensureFullProfileLoaded,
  } = useProfile();

  // Calculate hasAvatar from currentUser data
  const hasAvatar = currentUser?.avatar && currentUser.avatar.trim() !== "";

  // Load full profile on mount if we only have minimal profile
  useEffect(() => {
    ensureFullProfileLoaded();
  }, []);

  // Initialize form when user data changes or editing starts
  useEffect(() => {
    if (currentUser && isEditing) {
      setEditForm({
        username: currentUser.username || "",
        email: currentUser.email || "",
        bio: currentUser.bio || "",
      });
    }
  }, [currentUser, isEditing]);

  // Handle edit mode
  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original values
    if (currentUser) {
      setEditForm({
        username: currentUser.username || "",
        email: currentUser.email || "",
        bio: currentUser.bio || "",
      });
    }
  };

  const handleSave = async () => {
    if (!editForm.username.trim()) {
      alert("Username is required");
      return;
    }

    if (!editForm.email.trim()) {
      alert("Email is required");
      return;
    }

    const result = await updateProfile({
      username: editForm.username.trim(),
      email: editForm.email.trim(),
      bio: editForm.bio.trim(),
    });

    if (result.success) {
      setIsEditing(false);
    }
  };

  // Avatar handling
  const handleAvatarUpload = async (file) => {
    if (!file) return;
    await uploadAvatar(file);
  };

  const handleAvatarDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your avatar?")) {
      return;
    }
    await deleteAvatar();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  // Add click handler for the drop zone
  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const formatRating = (rating) => {
    if (!rating) return "0.0";
    const numRating = typeof rating === "number" ? rating : parseFloat(rating);
    return isNaN(numRating) ? "0.0" : numRating.toFixed(1);
  };

  // Return loading state if no user data
  if (isLoading || !currentUser) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  };

  const formFields = [
    {
      key: "username",
      label: "Username",
      type: "text",
      value: editForm.username,
      displayValue: currentUser.username,
      required: true,
      icon: <User className="h-4 w-4" />,
    },
    {
      key: "email",
      label: "Email",
      type: "email",
      value: editForm.email,
      displayValue: currentUser.email,
      required: true,
      icon: <Mail className="h-4 w-4" />,
    },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4 md:p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">Profile Information</h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          {!isEditing ? (
            <Button
              variant="secondary"
              size="medium"
              leftIcon={<Edit3 className="h-4 w-4" />}
              onClick={handleEditProfile}
              className="w-full sm:w-auto"
            >
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                size="medium"
                leftIcon={<Save className="h-4 w-4" />}
                onClick={handleSave}
                loading={isProfileUpdateLoading}
                className="w-full sm:w-auto"
              >
                Save Changes
              </Button>
              <Button
                variant="ghost"
                size="medium"
                leftIcon={<X className="h-4 w-4" />}
                onClick={handleCancel}
                disabled={isProfileUpdateLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Avatar Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Profile Picture</h3>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar Display */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden ring-2 ring-gray-600">
              {hasAvatar ? (
                <img
                  src={currentUser.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`${hasAvatar ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-gray-400 text-2xl font-bold`}
              >
                {currentUser.username?.charAt(0)?.toUpperCase() || "?"}
              </div>
            </div>

            {isAvatarLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          {/* Avatar Controls */}
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant="secondary"
                size="small"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isAvatarLoading}
              >
                {hasAvatar ? "Change Photo" : "Upload Photo"}
              </Button>

              {hasAvatar && (
                <Button
                  variant="danger"
                  size="small"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={handleAvatarDelete}
                  disabled={isAvatarLoading}
                >
                  Remove Photo
                </Button>
              )}
            </div>

            {/* Drag and Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${dragOver
                ? "border-red-500 bg-red-500 bg-opacity-10"
                : "border-gray-600 hover:border-gray-500"
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleDropZoneClick}
            >
              <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-400">
                Drag and drop an image here, or click to select
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Theme Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Appearance</h3>
        </div>
        {/* Add theme controls here if needed */}
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {formFields.map((field) => (
          <div key={field.key}>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-300">
              {field.icon}
              {field.label}
              {field.required && <span className="text-red-400">*</span>}
            </label>
            {isEditing ? (
              <input
                type={field.type}
                value={field.value}
                onChange={(e) =>
                  setEditForm({ ...editForm, [field.key]: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-400"
                required={field.required}
                placeholder={`Enter your ${field.label.toLowerCase()}`}
              />
            ) : (
              <p className="text-gray-300 py-2">{field.displayValue}</p>
            )}
          </div>
        ))}

        {/* Bio Field */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-300">
            <FileText className="h-4 w-4" />
            Bio
          </label>
          {isEditing ? (
            <textarea
              value={editForm.bio}
              onChange={(e) =>
                setEditForm({ ...editForm, bio: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-400"
              placeholder="Tell us about yourself..."
            />
          ) : (
            <p className="text-gray-300 py-2">
              {currentUser.bio || "No bio added yet."}
            </p>
          )}
        </div>
      </div>

      {/* Account Stats */}
      <div className="pt-6 border-t border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Account Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-red-400">
              {userStats?.totalFavorites || currentUser?.favoriteMovies?.length || 0}
            </div>
            <div className="text-sm text-gray-400">Favorites</div>
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">
              {userStats?.totalWatched || currentUser?.watchedMovies?.length || 0}
            </div>
            <div className="text-sm text-gray-400">Watched</div>
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-400">
              {formatRating(userStats?.averageRating || currentUser?.stats?.averageRating)}
            </div>
            <div className="text-sm text-gray-400">Avg Rating</div>
          </div>
          <div className="text-center p-4 bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">
              {currentUser.createdAt
                ? new Date(currentUser.createdAt).getFullYear()
                : "N/A"}
            </div>
            <div className="text-sm text-gray-400">Member Since</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditForm;