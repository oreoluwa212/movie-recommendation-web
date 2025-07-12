// components/FilteredResults.js
import { Filter } from "lucide-react";
import MovieSection from "./MovieSection";
import ErrorMessage from "./ErrorMessage";
import { MovieSectionSkeleton } from "./loaders/SkeletonLoaders";

const FilteredResults = ({
  isLoading,
  error,
  movies,
  pagination,
  onPageChange,
  onRetry,
  onResetFilters,
}) => {
  if (isLoading) {
    return (
      <MovieSectionSkeleton
        cardSize="medium"
        cardCount={12}
        showViewAll={false}
        showScrollButtons={false}
      />
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Filter className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No movies found</h3>
          <p>Try adjusting your filters to see more results.</p>
        </div>
        <button
          onClick={onResetFilters}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <MovieSection
      title="Filtered Results"
      movies={movies}
      loading={false}
      error={null}
      showViewAll={false}
      cardSize="medium"
      showPagination={pagination.totalPages > 1}
      pagination={pagination}
      onPageChange={onPageChange}
    />
  );
};

export default FilteredResults;