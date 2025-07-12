// components/ui/SearchBar.js
import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ 
  value, 
  onChange, 
  onSubmit, 
  onClear, 
  placeholder = "Search...",
  className = "" 
}) => {
  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="pl-10 pr-10 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none w-full transition-all duration-200"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchBar;