import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, RotateCcw, Check } from 'lucide-react';

export default function FilterDropdown({ filter, onChange, onReset, filterOptions }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeFilterCount = Object.values(filter).filter(v => v && v !== 'All').length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="gt-filter-wrapper" ref={dropdownRef}>
      <button 
        type="button"
        className={`gt-control-btn ${activeFilterCount > 0 ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Filter posts"
      >
        <Filter size={16} />
        <span>Filter</span>
        {activeFilterCount > 0 && (
          <span className="gt-filter-count-badge">{activeFilterCount}</span>
        )}
        <ChevronDown size={14} className={`chevron-icon ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="gt-filter-modal-card">
          <div className="gt-filter-header">
            <h4 className="gt-filter-title">Filter Posts</h4>
            {activeFilterCount > 0 && (
              <button type="button" className="gt-btn-reset-filters" onClick={onReset}>
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="gt-filter-body">
            {/* Destination */}
            <div className="gt-filter-group">
              <label>Destination</label>
              <select
                value={filter.destination || 'All'}
                onChange={(e) => onChange('destination', e.target.value)}
                className="gt-filter-select"
              >
                {(filterOptions.destinations || ['All']).map(dest => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
              </select>
            </div>

            {/* Trip Type */}
            <div className="gt-filter-group">
              <label>Trip Type</label>
              <select
                value={filter.tripType || 'All'}
                onChange={(e) => onChange('tripType', e.target.value)}
                className="gt-filter-select"
              >
                {(filterOptions.tripTypes || ['All']).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Activity */}
            <div className="gt-filter-group">
              <label>Activity</label>
              <select
                value={filter.activity || 'All'}
                onChange={(e) => onChange('activity', e.target.value)}
                className="gt-filter-select"
              >
                {(filterOptions.activities || ['All']).map(act => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="gt-filter-group">
              <label>Date</label>
              <select
                value={filter.dateRange || 'All'}
                onChange={(e) => onChange('dateRange', e.target.value)}
                className="gt-filter-select"
              >
                {(filterOptions.dateRanges || ['All']).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="gt-filter-footer">
            <button type="button" className="btn-primary full-width" onClick={() => setIsOpen(false)}>
              <Check size={16} />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
