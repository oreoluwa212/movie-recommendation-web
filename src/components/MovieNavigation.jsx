import React from 'react';
import { Link, useParams } from 'react-router-dom';

const MovieNavigation = () => {
  const { category } = useParams();
  
  const categories = [
    {
      key: 'popular',
      title: 'Popular',
      path: '/movies/popular'
    },
    {
      key: 'top-rated',
      title: 'Top Rated',
      path: '/movies/top-rated'
    },
    {
      key: 'now-playing',
      title: 'Now Playing',
      path: '/movies/now-playing'
    },
    {
      key: 'upcoming',
      title: 'Upcoming',
      path: '/movies/upcoming'
    },
    {
      key: 'trending',
      title: 'Trending',
      path: '/movies/trending'
    }
  ];

  return (
    <nav className="bg-gray-800 p-4 mb-6 rounded-lg">
      <div className="flex flex-wrap gap-2">
        {categories.map(({ key, title, path }) => (
          <Link
            key={key}
            to={path}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              category === key
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span>{title}</span>
          </Link>
        ))}
      </div>
      
      {/* Debug info */}
      <div className="mt-4 text-xs text-gray-400">
        Current category: {category || 'undefined'}
      </div>
    </nav>
  );
};

export default MovieNavigation;