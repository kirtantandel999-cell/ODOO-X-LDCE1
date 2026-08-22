import React from 'react';

export default function CalendarSkeleton() {
  return (
    <div className="gt-calendar-skeleton-wrapper">
      {/* Month nav skeleton */}
      <div className="gt-skeleton-nav">
        <div className="gt-skeleton-btn" />
        <div className="gt-skeleton-title" />
        <div className="gt-skeleton-btn" />
      </div>

      {/* Grid skeleton */}
      <div className="gt-skeleton-grid-card">
        <div className="gt-skeleton-weekdays">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="gt-skeleton-weekday-cell" />
          ))}
        </div>
        <div className="gt-skeleton-days">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="gt-skeleton-day-cell">
              <div className="gt-skeleton-num" />
              {i % 4 === 0 && <div className="gt-skeleton-event-bar" />}
              {i % 7 === 2 && <div className="gt-skeleton-event-bar short" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
