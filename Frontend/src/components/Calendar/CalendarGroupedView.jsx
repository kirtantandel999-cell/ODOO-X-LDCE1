import React from 'react';
import { MapPin, Calendar, Layers } from 'lucide-react';

export default function CalendarGroupedView({ groupBy, groups = {}, onTripClick, onOpenAddModal, onNavigate }) {
  const groupKeys = Object.keys(groups);

  const handlePlanTrip = () => {
    if (onNavigate) {
      onNavigate('createTrip');
    } else if (onOpenAddModal) {
      onOpenAddModal();
    }
  };

  if (groupKeys.length === 0) {
    return (
      <div className="gt-grouped-empty-card">
        <Layers size={32} className="text-muted" />
        <p className="gt-empty-text">No trips found for this grouping.</p>
        <button type="button" className="btn-secondary sm" onClick={handlePlanTrip}>
          + Plan a Trip
        </button>
      </div>
    );
  }

  const formatDateDisplay = (dateStr) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="gt-grouped-layout">
      {/* 1. Main Header Row */}
      <div className="gt-grouped-main-header">
        <div className="gt-grouped-header-left">
          <span className="gt-grouped-label">Grouped by:</span>
          <span className="gt-grouped-value">{groupBy}</span>
        </div>
        <span className="gt-grouped-badge">
          {groupKeys.length} Group{groupKeys.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* 2. Group Sections List */}
      <div className="gt-grouped-sections-list">
        {groupKeys.map((groupTitle) => {
          const groupTrips = groups[groupTitle] || [];

          return (
            <div key={groupTitle} className="gt-group-block">
              {/* Group Section Header */}
              <div className="gt-group-block-header">
                <h3 className="gt-group-heading">{groupTitle}</h3>
                <span className="gt-group-subcount">
                  {groupTrips.length} Trip{groupTrips.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Trip Cards Grid directly below */}
              <div className="gt-group-cards-grid">
                {groupTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="gt-grouped-card"
                    onClick={() => onTripClick(trip)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="gt-grouped-card-thumb">
                      {trip.coverImage ? (
                        <img src={trip.coverImage} alt={trip.name} />
                      ) : (
                        <div className={`thumb-gradient ${trip.color || 'indigo'}`} />
                      )}
                      <span className={`status-pill ${trip.status?.toLowerCase()}`}>
                        {trip.status}
                      </span>
                    </div>

                    <div className="gt-grouped-card-body">
                      <h4 className="gt-grouped-card-title">{trip.name}</h4>
                      
                      <div className="gt-grouped-card-row">
                        <MapPin size={13} className="gt-meta-icon" />
                        <span>{trip.destination}</span>
                      </div>

                      <div className="gt-grouped-card-row">
                        <Calendar size={13} className="gt-meta-icon" />
                        <span>
                          {formatDateDisplay(trip.startDate)} – {formatDateDisplay(trip.endDate)}
                        </span>
                      </div>

                      {trip.budget && (
                        <div className="gt-grouped-card-budget">
                          <span>{trip.budget}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
