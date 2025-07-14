// components/ProfileEditForm.jsx
import React from "react";
import { Edit3, Save, X } from "lucide-react";
import Button from "./ui/Button";

const ProfileEditForm = ({
  userData,
  editForm,
  setEditForm,
  isEditing,
  setIsEditing,
  onSave,
  onCancel,
  loading,
}) => {
  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const formFields = [
    {
      key: "firstName",
      label: "First Name",
      type: "text",
      value: editForm.firstName,
      displayValue: userData.firstName || "Not specified",
    },
    {
      key: "lastName",
      label: "Last Name",
      type: "text",
      value: editForm.lastName,
      displayValue: userData.lastName || "Not specified",
    },
    {
      key: "username",
      label: "Username",
      type: "text",
      value: editForm.username,
      displayValue: userData.username,
    },
    {
      key: "email",
      label: "Email",
      type: "email",
      value: editForm.email,
      displayValue: userData.email,
    },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4 md:p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Profile Information</h2>
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
                onClick={onSave}
                loading={loading}
                className="w-full sm:w-auto"
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="medium"
                leftIcon={<X className="h-4 w-4" />}
                onClick={onCancel}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formFields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-2">
              {field.label}
            </label>
            {isEditing ? (
              <input
                type={field.type}
                value={field.value}
                onChange={(e) =>
                  setEditForm({ ...editForm, [field.key]: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-red-500 focus:outline-none"
              />
            ) : (
              <p className="text-gray-300">{field.displayValue}</p>
            )}
          </div>
        ))}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Bio</label>
          {isEditing ? (
            <textarea
              value={editForm.bio}
              onChange={(e) =>
                setEditForm({ ...editForm, bio: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-red-500 focus:outline-none"
              placeholder="Tell us about yourself..."
            />
          ) : (
            <p className="text-gray-300">
              {userData.bio || "No bio added yet."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileEditForm;
