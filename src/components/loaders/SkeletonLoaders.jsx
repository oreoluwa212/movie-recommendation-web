import React from 'react';

// Base skeleton component for common animations
const SkeletonBase = ({ className, children }) => (
  <div className={`animate-pulse ${className}`}>
    {children}
  </div>
);

// Hero Section Skeleton
export const HeroSkeleton = () => (
  <div className="relative h-screen overflow-hidden bg-gray-800">
    <SkeletonBase className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700" />
    
    <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
      <div className="max-w-2xl space-y-4">
        {/* Title skeleton */}
        <SkeletonBase className="h-12 bg-gray-700 rounded-lg w-3/4" />
        
        {/* Rating and year skeleton */}
        <div className="flex items-center space-x-4">
          <SkeletonBase className="h-4 bg-gray-700 rounded w-16" />
          <SkeletonBase className="h-4 bg-gray-700 rounded w-12" />
        </div>
        
        {/* Description skeleton */}
        <div className="space-y-2">
          <SkeletonBase className="h-4 bg-gray-700 rounded w-full" />
          <SkeletonBase className="h-4 bg-gray-700 rounded w-5/6" />
          <SkeletonBase className="h-4 bg-gray-700 rounded w-4/6" />
        </div>
        
        {/* Buttons skeleton */}
        <div className="flex space-x-4 pt-4">
          <SkeletonBase className="h-12 bg-gray-700 rounded-lg w-32" />
          <SkeletonBase className="h-12 bg-gray-700 rounded-lg w-32" />
        </div>
      </div>
    </div>
    
    {/* Navigation dots skeleton */}
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
      {[...Array(3)].map((_, i) => (
        <SkeletonBase key={i} className="w-2 h-2 bg-gray-600 rounded-full" />
      ))}
    </div>
  </div>
);

