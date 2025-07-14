// components/MovieControls.jsx
import React from "react";
import { Filter, Grid, List } from "lucide-react";
import Button from "./ui/Button";

const MovieControls = ({
  sortBy,
  setSortBy,
  filterBy,
  setFilterBy,
  viewMode,
  setViewMode,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="dateAdded">Date Added</option>
            <option value="title">Title</option>
            <option value="year">Year</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Filter:</span>
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="movie">Movies</option>
            <option value="tv">TV Shows</option>
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant={viewMode === "grid" ? "primary" : "ghost"}
          size="small"
          onClick={() => setViewMode("grid")}
          title="Grid View"
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "primary" : "ghost"}
          size="small"
          onClick={() => setViewMode("list")}
          title="List View"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MovieControls;