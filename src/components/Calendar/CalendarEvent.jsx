import React from 'react';
import { MapPin, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function CalendarEvent({ trip, isStart, isEnd, isSpan, isSingle, onClick }) {
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 size={11} className="gt-event-status-icon" />;
      case 'planned':
        return <Clock size={11} className="gt-event-status-icon" />;
      case 'cancelled':
        return <XCircle size={11} className="gt-event-status-icon" />;
      default:
        return <MapPin size={11} className="gt-event-status-icon" />;
    }
  };

  const colorClass = trip.color ? `color-${trip.color}` : 'color-indigo';

  let spanClass = 'single-day';
  if (isSingle) {
    spanClass = 'single-day';
  } else if (isStart && isEnd) {
    spanClass = 'single-day';
  } else if (isStart) {
    spanClass = 'span-start';
  } else if (isEnd) {
    spanClass = 'span-end';
  } else if (isSpan) {
    spanClass = 'span-middle';
  }

  return (
    <div
      className={`gt-calendar-event-pill ${colorClass} ${spanClass}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(trip);
      }}
      title={`${trip.name} (${trip.destination})\n${trip.startDate} to ${trip.endDate}\nStatus: ${trip.status}`}
      role="button"
      tabIndex={0}
    >
      <div className="gt-event-pill-content">
        {(isStart || isSingle) && getStatusIcon(trip.status)}
        <span className="gt-event-pill-title">
          {isStart || isSingle ? trip.name : isEnd ? `ends: ${trip.name}` : '⋯'}
        </span>
      </div>
    </div>
  );
}
