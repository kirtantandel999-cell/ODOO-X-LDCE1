import React, { useState, useEffect, useCallback } from 'react';
import { TripService } from '../../services/TripService';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../Navbar/Navbar';
import CalendarHeader from './CalendarHeader';
import CalendarControls from './CalendarControls';
import MonthNavigation from './MonthNavigation';
import CalendarGrid from './CalendarGrid';
import SelectedDatePanel from './SelectedDatePanel';
import UpcomingTrips from './UpcomingTrips';
import CalendarGroupedView from './CalendarGroupedView';
import CalendarSkeleton from './CalendarSkeleton';
import CalendarEmptyState from './CalendarEmptyState';
import TripDetailsModal from './TripDetailsModal';
import AddTripModal from './AddTripModal';
import { AlertCircle, RotateCcw } from 'lucide-react';
import './Calendar.css';

function getTodayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CalendarPage({ onNavigate, currentScreen = 'calendar' }) {
  const { user } = useAuth();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-indexed

  const [trips, setTrips] = useState([]);
  const [isGrouped, setIsGrouped] = useState(false);
  const [groups, setGroups] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, Group By, Filter, Sort state
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [filter, setFilter] = useState({
    status: 'All',
    destination: 'All',
    activity: 'All'
  });
  const [sort, setSort] = useState('Date');
  const [filterOptions, setFilterOptions] = useState({
    statuses: ['All', 'Upcoming', 'Planned', 'Completed', 'Cancelled'],
    destinations: ['All'],
    activities: ['All']
  });

  // Selected date state
  const [selectedDate, setSelectedDate] = useState(() => getTodayString());

  // Modal states
  const [activeTripModal, setActiveTripModal] = useState(null);
  const [addTripModalOpen, setAddTripModalOpen] = useState(false);
  const [addTripInitialDate, setAddTripInitialDate] = useState(null);

  const [refreshCount, setRefreshCount] = useState(0);

  // Load filter options metadata
  useEffect(() => {
    let active = true;
    TripService.getFilterOptions()
      .then((opts) => {
        if (active) setFilterOptions(opts);
      })
      .catch(console.error);
    return () => {
      active = false;
    };
  }, []);

  // Fetch trips
  useEffect(() => {
    let active = true;
    const fetchTripsData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await TripService.getTrips({
          search,
          groupBy,
          filter,
          sort,
          year: currentYear,
          month: currentMonth
        });

        if (!active) return;
        if (response.isGrouped) {
          setIsGrouped(true);
          setGroups(response.groups || {});
          setTrips(response.trips || []);
        } else {
          setIsGrouped(false);
          setGroups({});
          setTrips(response.posts || response.trips || []);
        }
      } catch (err) {
        if (!active) return;
        console.error('Error fetching trips:', err);
        setError('Unable to load your trips. Please try again.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchTripsData();
    return () => {
      active = false;
    };
  }, [search, groupBy, filter, sort, currentYear, currentMonth, refreshCount]);

  const reloadTrips = useCallback(() => {
    setRefreshCount((c) => c + 1);
  }, []);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleJumpToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(getTodayString());
  };

  // Filter change handlers
  const handleFilterChange = (key, val) => {
    setFilter((prev) => ({ ...prev, [key]: val }));
  };

  const handleFilterReset = () => {
    setFilter({ status: 'All', destination: 'All', activity: 'All' });
  };

  // Date selection handler
  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr);
  };

  // Open add trip modal
  const handleOpenAddModal = (dateStr = null) => {
    setAddTripInitialDate(dateStr || selectedDate || getTodayString());
    setAddTripModalOpen(true);
  };

  // Create new trip
  const handleSaveTrip = async (tripData) => {
    await TripService.createTrip(tripData, user);
    reloadTrips();
  };

  // Delete trip
  const handleDeleteTrip = async (tripId) => {
    await TripService.deleteTrip(tripId);
    reloadTrips();
  };

  // Trips scheduled on selected date
  const selectedDateTrips = trips.filter((t) => {
    if (!t.startDate || !t.endDate || !selectedDate) return false;
    return selectedDate >= t.startDate && selectedDate <= t.endDate;
  });

  const isFilteringActive =
    Boolean(search.trim()) ||
    filter.status !== 'All' ||
    filter.destination !== 'All' ||
    filter.activity !== 'All';

  return (
    <div className="gt-app-layout">
      {/* GlobeTrotter Navbar */}
      <Navbar
        onNavigate={onNavigate}
        currentScreen={currentScreen}
        onCreatePostClick={() => handleOpenAddModal()}
      />

      <main className="gt-page-container">
        {/* Screen 11 Header */}
        <CalendarHeader
          onOpenAddModal={() => handleOpenAddModal()}
          onNavigate={onNavigate}
        />

        {/* Search and Controls Bar */}
        <CalendarControls
          search={search}
          onSearchChange={setSearch}
          onSearchClear={() => setSearch('')}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          filter={filter}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          filterOptions={filterOptions}
          sort={sort}
          onSortChange={setSort}
        />

        {/* Error State */}
        {error && (
          <div className="gt-error-banner">
            <div className="gt-error-content">
              <AlertCircle size={20} className="text-error" />
              <div>
                <h4 className="gt-error-title">Unable to load your trips</h4>
                <p className="gt-error-desc">{error}</p>
              </div>
            </div>
            <button type="button" className="btn-secondary sm" onClick={reloadTrips}>
              <RotateCcw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && <CalendarSkeleton />}

        {/* Main Content when not loading and no error */}
        {!isLoading && !error && (
          <>
            {isGrouped ? (
              <CalendarGroupedView
                groupBy={groupBy}
                groups={groups}
                onTripClick={(trip) => setActiveTripModal(trip)}
                onOpenAddModal={() => handleOpenAddModal()}
                onNavigate={onNavigate}
              />
            ) : trips.length === 0 && isFilteringActive ? (
              <CalendarEmptyState
                isFiltered
                onResetFilters={() => {
                  setSearch('');
                  handleFilterReset();
                }}
                onOpenAddModal={() => handleOpenAddModal()}
                onNavigate={onNavigate}
              />
            ) : (
              <div className="gt-calendar-main-view">
                {/* Month Navigation */}
                <MonthNavigation
                  currentYear={currentYear}
                  currentMonth={currentMonth}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  onJumpToday={handleJumpToday}
                />

                {/* Calendar Grid */}
                <CalendarGrid
                  currentYear={currentYear}
                  currentMonth={currentMonth}
                  trips={trips}
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                  onTripClick={(trip) => setActiveTripModal(trip)}
                />

                {/* Selected Date Details Panel */}
                <SelectedDatePanel
                  selectedDate={selectedDate}
                  trips={selectedDateTrips}
                  onTripClick={(trip) => setActiveTripModal(trip)}
                  onOpenAddModal={handleOpenAddModal}
                  onNavigate={onNavigate}
                />

                {/* Upcoming Trips Section */}
                <UpcomingTrips
                  trips={trips}
                  onTripClick={(trip) => setActiveTripModal(trip)}
                  onOpenAddModal={() => handleOpenAddModal()}
                  onNavigate={onNavigate}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Trip Details Modal */}
      {activeTripModal && (
        <TripDetailsModal
          trip={activeTripModal}
          onClose={() => setActiveTripModal(null)}
          onDeleteTrip={handleDeleteTrip}
        />
      )}

      {/* Add / Schedule Trip Modal */}
      {addTripModalOpen && (
        <AddTripModal
          initialDate={addTripInitialDate}
          onClose={() => setAddTripModalOpen(false)}
          onSaveTrip={handleSaveTrip}
        />
      )}
    </div>
  );
}
