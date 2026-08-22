import React from 'react';
import { Plus, Compass } from 'lucide-react';

export default function CalendarEmptyState({ onOpenAddModal, onNavigate, isFiltered = false, onResetFilters }) {
  const handlePlanTrip = () => {
    if (onNavigate) {
      onNavigate('createTrip');
    } else if (onOpenAddModal) {
      onOpenAddModal();
    }
  };

  return (
    <div className="gt-calendar-empty-card">
      <div className="gt-empty-icon-wrap">
        <Compass size={40} className="text-primary-glow" />
      </div>
      <h3 className="gt-empty-title">
        {isFiltered ? 'No matching trips found' : 'No trips planned yet.'}
      </h3>
      <p className="gt-empty-subtitle">
        {isFiltered
          ? 'Try adjusting your search query, filter criteria, or group by settings.'
          : 'Start planning your next adventure! Schedule flights, stays, and activities.'}
      </p>

      <div className="gt-empty-actions">
        {isFiltered && onResetFilters ? (
          <button type="button" className="btn-secondary" onClick={onResetFilters}>
            Reset Filters
          </button>
        ) : null}
        <button type="button" className="btn-primary" onClick={handlePlanTrip}>
          <Plus size={18} />
          <span>Plan a Trip</span>
        </button>
      </div>
    </div>
  );
}
