import React, { useState, useEffect, useCallback } from 'react';
import { Filter, X, ChevronDown, Search, Calendar, Star, Tag, ArrowUpDown } from 'lucide-react';

const MovieFilter = ({
  onFilterChange,
  genres = [],
  initialFilters = {},
  showAdvanced = true,
  compact = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    minRating: '',
    maxRating: '',
    releaseYear: '',
    genres: [],
    sortBy: 'popularity',
    sortOrder: 'desc',
    ...initialFilters
  });

  const [tempFilters, setTempFilters] = useState(filters);

  // Sort options
  const sortOptions = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'rating', label: 'Rating' },
    { value: 'release_date', label: 'Release Date' },
    { value: 'title', label: 'Title' },
  ];

  // Generate year options (current year back to 1900)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear + 1; year >= 1900; year--) {
    yearOptions.push(year);
  }

  // Update filters when initialFilters change
  useEffect(() => {
    setFilters(prev => ({ ...prev, ...initialFilters }));
    setTempFilters(prev => ({ ...prev, ...initialFilters }));
  }, [initialFilters]);

  // Notify parent of filter changes
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  }, [onFilterChange]);

  // Apply temporary filters
  const applyFilters = () => {
    handleFilterChange(tempFilters);
    if (compact) setIsOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    const defaultFilters = {
      page: 1,
      minRating: '',
      maxRating: '',
      releaseYear: '',
      genres: [],
      sortBy: 'popularity',
      sortOrder: 'desc',
    };
    setTempFilters(defaultFilters);
    handleFilterChange(defaultFilters);
    if (compact) setIsOpen(false);
  };

  // Handle genre toggle
  const toggleGenre = (genreId) => {
    setTempFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter(id => id !== genreId)
        : [...prev.genres, genreId]
    }));
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setTempFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filters.minRating ||
      filters.maxRating ||
      filters.releaseYear ||
      filters.genres.length > 0 ||
      filters.sortBy !== 'popularity'
    );
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.minRating || filters.maxRating) count++;
    if (filters.releaseYear) count++;
    if (filters.genres.length > 0) count++;
    if (filters.sortBy !== 'popularity') count++;
    return count;
  };

  // Compact filter button
  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {hasActiveFilters() && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
              {getActiveFilterCount()}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
            <div className="p-4 space-y-4">
              <FilterContent
                tempFilters={tempFilters}
                genres={genres}
                sortOptions={sortOptions}
                yearOptions={yearOptions}
                handleInputChange={handleInputChange}
                toggleGenre={toggleGenre}
                showAdvanced={showAdvanced}
              />
              <div className="flex gap-2 pt-2 border-t border-gray-700">
                <button
                  onClick={applyFilters}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full filter component
  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filter Movies
        </h3>
        {hasActiveFilters() && (
          <button
            onClick={resetFilters}
            className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        <FilterContent
          tempFilters={tempFilters}
          genres={genres}
          sortOptions={sortOptions}
          yearOptions={yearOptions}
          handleInputChange={handleInputChange}
          toggleGenre={toggleGenre}
          showAdvanced={showAdvanced}
        />

        <div className="flex gap-2 pt-4 border-t border-gray-700">
          <button
            onClick={applyFilters}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

// Separate component for filter content to avoid duplication
const FilterContent = ({
  tempFilters,
  genres,
  sortOptions,
  yearOptions,
  handleInputChange,
  toggleGenre,
  showAdvanced
}) => {
  return (
    <>
      {/* Rating Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white flex items-center gap-2">
          <Star className="h-4 w-4" />
          Rating Range
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            placeholder="Min"
            value={tempFilters.minRating}
            onChange={(e) => handleInputChange('minRating', e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            placeholder="Max"
            value={tempFilters.maxRating}
            onChange={(e) => handleInputChange('maxRating', e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Year Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Release Year
        </label>
        <select
          value={tempFilters.releaseYear}
          onChange={(e) => handleInputChange('releaseYear', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All Years</option>
          {yearOptions.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Genre Filter */}
      {genres.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Genres
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {genres.map(genre => (
              <button
                key={genre.id}
                onClick={() => toggleGenre(genre.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  tempFilters.genres.includes(genre.id)
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort Options */}
      {showAdvanced && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Sort By
          </label>
          <div className="flex gap-2">
            <select
              value={tempFilters.sortBy}
              onChange={(e) => handleInputChange('sortBy', e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={tempFilters.sortOrder}
              onChange={(e) => handleInputChange('sortOrder', e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      )}
    </>
  );
};

export default MovieFilter;