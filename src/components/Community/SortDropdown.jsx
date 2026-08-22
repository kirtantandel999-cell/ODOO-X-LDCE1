import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export default function SortDropdown({ value, onChange }) {
  const sortOptions = [
    'Latest',
    'Most Liked',
    'Most Commented',
    'Most Viewed',
    'Oldest'
  ];

  return (
    <div className="gt-control-select-wrapper">
      <ArrowUpDown size={16} className="gt-control-icon" />
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="gt-control-select"
        title="Sort community feed"
      >
        {sortOptions.map(opt => (
          <option key={opt} value={opt}>
            Sort: {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
