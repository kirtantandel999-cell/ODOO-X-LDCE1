import React from 'react';
import { Calendar as CalendarIcon, Plus, MapPin, Users, ArrowRight } from 'lucide-react';

export default function SelectedDatePanel({
  selectedDate,
  trips = [],
  onTripClick,
  onOpenAddModal,
  onNavigate
}) {
  if (!selectedDate) return null;

  const handleAddTrip = () => {
    if (onNavigate) {
      onNavigate('createTrip');
    } else if (onOpenAddModal) {
      onOpenAddModal(selectedDate);
    }
  };

  const formattedDateHeading = (() => {
    try {
      const d = new Date(selectedDate + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return selectedDate;
    }
  })();

  return (
    <div className="gt-selected-date-card">
      <div className="gt-selected-date-header">
        <div className="gt-selected-date-meta">
          <div className="gt-selected-date-icon">
            <CalendarIcon size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="gt-selected-date-title">{formattedDateHeading}</h3>
            <span className="gt-selected-date-sub">
              {trips.length} scheduled event{trips.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="gt-btn-add-date-trip"
          onClick={handleAddTrip}
          title="Add trip on this date"
        >
          <Plus size={16} />
          <span>Add Trip</span>
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="gt-date-empty-state">
          <p className="gt-date-empty-text">No trips or activities scheduled for this date.</p>
          <button
            type="button"
            className="gt-btn-schedule-quick"
            onClick={handleAddTrip}
          >
            <Plus size={15} />
            <span>+ Add Trip</span>
          </button>
        </div>
      ) : (
        <div className="gt-date-trips-list">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="gt-date-trip-item"
              onClick={() => onTripClick(trip)}
              role="button"
              tabIndex={0}
            >
              <div className={`gt-date-trip-color-strip color-${trip.color || 'indigo'}`} />
              <div className="gt-date-trip-content">
                <div className="gt-date-trip-top">
                  <h4 className="gt-date-trip-name">{trip.name}</h4>
                  <span className={`status-tag ${trip.status?.toLowerCase()}`}>{trip.status}</span>
                </div>

                <div className="gt-date-trip-details">
                  <span className="gt-date-trip-meta">
                    <MapPin size={13} /> {trip.destination}
                  </span>
                  <span className="gt-date-trip-meta">
                    <Users size={13} /> {trip.travelersCount || 1} Travelers
                  </span>
                  {trip.budget && (
                    <span className="gt-date-trip-meta budget">
                      {trip.budget}
                    </span>
                  )}
                </div>
              </div>
              <div className="gt-date-trip-arrow">
                <ArrowRight size={16} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
