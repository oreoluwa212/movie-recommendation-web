// components/UserPageHeader.jsx
import React from "react";
import { ArrowLeft, User } from "lucide-react";
import Button from "./ui/Button";

const UserPageHeader = ({ activeTab, user, profile, onBackClick }) => {
  const getSectionTitle = () => {
    if (!activeTab) return "My Section"; // fallback if undefined

    switch (activeTab) {
      case "profile":
        return "Profile";
      case "watched":
        return "Watched Movies";
      case "watchlist":
        return "My Watchlists";
      default:
        return `My ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
    }
  };

  const userData = profile || user;

  return (
    <div className="mb-6 sm:mb-8">
      {/* Mobile Layout */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="medium"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={onBackClick}
              className="text-sm"
            >
              Back
            </Button>
          </div>
          {userData && (
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium truncate max-w-[120px]">
                {userData.username}
              </span>
            </div>
          )}
        </div>
        <h1 className="text-xl font-bold">{getSectionTitle()}</h1>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="medium"
            leftIcon={<ArrowLeft className="h-5 w-5" />}
            onClick={onBackClick}
            className="text-base"
          >
            Back to Home
          </Button>
          <h1 className="text-2xl lg:text-3xl font-bold truncate">
            {getSectionTitle()}
          </h1>
        </div>

        {userData && (
          <div className="flex items-center space-x-2">
            <User className="h-6 w-6 text-gray-400 flex-shrink-0" />
            <span className="text-lg truncate">{userData.username}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPageHeader;
