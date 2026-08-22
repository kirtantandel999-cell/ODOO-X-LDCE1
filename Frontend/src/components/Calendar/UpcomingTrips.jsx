import React from 'react';
import { Calendar, MapPin, ArrowRight, Sparkles } from 'lucide-react';

export default function UpcomingTrips({ trips = [], onTripClick, onOpenAddModal, onNavigate }) {
  const handlePlanTrip = () => {
    if (onNavigate) {
      onNavigate('createTrip');
    } else if (onOpenAddModal) {
      onOpenAddModal();
    }
  };

  // Format date range
  const formatDateRange = (start, end) => {
    try {
      const s = new Date(start + 'T00:00:00');
      const e = new Date(end + 'T00:00:00');
      const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
      const sDay = s.getDate();
      const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
      const eDay = e.getDate();
      const year = e.getFullYear();

      if (sMonth === eMonth) {
        return `${sDay} - ${eDay} ${sMonth} ${year}`;
      }
      return `${sDay} ${sMonth} – ${eDay} ${eMonth} ${year}`;
    } catch {
      return `${start} - ${end}`;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <span className="gt-upcoming-badge completed">Completed</span>;
      case 'planned':
        return <span className="gt-upcoming-badge planned">Planned</span>;
      case 'cancelled':
        return <span className="gt-upcoming-badge cancelled">Cancelled</span>;
      default:
        return <span className="gt-upcoming-badge upcoming">Upcoming</span>;
    }
  };

  // Filter to upcoming / planned trips
  const upcomingList = trips
    .filter((t) => t.status?.toLowerCase() !== 'cancelled')
    .slice(0, 4);

  return (
    <div className="gt-upcoming-section-card">
      <div className="gt-upcoming-header">
        <div className="gt-upcoming-title-wrap">
          <Sparkles size={16} className="text-primary-glow" />
          <h3 className="gt-upcoming-title">Upcoming Trips</h3>
        </div>
        <span className="gt-upcoming-count">{trips.length} Total</span>
      </div>

      {upcomingList.length === 0 ? (
        <div className="gt-upcoming-empty">
          <p className="text-muted-sm">No upcoming adventures scheduled.</p>
          <button type="button" className="btn-secondary sm" onClick={handlePlanTrip}>
            + Plan a Trip
          </button>
        </div>
      ) : (
        <div className="gt-upcoming-grid">
          {upcomingList.map((trip) => (
            <div
              key={trip.id}
              className="gt-upcoming-item-card"
              onClick={() => onTripClick(trip)}
              role="button"
              tabIndex={0}
            >
              <div className="gt-upcoming-item-thumb">
                {trip.coverImage ? (
                  <img src={trip.coverImage} alt={trip.name} />
                ) : (
                  <div className={`thumb-gradient ${trip.color || 'indigo'}`} />
                )}
                {getStatusBadge(trip.status)}
              </div>

              <div className="gt-upcoming-item-body">
                <h4 className="gt-upcoming-item-name">{trip.name}</h4>
                <div className="gt-upcoming-item-dest">
                  <MapPin size={13} />
                  <span>{trip.destination}</span>
                </div>
                <div className="gt-upcoming-item-dates">
                  <Calendar size={13} />
                  <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                </div>
              </div>

              <div className="gt-upcoming-item-arrow">
                <ArrowRight size={16} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
