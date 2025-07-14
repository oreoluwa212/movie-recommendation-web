// components/ProfileStatistics.jsx
import React from "react";
import { Heart, BookOpen, Eye, Star } from "lucide-react";

const ProfileStatistics = ({ favorites, watchlists, watchedMovies, stats }) => {
  const statisticsData = [
    {
      icon: Heart,
      count: favorites?.length || 0,
      label: "Favorites",
      color: "text-red-500",
    },
    {
      icon: BookOpen,
      count: watchlists?.length || 0,
      label: "Watchlists",
      color: "text-blue-500",
    },
    {
      icon: Eye,
      count: watchedMovies?.length || 0,
      label: "Watched",
      color: "text-green-500",
    },
    {
      icon: Star,
      count: stats?.totalReviews || 0,
      label: "Reviews",
      color: "text-yellow-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
      {statisticsData.map((stat, index) => (
        <div
          key={index}
          className="bg-gray-800 rounded-lg p-4 md:p-6 text-center hover:bg-gray-750 transition-colors"
        >
          <stat.icon
            className={`h-6 md:h-8 w-6 md:w-8 ${stat.color} mx-auto mb-2`}
          />
          <h3 className="text-xl md:text-2xl font-bold">{stat.count}</h3>
          <p className="text-sm text-gray-400">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default ProfileStatistics;
