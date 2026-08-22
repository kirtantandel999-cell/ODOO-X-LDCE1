import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthNavigation({ currentYear, currentMonth, onPrevMonth, onNextMonth, onJumpToday }) {
  const monthName = MONTH_NAMES[currentMonth];

  return (
    <div className="gt-month-nav-container">
      <div className="gt-month-nav-controls">
        <button
          type="button"
          className="gt-month-nav-btn prev"
          onClick={onPrevMonth}
          aria-label="Previous month"
          title="Previous month"
        >
          <ChevronLeft size={20} />
        </button>

        <h2 className="gt-month-nav-title">
          {monthName} <span className="gt-month-nav-year">{currentYear}</span>
        </h2>

        <button
          type="button"
          className="gt-month-nav-btn next"
          onClick={onNextMonth}
          aria-label="Next month"
          title="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="gt-month-nav-today-action">
        <button
          type="button"
          className="gt-btn-today"
          onClick={onJumpToday}
          title="Jump to today"
        >
          <CalendarIcon size={14} />
          <span>Today</span>
        </button>
      </div>
    </div>
  );
}
