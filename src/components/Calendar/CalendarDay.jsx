import React from 'react';
import CalendarEvent from './CalendarEvent';

export default function CalendarDay({
  dayObj,
  isSelected,
  isToday,
  isCurrentMonth,
  trips = [],
  onSelectDate,
  onTripClick
}) {
  const { dateString, dayNumber } = dayObj;

  // Max events to show inside a cell before "+N more"
  const MAX_EVENTS_VISIBLE = 2;
  const visibleTrips = trips.slice(0, MAX_EVENTS_VISIBLE);
  const extraCount = trips.length - MAX_EVENTS_VISIBLE;

  return (
    <div
      className={`gt-calendar-day-cell ${
        isCurrentMonth ? 'in-month' : 'out-month'
      } ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${
        trips.length > 0 ? 'has-trips' : ''
      }`}
      onClick={() => onSelectDate(dateString, trips)}
      role="button"
      tabIndex={0}
    >
      <div className="gt-day-header">
        <span className={`gt-day-number ${isToday ? 'today-pill' : ''}`}>
          {dayNumber}
        </span>
        {trips.length > 0 && (
          <span className="gt-day-trip-dot" title={`${trips.length} event(s)`} />
        )}
      </div>

      <div className="gt-day-events-list">
        {visibleTrips.map((trip) => {
          const isStart = trip.startDate === dateString;
          const isEnd = trip.endDate === dateString;
          const isSingle = trip.startDate === trip.endDate;
          const isSpan = !isStart && !isEnd;

          return (
            <CalendarEvent
              key={`${trip.id}-${dateString}`}
              trip={trip}
              isStart={isStart}
              isEnd={isEnd}
              isSpan={isSpan}
              isSingle={isSingle}
              onClick={onTripClick}
            />
          );
        })}

        {extraCount > 0 && (
          <div className="gt-day-more-badge">
            +{extraCount} more
          </div>
        )}
      </div>
    </div>
  );
}