// Movie Card Skeleton
export const MovieCardSkeleton = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-40',
    medium: 'w-48',
    large: 'w-56'
  };

  const posterSizeClasses = {
    small: 'h-56',
    medium: 'h-64',
    large: 'h-72'
  };

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0`}>
      {/* Poster skeleton */}
      <SkeletonBase className={`${posterSizeClasses[size]} bg-gray-800 rounded-lg mb-2`} />
      
      {/* Title skeleton */}
      <SkeletonBase className="h-4 bg-gray-700 rounded w-4/5 mb-2" />
      
      {/* Rating and year skeleton */}
      <div className="flex items-center justify-between">
        <SkeletonBase className="h-3 bg-gray-700 rounded w-12" />
        <SkeletonBase className="h-3 bg-gray-700 rounded w-10" />
      </div>
    </div>
  );
};

// Movie Section Skeleton
export const MovieSectionSkeleton = ({ 
  cardSize = 'medium', 
  cardCount = 6,
  showViewAll = true,
  showScrollButtons = true 
}) => (
  <div className="mb-12">
    {/* Section Header */}
    <div className="flex items-center justify-between mb-6">
      <SkeletonBase className="h-8 bg-gray-700 rounded w-48" />
      <div className="flex items-center space-x-4">
        {showViewAll && (
          <SkeletonBase className="h-4 bg-gray-700 rounded w-16" />
        )}
        {showScrollButtons && (
          <div className="flex items-center space-x-2">
            <SkeletonBase className="h-8 w-8 bg-gray-700 rounded-full" />
            <SkeletonBase className="h-8 w-8 bg-gray-700 rounded-full" />
          </div>
        )}
      </div>
    </div>

    {/* Movie Cards */}
    <div className="flex space-x-4 overflow-hidden">
      {[...Array(cardCount)].map((_, i) => (
        <MovieCardSkeleton key={i} size={cardSize} />
      ))}
    </div>
  </div>
);

// Navigation Skeleton
export const NavigationSkeleton = () => (
  <nav className="bg-gray-900 border-b border-gray-800">
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between h-16">
        {/* Logo skeleton */}
        <SkeletonBase className="h-8 bg-gray-700 rounded w-32" />
        
        {/* Navigation items skeleton */}
        <div className="hidden md:flex items-center space-x-8">
          {[...Array(5)].map((_, i) => (
            <SkeletonBase key={i} className="h-4 bg-gray-700 rounded w-16" />
          ))}
        </div>
        
        {/* User actions skeleton */}
        <div className="flex items-center space-x-4">
          <SkeletonBase className="h-8 w-8 bg-gray-700 rounded-full" />
          <SkeletonBase className="h-8 w-8 bg-gray-700 rounded-full" />
          <SkeletonBase className="h-8 w-20 bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  </nav>
);

// Complete Home Page Skeleton
export const HomePageSkeleton = () => (
  <div className="bg-gray-900 min-h-screen">
    <NavigationSkeleton />
    
    <main>
      <HeroSkeleton />
      
      <div className="container mx-auto px-4 py-8">
        {/* Multiple movie sections */}
        <MovieSectionSkeleton cardSize="medium" cardCount={6} />
        <MovieSectionSkeleton cardSize="medium" cardCount={6} />
        <MovieSectionSkeleton cardSize="medium" cardCount={6} />
        <MovieSectionSkeleton cardSize="small" cardCount={8} />
      </div>
    </main>
  </div>
);

// Search Results Skeleton
export const SearchResultsSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    {/* Search header skeleton */}
    <div className="mb-8">
      <SkeletonBase className="h-8 bg-gray-700 rounded w-64 mb-2" />
      <SkeletonBase className="h-4 bg-gray-700 rounded w-32" />
    </div>
    
    {/* Search results grid skeleton */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {[...Array(24)].map((_, i) => (
        <MovieCardSkeleton key={i} size="small" />
      ))}
    </div>
  </div>
);

// Movie Details Skeleton
export const MovieDetailsSkeleton = () => (
  <div className="bg-gray-900 min-h-screen">
    {/* Hero/Backdrop skeleton */}
    <div className="relative h-96 bg-gray-800">
      <SkeletonBase className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700" />
      
      <div className="relative z-10 container mx-auto px-4 h-full flex items-end pb-8">
        <div className="flex space-x-6">
          {/* Poster skeleton */}
          <SkeletonBase className="w-48 h-72 bg-gray-700 rounded-lg flex-shrink-0" />
          
          {/* Movie info skeleton */}
          <div className="space-y-4">
            <SkeletonBase className="h-10 bg-gray-700 rounded w-80" />
            <div className="flex items-center space-x-4">
              <SkeletonBase className="h-4 bg-gray-700 rounded w-16" />
              <SkeletonBase className="h-4 bg-gray-700 rounded w-12" />
              <SkeletonBase className="h-4 bg-gray-700 rounded w-20" />
            </div>
            <div className="space-y-2">
              <SkeletonBase className="h-4 bg-gray-700 rounded w-full" />
              <SkeletonBase className="h-4 bg-gray-700 rounded w-5/6" />
              <SkeletonBase className="h-4 bg-gray-700 rounded w-4/6" />
            </div>
            <div className="flex space-x-4 pt-4">
              <SkeletonBase className="h-12 bg-gray-700 rounded-lg w-32" />
              <SkeletonBase className="h-12 bg-gray-700 rounded-lg w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Additional content skeleton */}
    <div className="container mx-auto px-4 py-8">
      <MovieSectionSkeleton cardSize="medium" cardCount={6} />
      <MovieSectionSkeleton cardSize="medium" cardCount={6} />
    </div>
  </div>
);

// Generic Loading Skeleton
export const LoadingSkeleton = ({ lines = 3, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {[...Array(lines)].map((_, i) => (
      <SkeletonBase 
        key={i} 
        className={`h-4 bg-gray-700 rounded ${
          i === lines - 1 ? 'w-3/4' : 'w-full'
        }`} 
      />
    ))}
  </div>
);