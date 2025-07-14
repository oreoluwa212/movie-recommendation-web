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
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="medium"
          leftIcon={<ArrowLeft className="h-5 w-5" />}
          onClick={onBackClick}
        >
          Back to Home
        </Button>
        <h1 className="text-3xl font-bold">{getSectionTitle()}</h1>
      </div>

      {userData && (
        <div className="flex items-center space-x-2">
          <User className="h-6 w-6 text-gray-400" />
          <span className="text-lg">{userData.username}</span>
        </div>
      )}
    </div>
  );
};

export default UserPageHeader;
