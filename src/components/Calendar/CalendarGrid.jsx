import React, { useMemo } from 'react';
import CalendarDay from './CalendarDay';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function formatDayString(year, month, day) {
  const y = year;
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CalendarGrid({
  currentYear,
  currentMonth,
  trips = [],
  selectedDate,
  onSelectDate,
  onTripClick
}) {
  const today = useMemo(() => {
    const d = new Date();
    return formatDayString(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  // Compute the grid days (prev month filler, current month, next month filler)
  const daysGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateString = formatDayString(prevYear, prevMonth, dayNum);

      days.push({
        dayNumber: dayNum,
        dateString,
        isCurrentMonth: false,
        date: new Date(prevYear, prevMonth, dayNum)
      });
    }

    // 2. Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const dateString = formatDayString(currentYear, currentMonth, i);
      days.push({
        dayNumber: i,
        dateString,
        isCurrentMonth: true,
        date: new Date(currentYear, currentMonth, i)
      });
    }

    // 3. Next month leading days to complete grid (total cells multiple of 7, usually 35 or 42)
    const remainingCells = (7 - (days.length % 7)) % 7;
    // ensure at least 35 days, or 42 if needed
    const totalCellsNeeded = days.length + remainingCells < 35 ? 35 - days.length : remainingCells;

    for (let i = 1; i <= totalCellsNeeded; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateString = formatDayString(nextYear, nextMonth, i);

      days.push({
        dayNumber: i,
        dateString,
        isCurrentMonth: false,
        date: new Date(nextYear, nextMonth, i)
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Map trips to dates
  const tripsByDate = useMemo(() => {
    const map = {};

    trips.forEach((trip) => {
      if (!trip.startDate || !trip.endDate) return;
      const start = trip.startDate;
      const end = trip.endDate;

      daysGrid.forEach((day) => {
        if (day.dateString >= start && day.dateString <= end) {
          if (!map[day.dateString]) {
            map[day.dateString] = [];
          }
          map[day.dateString].push(trip);
        }
      });
    });

    return map;
  }, [trips, daysGrid]);

  return (
    <div className="gt-calendar-grid-card">
      {/* Weekday Headers */}
      <div className="gt-calendar-weekdays-row">
        {WEEKDAYS.map((day) => (
          <div key={day} className="gt-weekday-col">
            <span className="gt-weekday-text">{day}</span>
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="gt-calendar-days-grid">
        {daysGrid.map((dayObj) => {
          const isToday = dayObj.dateString === today;
          const isSelected = dayObj.dateString === selectedDate;
          const dayTrips = tripsByDate[dayObj.dateString] || [];

          return (
            <CalendarDay
              key={dayObj.dateString}
              dayObj={dayObj}
              isToday={isToday}
              isSelected={isSelected}
              isCurrentMonth={dayObj.isCurrentMonth}
              trips={dayTrips}
              onSelectDate={onSelectDate}
              onTripClick={onTripClick}
            />
          );
        })}
      </div>
    </div>
  );
}
