import React from 'react';
import { Plus } from 'lucide-react';

export default function CalendarHeader({ onOpenAddModal, onNavigate }) {
  const handleClick = () => {
    if (onNavigate) {
      onNavigate('createTrip');
    } else if (onOpenAddModal) {
      onOpenAddModal();
    }
  };

  return (
    <div className="calendar-header-banner">
      <div className="calendar-header-info">
        <span className="eyebrow">Itinerary Schedule</span>
        <h1>Calendar View</h1>
        <p>Set your dates, add the places you're visiting, and we'll suggest what to do there.</p>
      </div>

      <div className="calendar-header-actions">
        <button
          type="button"
          className="gt-btn-plan-trip"
          onClick={handleClick}
          title="Plan a new trip"
        >
          <Plus size={18} />
          <span>Plan a Trip</span>
        </button>
      </div>
    </div>
  );
}
