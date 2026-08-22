import React, { useState } from 'react';
import { X } from 'lucide-react';

function getDefaultDates(initialDate) {
  if (initialDate) {
    return { start: initialDate, end: initialDate };
  }
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const start = `${y}-${m}-${d}`;
  return { start, end: start };
}

export default function AddTripModal({ initialDate, onClose, onSaveTrip }) {
  const [formData, setFormData] = useState(() => {
    const dates = getDefaultDates(initialDate);
    return {
      name: '',
      destination: '',
      startDate: dates.start,
      endDate: dates.end,
      status: 'Planned',
      travelersCount: 1,
      activities: '',
      accommodation: '',
      transportation: '',
      budget: '$1,500',
      description: '',
      color: 'indigo'
    };
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Trip Name is required';
    if (!formData.destination.trim()) errs.destination = 'Destination is required';
    if (!formData.startDate) errs.startDate = 'Start date is required';
    if (!formData.endDate) errs.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      errs.endDate = 'End date must be after or equal to start date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const activitiesArray = formData.activities
        ? formData.activities.split(',').map((a) => a.trim()).filter(Boolean)
        : ['Sightseeing'];

      await onSaveTrip({
        ...formData,
        activities: activitiesArray
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save trip' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const colorOptions = [
    { label: 'Indigo', value: 'indigo', hex: '#6366f1' },
    { label: 'Emerald', value: 'emerald', hex: '#10b981' },
    { label: 'Amber', value: 'amber', hex: '#f59e0b' },
    { label: 'Sky', value: 'sky', hex: '#0284c7' },
    { label: 'Purple', value: 'purple', hex: '#a855f7' },
    { label: 'Rose', value: 'rose', hex: '#f43f5e' }
  ];

  return (
    <div className="gt-modal-overlay" onClick={onClose}>
      <div className="gt-add-trip-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gt-modal-header">
          <div className="gt-modal-title-wrap">
            <h3 className="gt-modal-title">Schedule New Trip</h3>
            <p className="gt-modal-subtitle">Add travel itineraries directly to your calendar</p>
          </div>
          <button type="button" className="gt-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {errors.form && (
          <div className="notification error">{errors.form}</div>
        )}

        <form className="gt-modal-form" onSubmit={handleSubmit}>
          {/* Trip Name & Destination */}
          <div className="form-row">
            <div className="form-group">
              <label>Trip Name *</label>
              <input
                type="text"
                placeholder="e.g. Rome Summer Expedition"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Destination *</label>
              <input
                type="text"
                placeholder="e.g. Rome, Italy"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className={errors.destination ? 'input-error' : ''}
              />
              {errors.destination && <span className="error-message">{errors.destination}</span>}
            </div>
          </div>

          {/* Dates */}
          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={errors.startDate ? 'input-error' : ''}
              />
              {errors.startDate && <span className="error-message">{errors.startDate}</span>}
            </div>

            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={errors.endDate ? 'input-error' : ''}
              />
              {errors.endDate && <span className="error-message">{errors.endDate}</span>}
            </div>
          </div>

          {/* Status & Travelers & Budget */}
          <div className="form-row three-col">
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="gt-filter-select"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label>Travelers</label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.travelersCount}
                onChange={(e) => setFormData({ ...formData, travelersCount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Budget</label>
              <input
                type="text"
                placeholder="e.g. $2,400"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>
          </div>

          {/* Activities */}
          <div className="form-group">
            <label>Activities (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. Sightseeing, Colosseum Tour, Food Tasting, Photography"
              value={formData.activities}
              onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
            />
          </div>

          {/* Logistics */}
          <div className="form-row">
            <div className="form-group">
              <label>Accommodation</label>
              <input
                type="text"
                placeholder="e.g. Hotel Artemide, Rome"
                value={formData.accommodation}
                onChange={(e) => setFormData({ ...formData, accommodation: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Transportation</label>
              <input
                type="text"
                placeholder="e.g. Flight + Local Metro Pass"
                value={formData.transportation}
                onChange={(e) => setFormData({ ...formData, transportation: e.target.value })}
              />
            </div>
          </div>

          {/* Color theme */}
          <div className="form-group">
            <label>Badge Color Theme</label>
            <div className="gt-color-picker-row">
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`gt-color-choice ${formData.color === c.value ? 'selected' : ''}`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => setFormData({ ...formData, color: c.value })}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Trip Description / Notes</label>
            <textarea
              placeholder="Add personal notes, packing checklist, flight reference numbers..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="gt-modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <div className="spinner"></div> : 'Add Trip to Calendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
