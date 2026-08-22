import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Layers, Filter, ArrowUpDown, ChevronDown, RotateCcw, Check } from 'lucide-react';

export default function CalendarControls({
  search,
  onSearchChange,
  onSearchClear,
  groupBy,
  onGroupByChange,
  filter,
  onFilterChange,
  onFilterReset,
  filterOptions = {},
  sort,
  onSortChange
}) {
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [groupByOpen, setGroupByOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const filterRef = useRef(null);
  const groupByRef = useRef(null);
  const sortRef = useRef(null);

  // Group By options
  const groupByOptions = [
    { label: 'None', value: 'none' },
    { label: 'Destination', value: 'Destination' },
    { label: 'Trip Type', value: 'Trip Type' },
    { label: 'Activity', value: 'Activity' },
    { label: 'Month', value: 'Month' },
    { label: 'User', value: 'User' }
  ];

  // Sort By options
  const sortOptions = [
    'Date',
    'Trip Name',
    'Destination',
    'Latest Added'
  ];

  const activeFilterCount = Object.entries(filter).filter(
    ([, v]) => v && v !== 'All'
  ).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterModalOpen(false);
      }
      if (groupByRef.current && !groupByRef.current.contains(event.target)) {
        setGroupByOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="gt-calendar-controls-bar">
      {/* Search Bar */}
      <div className="gt-search-wrapper">
        <Search size={18} className="gt-search-icon" />
        <input
          type="text"
          className="gt-search-input"
          placeholder="Search trips..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button
            type="button"
            className="gt-search-clear-btn"
            onClick={onSearchClear}
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Action Controls: Group By, Filter, Sort By - Unified Button & Popover Style */}
      <div className="gt-calendar-controls-actions">
        {/* 1. Group By Popover */}
        <div className="gt-control-popover-wrapper" ref={groupByRef}>
          <button
            type="button"
            className={`gt-control-btn ${groupBy !== 'none' ? 'active' : ''}`}
            onClick={() => {
              setGroupByOpen(!groupByOpen);
              setFilterModalOpen(false);
              setSortOpen(false);
            }}
            title="Group trips"
          >
            <Layers size={16} />
            <span>Group: {groupBy === 'none' ? 'None' : groupBy}</span>
            <ChevronDown size={14} className={`chevron-icon ${groupByOpen ? 'open' : ''}`} />
          </button>

          {groupByOpen && (
            <div className="gt-control-menu-popover">
              <div className="gt-popover-header">
                <h4>Group By</h4>
              </div>
              <div className="gt-popover-list">
                {groupByOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`gt-popover-item ${groupBy === opt.value ? 'selected' : ''}`}
                    onClick={() => {
                      onGroupByChange(opt.value);
                      setGroupByOpen(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {groupBy === opt.value && <Check size={15} className="gt-item-check" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Filter Popover */}
        <div className="gt-control-popover-wrapper" ref={filterRef}>
          <button
            type="button"
            className={`gt-control-btn ${activeFilterCount > 0 ? 'active' : ''}`}
            onClick={() => {
              setFilterModalOpen(!filterModalOpen);
              setGroupByOpen(false);
              setSortOpen(false);
            }}
            title="Filter trips"
          >
            <Filter size={16} />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="gt-filter-count-badge">{activeFilterCount}</span>
            )}
            <ChevronDown size={14} className={`chevron-icon ${filterModalOpen ? 'open' : ''}`} />
          </button>

          {filterModalOpen && (
            <div className="gt-filter-modal-card">
              <div className="gt-filter-header">
                <h4 className="gt-filter-title">Filter Trips</h4>
                {activeFilterCount > 0 && (
                  <button type="button" className="gt-btn-reset-filters" onClick={onFilterReset}>
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              <div className="gt-filter-body">
                {/* Status Filter */}
                <div className="gt-filter-group">
                  <label>Status</label>
                  <select
                    value={filter.status || 'All'}
                    onChange={(e) => onFilterChange('status', e.target.value)}
                    className="gt-filter-select"
                  >
                    {(filterOptions.statuses || ['All', 'Upcoming', 'Planned', 'Completed', 'Cancelled']).map(
                      (st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Destination Filter */}
                <div className="gt-filter-group">
                  <label>Destination</label>
                  <select
                    value={filter.destination || 'All'}
                    onChange={(e) => onFilterChange('destination', e.target.value)}
                    className="gt-filter-select"
                  >
                    {(filterOptions.destinations || ['All']).map((dest) => (
                      <option key={dest} value={dest}>
                        {dest}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Activity Filter */}
                <div className="gt-filter-group">
                  <label>Activity</label>
                  <select
                    value={filter.activity || 'All'}
                    onChange={(e) => onFilterChange('activity', e.target.value)}
                    className="gt-filter-select"
                  >
                    {(filterOptions.activities || ['All']).map((act) => (
                      <option key={act} value={act}>
                        {act}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="gt-filter-footer">
                <button
                  type="button"
                  className="btn-primary full-width"
                  onClick={() => setFilterModalOpen(false)}
                >
                  <Check size={16} />
                  <span>Apply Filters</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Sort By Popover */}
        <div className="gt-control-popover-wrapper" ref={sortRef}>
          <button
            type="button"
            className={`gt-control-btn ${sort !== 'Date' ? 'active' : ''}`}
            onClick={() => {
              setSortOpen(!sortOpen);
              setFilterModalOpen(false);
              setGroupByOpen(false);
            }}
            title="Sort trips"
          >
            <ArrowUpDown size={16} />
            <span>Sort: {sort}</span>
            <ChevronDown size={14} className={`chevron-icon ${sortOpen ? 'open' : ''}`} />
          </button>

          {sortOpen && (
            <div className="gt-control-menu-popover">
              <div className="gt-popover-header">
                <h4>Sort By</h4>
              </div>
              <div className="gt-popover-list">
                {sortOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`gt-popover-item ${sort === opt ? 'selected' : ''}`}
                    onClick={() => {
                      onSortChange(opt);
                      setSortOpen(false);
                    }}
                  >
                    <span>{opt}</span>
                    {sort === opt && <Check size={15} className="gt-item-check" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
