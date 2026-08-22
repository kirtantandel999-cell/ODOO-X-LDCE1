import React from 'react';
import {
  X,
  MapPin,
  Calendar,
  Users,
  Tag,
  Home,
  Plane,
  DollarSign,
  FileText,
  Trash2
} from 'lucide-react';

export default function TripDetailsModal({ trip, onClose, onDeleteTrip }) {
  if (!trip) return null;

  // Calculate duration in days
  const calculateDays = (start, end) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = Math.abs(e - s);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
    } catch {
      return '';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'gt-status-completed';
      case 'planned':
        return 'gt-status-planned';
      case 'cancelled':
        return 'gt-status-cancelled';
      default:
        return 'gt-status-upcoming';
    }
  };

  const formatDateDisplay = (dateStr) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="gt-modal-overlay" onClick={onClose}>
      <div className="gt-trip-details-modal" onClick={(e) => e.stopPropagation()}>
        {/* Cover Image / Header Banner */}
        <div className="gt-trip-modal-banner">
          {trip.coverImage ? (
            <img src={trip.coverImage} alt={trip.name} className="gt-trip-modal-img" />
          ) : (
            <div className="gt-trip-modal-gradient-fallback" />
          )}
          <button
            type="button"
            className="gt-modal-close-btn"
            onClick={onClose}
            aria-label="Close details"
          >
            <X size={20} />
          </button>
          <div className="gt-trip-banner-overlay">
            <span className={`gt-trip-status-badge ${getStatusBadgeClass(trip.status)}`}>
              {trip.status || 'Upcoming'}
            </span>
            <h2 className="gt-trip-banner-title">{trip.name}</h2>
            <div className="gt-trip-banner-dest">
              <MapPin size={15} />
              <span>{trip.destination}</span>
            </div>
          </div>
        </div>

        {/* Modal Body Info Grid */}
        <div className="gt-trip-modal-body">
          {/* Key Quick Stats */}
          <div className="gt-trip-stats-grid">
            <div className="gt-trip-stat-card">
              <div className="gt-stat-icon-wrapper">
                <Calendar size={16} />
              </div>
              <div className="gt-stat-meta">
                <span className="gt-stat-label">Dates & Duration</span>
                <span className="gt-stat-val">
                  {formatDateDisplay(trip.startDate)} - {formatDateDisplay(trip.endDate)}
                </span>
                <span className="gt-stat-subval">{calculateDays(trip.startDate, trip.endDate)}</span>
              </div>
            </div>

            <div className="gt-trip-stat-card">
              <div className="gt-stat-icon-wrapper">
                <Users size={16} />
              </div>
              <div className="gt-stat-meta">
                <span className="gt-stat-label">Travelers</span>
                <span className="gt-stat-val">{trip.travelersCount || 1} Person{trip.travelersCount > 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="gt-trip-stat-card">
              <div className="gt-stat-icon-wrapper">
                <DollarSign size={16} />
              </div>
              <div className="gt-stat-meta">
                <span className="gt-stat-label">Estimated Budget</span>
                <span className="gt-stat-val">{trip.budget || '$1,500'}</span>
              </div>
            </div>
          </div>

          {/* Details Sections */}
          <div className="gt-trip-info-sections">
            {/* Activities */}
            {trip.activities && trip.activities.length > 0 && (
              <div className="gt-trip-section">
                <div className="gt-section-title">
                  <Tag size={15} />
                  <span>Activities & Highlights</span>
                </div>
                <div className="gt-activities-tag-list">
                  {trip.activities.map((act, idx) => (
                    <span key={idx} className="gt-activity-tag">
                      {act}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Logistics: Accommodation & Transportation */}
            <div className="gt-logistics-grid">
              <div className="gt-trip-section">
                <div className="gt-section-title">
                  <Home size={15} />
                  <span>Accommodation</span>
                </div>
                <p className="gt-section-text">{trip.accommodation || 'Not specified'}</p>
              </div>

              <div className="gt-trip-section">
                <div className="gt-section-title">
                  <Plane size={15} />
                  <span>Transportation</span>
                </div>
                <p className="gt-section-text">{trip.transportation || 'Not specified'}</p>
              </div>
            </div>

            {/* Description / Itinerary Notes */}
            {trip.description && (
              <div className="gt-trip-section">
                <div className="gt-section-title">
                  <FileText size={15} />
                  <span>Itinerary Notes & Overview</span>
                </div>
                <p className="gt-section-text description">{trip.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="gt-trip-modal-footer">
          {onDeleteTrip && (
            <button
              type="button"
              className="gt-btn-delete-trip"
              onClick={() => {
                if (window.confirm(`Are you sure you want to remove "${trip.name}" from your calendar?`)) {
                  onDeleteTrip(trip.id);
                  onClose();
                }
              }}
              title="Delete Trip"
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          )}

          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
