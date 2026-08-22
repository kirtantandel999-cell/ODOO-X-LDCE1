import React from 'react';
import SearchBar from './SearchBar';
import GroupByDropdown from './GroupByDropdown';
import FilterDropdown from './FilterDropdown';
import SortDropdown from './SortDropdown';

export default function CommunityControls({
  search,
  onSearchChange,
  onSearchClear,
  groupBy,
  onGroupByChange,
  filter,
  onFilterChange,
  onFilterReset,
  filterOptions,
  sort,
  onSortChange
}) {
  return (
    <div className="community-controls-bar">
      <div className="community-search-container">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          onClear={onSearchClear}
        />
      </div>

      <div className="community-filters-container">
        <GroupByDropdown
          value={groupBy}
          onChange={onGroupByChange}
        />
        <FilterDropdown
          filter={filter}
          onChange={onFilterChange}
          onReset={onFilterReset}
          filterOptions={filterOptions}
        />
        <SortDropdown
          value={sort}
          onChange={onSortChange}
        />
      </div>
    </div>
  );
}
