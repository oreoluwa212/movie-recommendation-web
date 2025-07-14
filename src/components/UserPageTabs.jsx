// components/UserPageTabs.jsx
import React from "react";
import { Heart, BookOpen, Eye, User } from "lucide-react";

const UserPageTabs = ({ activeTab, onTabChange, getTabCount }) => {
  const tabs = [
    {
      id: "favorites",
      label: "Favorites",
      shortLabel: "Fav",
      icon: Heart,
      count: getTabCount("favorites"),
    },
    {
      id: "watchlist",
      label: "Watchlists",
      shortLabel: "Lists",
      icon: BookOpen,
      count: getTabCount("watchlist"),
    },
    {
      id: "watched",
      label: "Watched",
      shortLabel: "Watched",
      icon: Eye,
      count: getTabCount("watched"),
    },
    {
      id: "profile",
      label: "Profile",
      shortLabel: "Profile",
      icon: User,
      count: null,
    },
  ];

  return (
    <div className="border-b border-gray-800 mb-6 sm:mb-8">
      <nav className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 py-3 sm:py-4 px-1 sm:px-3 lg:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors flex-1 sm:flex-none min-w-0 ${
              activeTab === tab.id
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            <div className="flex items-center space-x-1">
              <tab.icon className="h-4 w-4 flex-shrink-0" />
              {tab.count !== null && (
                <span className="bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 min-w-0 sm:hidden">
                  {tab.count > 99 ? "99+" : tab.count}
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm truncate leading-tight">
              {tab.shortLabel}
            </span>
            {tab.count !== null && (
              <span className="hidden sm:inline bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full flex-shrink-0">
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
