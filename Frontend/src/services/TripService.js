const TRIPS_STORAGE_KEY = 'globetrotter_user_trips';

// Helper to format date YYYY-MM-DD
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth(); // 0-indexed

// Generate sample initial trips relative to current date & reference dates
const INITIAL_TRIPS = [
  // 1. Current month trips
  {
    id: 'trip-1',
    name: 'Paris & Louvre Discovery',
    destination: 'Paris, France',
    startDate: formatDate(new Date(currentYear, currentMonth, 5)),
    endDate: formatDate(new Date(currentYear, currentMonth, 8)),
    status: 'Upcoming',
    travelersCount: 2,
    activities: ['Sightseeing', 'Museums', 'Culinary Tour', 'Photography'],
    accommodation: 'Hotel Le Marais Boutique, 4th Arr.',
    transportation: 'Eurostar & Metro Pass',
    budget: '$2,850',
    description: 'A 4-day romantic getaway exploring historic art galleries, the Louvre, Montmartre cafés, and evening Seine cruises.',
    color: 'indigo',
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'trip-2',
    name: 'NYC Urban Getaway',
    destination: 'New York City, USA',
    startDate: formatDate(new Date(currentYear, currentMonth, 14)),
    endDate: formatDate(new Date(currentYear, currentMonth, 16)),
    status: 'Upcoming',
    travelersCount: 3,
    activities: ['Broadway Show', 'Skyline Tour', 'Food Tour', 'Shopping'],
    accommodation: 'Arlo Midtown Hotel, Manhattan',
    transportation: 'Subway & Yellow Cabs',
    budget: '$1,950',
    description: 'High-energy weekend trip featuring Times Square lights, Broadway theater, Central Park walk, and rooftop dining.',
    color: 'emerald',
    coverImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: 'trip-3',
    name: 'Japan Cultural Adventure',
    destination: 'Tokyo & Kyoto, Japan',
    startDate: formatDate(new Date(currentYear, currentMonth, 18)),
    endDate: formatDate(new Date(currentYear, currentMonth, 25)),
    status: 'Planned',
    travelersCount: 4,
    activities: ['Temple Visits', 'Bullet Train', 'Hiking', 'Anime & Tech Tour', 'Tea Ceremony'],
    accommodation: 'Traditional Ryokan Kyoto & Shibuya Excel Hotel',
    transportation: 'JR 7-Day Rail Pass',
    budget: '$4,600',
    description: 'An immersive 8-day journey across ancient Shinto shrines in Kyoto, bamboo groves in Arashiyama, and neon nightlife in Tokyo.',
    color: 'amber',
    coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'trip-4',
    name: 'Swiss Alps & Matterhorn Explorer',
    destination: 'Zermatt, Switzerland',
    startDate: formatDate(new Date(currentYear, currentMonth, 28)),
    endDate: formatDate(new Date(currentYear, currentMonth + 1, 3)),
    status: 'Planned',
    travelersCount: 2,
    activities: ['Glacier Express', 'Skiing', 'Alpine Hiking', 'Fondue Tasting'],
    accommodation: 'Alpine Grand Hotel & Spa',
    transportation: 'Swiss Travel Pass & Cable Cars',
    budget: '$3,800',
    description: 'Panoramic railway crossing high alpine gorges, scenic Matterhorn viewing points, and charming wooden chalets.',
    color: 'sky',
    coverImage: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1200&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
  },

  // 2. Reference 2024 Mock Trips (from user instructions)
  {
    id: 'trip-5',
    name: 'Paris Trip',
    destination: 'Paris, France',
    startDate: '2024-01-05',
    endDate: '2024-01-07',
    status: 'Completed',
    travelersCount: 2,
    activities: ['Sightseeing', 'Café Hopping', 'Art Museum'],
    accommodation: 'Boutique Hotel Saint-Germain',
    transportation: 'Metro & Walking',
    budget: '$1,800',
    description: 'Winter weekend in Paris visiting the Eiffel Tower and Musée d’Orsay.',
    color: 'indigo',
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&auto=format&fit=crop&q=80',
    createdAt: '2024-01-01T10:00:00.000Z'
  },
  {
    id: 'trip-6',
    name: 'NYC Getaway',
    destination: 'New York City, USA',
    startDate: '2024-01-14',
    endDate: '2024-01-15',
    status: 'Completed',
    travelersCount: 1,
    activities: ['Broadway Show', 'Photography', 'Central Park'],
    accommodation: 'CitizenM Times Square',
    transportation: 'Subway',
    budget: '$950',
    description: 'Solo weekend in Manhattan capturing street photography and attending musical theater.',
    color: 'emerald',
    coverImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&auto=format&fit=crop&q=80',
    createdAt: '2024-01-10T12:00:00.000Z'
  },
  {
    id: 'trip-7',
    name: 'Japan Adventure',
    destination: 'Tokyo, Japan',
    startDate: '2024-01-16',
    endDate: '2024-01-22',
    status: 'Completed',
    travelersCount: 2,
    activities: ['Temple Visits', 'Food Tour', 'Mount Fuji Day Trip'],
    accommodation: 'Shinjuku Prince Hotel',
    transportation: 'Tokyo Metro & Shinkansen',
    budget: '$3,500',
    description: 'Week-long immersion in Japanese food culture, historic temples, and scenic Mount Fuji.',
    color: 'amber',
    coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80',
    createdAt: '2024-01-12T08:00:00.000Z'
  },

  // 3. Past month trip
  {
    id: 'trip-8',
    name: 'Bali Tropical Retreat',
    destination: 'Ubud & Seminyak, Bali, Indonesia',
    startDate: formatDate(new Date(currentYear, currentMonth - 1, 10)),
    endDate: formatDate(new Date(currentYear, currentMonth - 1, 17)),
    status: 'Completed',
    travelersCount: 2,
    activities: ['Yoga Retreat', 'Surfing', 'Waterfalls', 'Scuba Diving'],
    accommodation: 'Eco Jungle Villa Ubud',
    transportation: 'Private Driver & Scooter',
    budget: '$2,200',
    description: 'Relaxing yoga and wellness retreat surrounded by rice terraces, sacred springs, and sunset beaches.',
    color: 'purple',
    coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString()
  },

  // 4. Next month trip
  {
    id: 'trip-9',
    name: 'Iceland Northern Lights Expedition',
    destination: 'Reykjavik & Vik, Iceland',
    startDate: formatDate(new Date(currentYear, currentMonth + 1, 12)),
    endDate: formatDate(new Date(currentYear, currentMonth + 1, 19)),
    status: 'Planned',
    travelersCount: 4,
    activities: ['Aurora Hunting', 'Glacier Hike', 'Geothermal Spas', 'Road Trip'],
    accommodation: 'Icelandic Glass Igloo & Ring Road Cabins',
    transportation: '4x4 AWD Camper Van',
    budget: '$4,200',
    description: 'Golden Circle road trip, Blue Lagoon thermal baths, and chasing the Aurora Borealis under dark arctic skies.',
    color: 'rose',
    coverImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

function getStoredTrips() {
  try {
    const raw = localStorage.getItem(TRIPS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(INITIAL_TRIPS));
      return INITIAL_TRIPS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(INITIAL_TRIPS));
      return INITIAL_TRIPS;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading stored trips:', err);
    return INITIAL_TRIPS;
  }
}

function saveStoredTrips(trips) {
  try {
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
  } catch (err) {
    console.error('Error saving trips:', err);
  }
}

export const TripService = {
  // GET /api/trips
  getTrips: async ({
    search = '',
    groupBy = 'none',
    filter = {},
    sort = 'Date',
    _year,
    _month
  } = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let trips = getStoredTrips();

        // 1. Search (Trip name, Destination, Activity, Date)
        if (search && search.trim()) {
          const q = search.toLowerCase().trim();
          trips = trips.filter((t) => {
            const matchName = t.name?.toLowerCase().includes(q);
            const matchDest = t.destination?.toLowerCase().includes(q);
            const matchDesc = t.description?.toLowerCase().includes(q);
            const matchDates = t.startDate?.includes(q) || t.endDate?.includes(q);
            const matchActivities = t.activities?.some((a) => a.toLowerCase().includes(q));
            return matchName || matchDest || matchDesc || matchDates || matchActivities;
          });
        }

        // 2. Filter (Status: Upcoming, Completed, Planned, Cancelled; Destination; Activity)
        if (filter.status && filter.status !== 'All') {
          trips = trips.filter((t) => t.status?.toLowerCase() === filter.status.toLowerCase());
        }
        if (filter.destination && filter.destination !== 'All') {
          trips = trips.filter((t) =>
            t.destination?.toLowerCase().includes(filter.destination.toLowerCase())
          );
        }
        if (filter.activity && filter.activity !== 'All') {
          trips = trips.filter((t) =>
            t.activities?.some((a) => a.toLowerCase() === filter.activity.toLowerCase())
          );
        }

        // 3. Sort (Date, Trip Name, Destination, Latest Added)
        trips.sort((a, b) => {
          if (sort === 'Trip Name') {
            return a.name.localeCompare(b.name);
          }
          if (sort === 'Destination') {
            return a.destination.localeCompare(b.destination);
          }
          if (sort === 'Latest Added') {
            return new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime();
          }
          // Default: Date (Ascending by start date)
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });

        // 4. Group By (Destination, Trip, Activity, Month)
        if (groupBy && groupBy.toLowerCase() !== 'none') {
          const groups = {};
          const groupKey = groupBy.toLowerCase();

          trips.forEach((t) => {
            let key = 'Other';
            if (groupKey === 'destination') {
              key = t.destination ? t.destination.split(',')[0].trim() : 'Unspecified';
            } else if (groupKey === 'trip type' || groupKey === 'triptype' || groupKey === 'trip') {
              key = t.status || 'Planned';
            } else if (groupKey === 'activity') {
              key = t.activities && t.activities.length > 0 ? t.activities[0] : 'General Sightseeing';
            } else if (groupKey === 'month') {
              if (t.startDate) {
                const d = new Date(t.startDate + 'T00:00:00');
                key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              } else {
                key = 'No Date';
              }
            } else if (groupKey === 'user') {
              key = t.createdBy || 'GlobalTrotter User';
            } else {
              key = t[groupBy] || t.status || 'General';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
          });

          resolve({
            success: true,
            isGrouped: true,
            groupBy,
            groups,
            totalCount: trips.length,
            trips
          });
          return;
        }

        resolve({
          success: true,
          isGrouped: false,
          trips,
          totalCount: trips.length
        });
      }, 250);
    });
  },

  // GET /api/trips/:id
  getTripById: async (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const trips = getStoredTrips();
        const trip = trips.find((t) => t.id === id);
        if (trip) {
          resolve({ success: true, trip });
        } else {
          reject(new Error('Trip not found'));
        }
      }, 150);
    });
  },

  // POST /api/trips
  createTrip: async (tripData, user) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!tripData.name || !tripData.destination || !tripData.startDate || !tripData.endDate) {
          reject(new Error('Trip Name, Destination, Start Date, and End Date are required'));
          return;
        }

        const colors = ['indigo', 'emerald', 'amber', 'sky', 'purple', 'rose'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const trips = getStoredTrips();
        const newTrip = {
          id: 'trip-' + Date.now(),
          name: tripData.name.trim(),
          destination: tripData.destination.trim(),
          startDate: tripData.startDate,
          endDate: tripData.endDate,
          status: tripData.status || 'Planned',
          travelersCount: parseInt(tripData.travelersCount, 10) || 1,
          activities: Array.isArray(tripData.activities)
            ? tripData.activities
            : typeof tripData.activities === 'string'
            ? tripData.activities.split(',').map((a) => a.trim()).filter(Boolean)
            : ['Sightseeing'],
          accommodation: tripData.accommodation?.trim() || 'Not specified',
          transportation: tripData.transportation?.trim() || 'Not specified',
          budget: tripData.budget?.trim() || '$1,500',
          description: tripData.description?.trim() || 'Exciting travel adventure scheduled with GlobeTrotter.',
          color: tripData.color || randomColor,
          coverImage: tripData.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString(),
          createdBy: user ? user.username : 'Guest'
        };

        const updated = [newTrip, ...trips];
        saveStoredTrips(updated);
        resolve({ success: true, trip: newTrip, message: 'Trip successfully scheduled!' });
      }, 300);
    });
  },

  // PUT /api/trips/:id
  updateTrip: async (id, updatedData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const trips = getStoredTrips();
        const index = trips.findIndex((t) => t.id === id);
        if (index === -1) {
          reject(new Error('Trip not found'));
          return;
        }

        const updatedTrip = {
          ...trips[index],
          ...updatedData,
          updatedAt: new Date().toISOString()
        };

        trips[index] = updatedTrip;
        saveStoredTrips(trips);
        resolve({ success: true, trip: updatedTrip, message: 'Trip updated successfully!' });
      }, 250);
    });
  },

  // DELETE /api/trips/:id
  deleteTrip: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const trips = getStoredTrips();
        const filtered = trips.filter((t) => t.id !== id);
        saveStoredTrips(filtered);
        resolve({ success: true, message: 'Trip deleted successfully!' });
      }, 200);
    });
  },

  // GET /api/trips/filter-options
  getFilterOptions: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const trips = getStoredTrips();
        const destinations = Array.from(
          new Set(trips.map((t) => t.destination.split(',')[0].trim()))
        ).filter(Boolean);

        const allActivities = new Set();
        trips.forEach((t) => {
          if (Array.isArray(t.activities)) {
            t.activities.forEach((a) => allActivities.add(a));
          }
        });

        const statuses = ['All', 'Upcoming', 'Planned', 'Completed', 'Cancelled'];

        resolve({
          statuses,
          destinations: ['All', ...destinations],
          activities: ['All', ...Array.from(allActivities)]
        });
      }, 100);
    });
  }
};
