const COMMUNITY_STORAGE_KEY = 'globetrotter_community_posts';

const INITIAL_POSTS = [
  {
    id: 'post-1',
    title: 'My Amazing Manali Winter Trek & Solang Valley Adventure',
    description: 'Just completed an incredible 6-day trek through the snow-capped trails of Manali and Solang Valley! The crisp mountain breeze, pristine pine forests, and steaming cups of chai at 10,000 feet made this the most memorable trip of the year. Highly recommend visiting early winter before peak rush.',
    destination: 'Manali, Himachal Pradesh',
    tripType: 'Trekking',
    activity: 'Hiking',
    tags: ['#Himalayas', '#SnowTrek', '#ManaliDiaries', '#Wanderlust'],
    tripDuration: '6 Days • Nov 2024',
    images: [
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80'
    ],
    author: {
      id: 'u-1',
      username: 'aarav_sharma',
      name: 'Aarav Sharma',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      badge: 'Explorer'
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    likesCount: 124,
    likedBy: ['priya_patel', 'rahul_verma'],
    viewsCount: 1420,
    comments: [
      {
        id: 'c-1',
        username: 'rahul_verma',
        name: 'Rahul Verma',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        content: 'Amazing place! Did you take the Rohtang Pass route or stick to Solang?',
        createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString()
      },
      {
        id: 'c-2',
        username: 'priya_patel',
        name: 'Priya Patel',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        content: 'Adding this to my travel bucket list for next December. Breathtaking photos!',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'post-2',
    title: 'Hidden Waterfalls and Sacred Temples of Ubud',
    description: 'Woke up at 5:30 AM to catch the sunrise over the Tegalalang Rice Terraces and then rode a scooter deep into the jungle to find Tukad Cepung Waterfall. The sunlight beaming through the cave roof was completely ethereal.',
    destination: 'Ubud, Bali, Indonesia',
    tripType: 'Solo',
    activity: 'Sightseeing',
    tags: ['#BaliVibes', '#UbudJungle', '#SoloTraveler', '#Nature'],
    tripDuration: '8 Days • Oct 2024',
    images: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1200&auto=format&fit=crop&q=80'
    ],
    author: {
      id: 'u-2',
      username: 'ananya_kapoor',
      name: 'Ananya Kapoor',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      badge: 'Globetrotter Pro'
    },
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    likesCount: 289,
    likedBy: ['aarav_sharma', 'kirtan'],
    viewsCount: 3105,
    comments: [
      {
        id: 'c-3',
        username: 'kirtan',
        name: 'Kirtan Tandel',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        content: 'How was the scooter rental process? Any tips for road navigation?',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'c-4',
        username: 'ananya_kapoor',
        name: 'Ananya Kapoor',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        content: 'Very easy! Just get an international driving permit beforehand and use offline Google Maps.',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'post-3',
    title: 'Neon Nights & Culinary Wonders in Shibuya & Shinjuku',
    description: 'Tokyo at night feels like stepping into a cyberpunk dream. Spent three days exploring alleyway ramen stalls in Omoide Yokocho, futuristic art exhibits in Odaiba, and photographing the vibrant pedestrian crossings.',
    destination: 'Tokyo, Japan',
    tripType: 'Adventure',
    activity: 'Photography',
    tags: ['#TokyoNights', '#StreetPhotography', '#JapanTravel', '#Foodie'],
    tripDuration: '10 Days • Sep 2024',
    images: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&auto=format&fit=crop&q=80'
    ],
    author: {
      id: 'u-3',
      username: 'vikram_singh',
      name: 'Vikram Singh',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      badge: 'Photographer'
    },
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    likesCount: 452,
    likedBy: ['ananya_kapoor'],
    viewsCount: 5240,
    comments: [
      {
        id: 'c-5',
        username: 'sneha_rao',
        name: 'Sneha Rao',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        content: 'The ramen in Shinjuku is unmatched! Which shop was your favorite?',
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'post-4',
    title: 'Glacier Express and Alpine Majesty under the Matterhorn',
    description: 'Riding the Glacier Express from St. Moritz to Zermatt through the Swiss Alps. Panoramic windows offered unforgettable views of steep ravines, snowy peaks, and timeless alpine hamlets.',
    destination: 'Zermatt, Swiss Alps, Switzerland',
    tripType: 'Romantic',
    activity: 'Sightseeing',
    tags: ['#SwissAlps', '#Matterhorn', '#ScenicTrain', '#EuropeTravel'],
    tripDuration: '7 Days • Aug 2024',
    images: [
      'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&auto=format&fit=crop&q=80'
    ],
    author: {
      id: 'u-4',
      username: 'sneha_rao',
      name: 'Sneha Rao',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      badge: 'Explorer'
    },
    createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
    likesCount: 198,
    likedBy: ['aarav_sharma', 'vikram_singh'],
    viewsCount: 2430,
    comments: []
  },
  {
    id: 'post-5',
    title: 'Chasing the Northern Lights & Golden Circle Road Trip',
    description: 'Iceland in late autumn is otherworldly. We rented a 4x4 camper van and drove along the southern ring road. Witnessing the Aurora Borealis dance green and violet above the Skógafoss waterfall was life changing.',
    destination: 'Reykjavik, Iceland',
    tripType: 'Road Trip',
    activity: 'Adventure',
    tags: ['#NorthernLights', '#IcelandRoadTrip', '#Aurora', '#Arctic'],
    tripDuration: '9 Days • Oct 2024',
    images: [
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=1200&auto=format&fit=crop&q=80'
    ],
    author: {
      id: 'u-5',
      username: 'priya_patel',
      name: 'Priya Patel',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      badge: 'Globetrotter Pro'
    },
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    likesCount: 365,
    likedBy: ['vikram_singh', 'ananya_kapoor'],
    viewsCount: 4120,
    comments: [
      {
        id: 'c-6',
        username: 'aarav_sharma',
        name: 'Aarav Sharma',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        content: 'Phenomenal shot of the Aurora! How cold did it get at night?',
        createdAt: new Date(Date.now() - 70 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

function getStoredPosts() {
  try {
    const raw = localStorage.getItem(COMMUNITY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
      return INITIAL_POSTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading stored community posts:', err);
    return INITIAL_POSTS;
  }
}

function saveStoredPosts(posts) {
  try {
    localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(posts));
  } catch (err) {
    console.error('Error saving community posts:', err);
  }
}

export const CommunityService = {
  // GET /api/community/posts
  getPosts: async ({ search = '', groupBy = 'none', filter = {}, sort = 'Latest' } = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let posts = getStoredPosts();

        // 1. Search (Destination, Trip name, Activity, Username, Post title, Description)
        if (search && search.trim()) {
          const q = search.toLowerCase().trim();
          posts = posts.filter(p => 
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.destination.toLowerCase().includes(q) ||
            (p.tripType && p.tripType.toLowerCase().includes(q)) ||
            (p.activity && p.activity.toLowerCase().includes(q)) ||
            (p.author?.name && p.author.name.toLowerCase().includes(q)) ||
            (p.author?.username && p.author.username.toLowerCase().includes(q)) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
          );
        }

        // 2. Filter (Destination, Trip Type, Activity, Date)
        if (filter.destination && filter.destination !== 'All') {
          posts = posts.filter(p => p.destination.toLowerCase().includes(filter.destination.toLowerCase()));
        }
        if (filter.tripType && filter.tripType !== 'All') {
          posts = posts.filter(p => p.tripType?.toLowerCase() === filter.tripType.toLowerCase());
        }
        if (filter.activity && filter.activity !== 'All') {
          posts = posts.filter(p => p.activity?.toLowerCase() === filter.activity.toLowerCase());
        }
        if (filter.dateRange && filter.dateRange !== 'All') {
          const now = Date.now();
          if (filter.dateRange === 'Today') {
            posts = posts.filter(p => now - new Date(p.createdAt).getTime() <= 24 * 60 * 60 * 1000);
          } else if (filter.dateRange === 'This Week') {
            posts = posts.filter(p => now - new Date(p.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000);
          } else if (filter.dateRange === 'This Month') {
            posts = posts.filter(p => now - new Date(p.createdAt).getTime() <= 30 * 24 * 60 * 60 * 1000);
          }
        }

        // 3. Sort (Latest, Most Liked, Most Commented, Most Viewed, Oldest)
        posts.sort((a, b) => {
          if (sort === 'Most Liked') return (b.likesCount || 0) - (a.likesCount || 0);
          if (sort === 'Most Commented') return (b.comments?.length || 0) - (a.comments?.length || 0);
          if (sort === 'Most Viewed') return (b.viewsCount || 0) - (a.viewsCount || 0);
          if (sort === 'Oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          // Default: Latest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        // 4. Group By (Destination, Trip Type, Activity, User, Date)
        if (groupBy && groupBy.toLowerCase() !== 'none') {
          const groups = {};
          const groupKey = groupBy.toLowerCase();

          posts.forEach(p => {
            let key = 'Other';
            if (groupKey === 'destination') {
              key = p.destination.split(',')[0].trim();
            } else if (groupKey === 'trip type' || groupKey === 'triptype') {
              key = p.tripType || 'General';
            } else if (groupKey === 'activity') {
              key = p.activity || 'Sightseeing';
            } else if (groupKey === 'user') {
              key = p.author?.name || p.author?.username || 'Unknown Traveler';
            } else if (groupKey === 'date') {
              const d = new Date(p.createdAt);
              key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
          });

          resolve({
            success: true,
            isGrouped: true,
            groupBy,
            groups,
            totalCount: posts.length
          });
          return;
        }

        resolve({
          success: true,
          isGrouped: false,
          posts,
          totalCount: posts.length
        });
      }, 350);
    });
  },

  // GET /api/community/posts/:id
  getPostById: async (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const posts = getStoredPosts();
        const post = posts.find(p => p.id === id);
        if (post) {
          resolve({ success: true, post });
        } else {
          reject(new Error('Post not found'));
        }
      }, 200);
    });
  },

  // POST /api/community/posts
  createPost: async (postData, currentUser) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!currentUser) {
          reject(new Error('Authentication required to create a post'));
          return;
        }
        if (!postData.title || !postData.description || !postData.destination) {
          reject(new Error('Title, description, and destination are required'));
          return;
        }

        const posts = getStoredPosts();
        const newPost = {
          id: 'post-' + Date.now(),
          title: postData.title.trim(),
          description: postData.description.trim(),
          destination: postData.destination.trim(),
          tripType: postData.tripType || 'Adventure',
          activity: postData.activity || 'Sightseeing',
          tripDuration: postData.tripDuration || 'Recently Completed',
          tags: postData.tags && Array.isArray(postData.tags) 
            ? postData.tags 
            : typeof postData.tags === 'string'
              ? postData.tags.split(',').map(t => t.trim().startsWith('#') ? t.trim() : '#' + t.trim()).filter(Boolean)
              : ['#GlobeTrotter', '#Travel'],
          images: postData.images && postData.images.length > 0 
            ? postData.images 
            : ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=80'],
          author: {
            id: currentUser.id || 'u-me',
            username: currentUser.username,
            name: currentUser.name || currentUser.username,
            avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            badge: 'Traveler'
          },
          createdAt: new Date().toISOString(),
          likesCount: 0,
          likedBy: [],
          viewsCount: 1,
          comments: []
        };

        const updated = [newPost, ...posts];
        saveStoredPosts(updated);
        resolve({ success: true, post: newPost, message: 'Post published successfully!' });
      }, 500);
    });
  },

  // POST & DELETE /api/community/posts/:id/like
  toggleLike: async (postId, username) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!username) {
          reject(new Error('Please log in to like this post'));
          return;
        }

        const posts = getStoredPosts();
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) {
          reject(new Error('Post not found'));
          return;
        }

        const post = { ...posts[postIndex] };
        post.likedBy = post.likedBy || [];
        const isLiked = post.likedBy.includes(username);

        if (isLiked) {
          post.likedBy = post.likedBy.filter(u => u !== username);
          post.likesCount = Math.max(0, (post.likesCount || 1) - 1);
        } else {
          post.likedBy.push(username);
          post.likesCount = (post.likesCount || 0) + 1;
        }

        posts[postIndex] = post;
        saveStoredPosts(posts);

        resolve({
          success: true,
          isLiked: !isLiked,
          likesCount: post.likesCount,
          message: !isLiked ? 'Liked post' : 'Unliked post'
        });
      }, 200);
    });
  },

  // POST /api/community/posts/:id/comments
  addComment: async (postId, content, currentUser) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!currentUser) {
          reject(new Error('Please log in to post a comment'));
          return;
        }
        if (!content || !content.trim()) {
          reject(new Error('Comment cannot be empty'));
          return;
        }

        const posts = getStoredPosts();
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) {
          reject(new Error('Post not found'));
          return;
        }

        const newComment = {
          id: 'c-' + Date.now(),
          username: currentUser.username,
          name: currentUser.name || currentUser.username,
          avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          content: content.trim(),
          createdAt: new Date().toISOString()
        };

        posts[postIndex].comments = posts[postIndex].comments || [];
        posts[postIndex].comments.push(newComment);
        saveStoredPosts(posts);

        resolve({
          success: true,
          comment: newComment,
          commentsCount: posts[postIndex].comments.length,
          message: 'Comment added'
        });
      }, 300);
    });
  },

  // GET available filters metadata
  getFilterOptions: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const posts = getStoredPosts();
        const destinations = Array.from(new Set(posts.map(p => p.destination.split(',')[0].trim()))).filter(Boolean);
        const tripTypes = ['All', 'Adventure', 'Solo', 'Trekking', 'Road Trip', 'Romantic', 'Family', 'Cultural'];
        const activities = ['All', 'Hiking', 'Sightseeing', 'Photography', 'Scuba Diving', 'Food Tour', 'Camping'];
        const dateRanges = ['All', 'Today', 'This Week', 'This Month'];

        resolve({
          destinations: ['All', ...destinations],
          tripTypes,
          activities,
          dateRanges
        });
      }, 100);
    });
  }
};
