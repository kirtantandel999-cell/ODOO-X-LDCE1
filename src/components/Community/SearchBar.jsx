import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, onClear }) {
  return (
    <div className="gt-search-wrapper">
      <Search size={18} className="gt-search-icon" />
      <input
        type="text"
        className="gt-search-input"
        placeholder="Search community posts..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button type="button" className="gt-search-clear-btn" onClick={onClear} title="Clear search">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
