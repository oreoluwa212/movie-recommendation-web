// components/UserPageTabs.jsx
import React from "react";
import { Heart, BookOpen, Eye, User } from "lucide-react";

const UserPageTabs = ({ activeTab, onTabChange, getTabCount }) => {
  const tabs = [
    {
      id: "favorites",
      label: "Favorites",
      icon: Heart,
      count: getTabCount("favorites"),
    },
    {
      id: "watchlist",
      label: "Watchlists",
      icon: BookOpen,
      count: getTabCount("watchlist"),
    },
    {
      id: "watched",
      label: "Watched",
      icon: Eye,
      count: getTabCount("watched"),
    },
    { id: "profile", label: "Profile", icon: User, count: null },
  ];

  return (
    <div className="border-b border-gray-800 mb-8">
      <nav className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default UserPageTabs;
