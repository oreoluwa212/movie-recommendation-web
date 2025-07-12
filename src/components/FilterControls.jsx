// components/FilterControls.js
import { Filter, RotateCcw } from "lucide-react";

const FilterControls = ({
  activeFilterCount,
  hasFilters,
  totalResults,
  onToggleFilters,
  onResetFilters,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleFilters}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>Filter Movies</span>
          {activeFilterCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        {hasFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
      {hasFilters && (
        <div className="text-sm text-gray-400">
          Showing filtered results ({totalResults} movies)
        </div>
      )}
    </div>
  );
};

export default FilterControls;