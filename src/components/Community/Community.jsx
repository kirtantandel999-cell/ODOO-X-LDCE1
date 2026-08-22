import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/AuthService';
import './community.css';

const CATEGORY_LABEL = {
  adventure: 'Adventure',
  nature: 'Nature',
  heritage: 'Heritage',
  food: 'Food',
  water: 'Water',
};

const CATEGORY_ORDER = ['adventure', 'nature', 'heritage', 'food', 'water'];

const TAG_COLOR = {
  adventure: 'var(--gold)',
  nature: '#3f7d4f',
  heritage: 'var(--terracotta)',
  food: 'var(--rust)',
  water: 'var(--ocean)',
};

const HeartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const CommentIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-9 8.4A8.5 8.5 0 1 1 21 11.5z" />
  </svg>
);

const ShareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" />
  </svg>
);

const TripIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2 2 19h20L12 2z" />
  </svg>
);

const INITIAL_POSTS = [
  {
    id: 1,
    name: 'Priya Nair',
    handle: '@priyaflies',
    hoursAgo: 4,
    timeLabel: '4h ago',
    tag: 'adventure',
    trip: 'Tandem Paragliding — Bir Billing',
    text: "Launched right at golden hour and the whole Kangra valley just opened up below us. Terrified for the first ten seconds, then couldn't stop grinning. Worth every rupee.",
    image: 'https://images.unsplash.com/photo-1521673461164-de300ebcfb17?auto=format&fit=crop&w=600&q=70',
    likes: 128,
    isLiked: false,
    comments: 23,
    avatarLetter: 'P',
    authorFlag: 'Modern Goose',
  },
  {
    id: 2,
    name: 'Rohan Mehta',
    handle: '@rohan_eats',
    hoursAgo: 9,
    timeLabel: '9h ago',
    tag: 'food',
    trip: 'Kangra Valley Food Trail',
    text: 'Three home kitchens, three completely different madra recipes, and a grandmother who refused to let us leave without seconds. Go hungry.',
    image: null,
    likes: 86,
    isLiked: false,
    comments: 14,
    avatarLetter: 'R',
    authorFlag: 'Salty Almond',
  },
  {
    id: 3,
    name: 'Sana Iqbal',
    handle: '@sana.wanders',
    hoursAgo: 26,
    timeLabel: 'Yesterday',
    tag: 'heritage',
    trip: 'Bir Monastery & Tibetan Colony',
    text: 'Sat in on evening prayers by accident and ended up staying an hour. The monks were happy to explain the murals afterward — bring small notes for the craft shops.',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=70',
    likes: 204,
    isLiked: false,
    comments: 31,
    avatarLetter: 'S',
    authorFlag: 'Quiet Falcon',
  },
  {
    id: 4,
    name: 'Vikram Rao',
    handle: '@vikramrao',
    hoursAgo: 48,
    timeLabel: '2d ago',
    tag: 'water',
    trip: 'Beas River Rafting',
    text: "Grade III rapids felt bigger than advertised after the recent rain — instructor was solid throughout though. Pair it with a Bir stopover like the app suggests, it's a great combo day.",
    image: null,
    likes: 61,
    isLiked: false,
    comments: 8,
    avatarLetter: 'V',
    authorFlag: 'Brave Lantern',
  },
  {
    id: 5,
    name: 'Meera Das',
    handle: '@meera_nature',
    hoursAgo: 52,
    timeLabel: '3d ago',
    tag: 'nature',
    trip: 'Tirthan Valley River Trail',
    text: "Clean mountain rivers, trout fishing in the morning, and total peace amidst the Great Himalayan National Park. A must-visit escape!",
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=70',
    likes: 95,
    isLiked: false,
    comments: 18,
    avatarLetter: 'M',
    authorFlag: 'Swift Sparrow',
  },
];

export default function Community({ onNavigate }) {
  let auth = null;
  try {
    auth = useAuth();
  } catch (err) {
    // Fallback if not inside AuthProvider
  }

  const currentUser = auth?.user || AuthService.getCurrentUser();

  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('globetrotter_community_feed');
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });

  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [menuOpen, setMenuOpen] = useState(false);
  const [flashId, setFlashId] = useState(null);
  const [shareNotice, setShareNotice] = useState(null);

  useEffect(() => {
    localStorage.setItem('globetrotter_community_feed', JSON.stringify(posts));
  }, [posts]);

  const handleLike = (e, postId) => {
    e.stopPropagation();
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likes: isLiked ? p.likes + 1 : p.likes - 1,
          };
        }
        return p;
      })
    );
  };

  const handleShare = (e, post) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/#community?post=${post.id}`);
    }
    setShareNotice(`Link copied for "${post.trip}"!`);
    setTimeout(() => setShareNotice(null), 3000);
  };

  const visiblePosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      const matchesSearch = !q || `${p.name} ${p.trip} ${p.text} ${p.handle}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || p.tag === filter;
      return matchesSearch && matchesFilter;
    });
  }, [posts, search, filter]);

  const sortPosts = (list) => {
    const copy = [...list];
    copy.sort((a, b) => {
      if (sortBy === 'liked') return b.likes - a.likes;
      if (sortBy === 'commented') return b.comments - a.comments;
      return a.hoursAgo - b.hoursAgo;
    });
    return copy;
  };

  const openPost = (post) => {
    setFlashId(post.id);
    setTimeout(() => setFlashId(null), 500);
  };

  const handleNav = (screen) => {
    setMenuOpen(false);
    if (onNavigate) onNavigate(screen);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    if (auth?.logout) {
      await auth.logout();
    } else {
      await AuthService.logout();
    }
    if (onNavigate) onNavigate('login');
  };

  const userInitial = currentUser?.firstName
    ? currentUser.firstName.charAt(0).toUpperCase()
    : currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : 'A';

  const renderPost = (post) => (
    <div className="post-row" key={post.id}>
      <div className="post-avatar" style={{ background: TAG_COLOR[post.tag] }}>
        {post.avatarLetter}
      </div>
      <article
        className="post-card"
        tabIndex={0}
        style={flashId === post.id ? { outline: '2px solid var(--terracotta)' } : undefined}
        onClick={() => openPost(post)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPost(post);
          }
        }}
      >
        <div className="post-top">
          <div className="post-who">
            <span className="post-name">{post.name}</span>
            <span className="post-handle">{post.handle}</span>
            <span className="post-time">{post.timeLabel}</span>
          </div>
          <span className={`status-pill ${post.tag}`}>{CATEGORY_LABEL[post.tag] || post.tag}</span>
        </div>

        <span className="post-trip">
          <TripIcon /> {post.trip}
        </span>

        <p className="post-text">{post.text}</p>

        {post.image && (
          <div className="post-thumb">
            <img src={post.image} alt={post.trip} />
          </div>
        )}

        <div className="post-foot">
          <button
            type="button"
            className={`stat ${post.isLiked ? 'liked' : ''}`}
            onClick={(e) => handleLike(e, post.id)}
            title={post.isLiked ? 'Unlike' : 'Like'}
          >
            <HeartIcon />
            {post.likes}
          </button>
          <span className="stat">
            <CommentIcon />
            {post.comments}
          </span>
          <button
            type="button"
            className="stat"
            onClick={(e) => handleShare(e, post)}
            title="Share post"
          >
            <ShareIcon />
            Share
          </button>
        </div>

        <div className="author-flag">
          <span className="point" />
          <span className="chip">{post.authorFlag}</span>
        </div>
      </article>
    </div>
  );

  return (
    <div onClick={() => menuOpen && setMenuOpen(false)}>
      {/* TOP BAR */}
      <div className="topbar">
        <div className="wrap">
          <a
            href="#home"
            className="logo"
            onClick={(e) => {
              e.preventDefault();
              handleNav('home');
            }}
          >
            <span className="mark">GT</span> GlobalTrotter
          </a>

          <div className="topbar-right">
            <span className="crumb">
              <a
                href="#home"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('home');
                }}
              >
                Home
              </a>{' '}
              / <span>Community</span>
            </span>

            <div className="avatar-wrap">
              <button
                type="button"
                className="avatar-btn"
                aria-label="Account menu"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
              >
                {currentUser?.photo || currentUser?.avatar ? (
                  <img
                    src={currentUser.photo || currentUser.avatar}
                    alt={currentUser.name || 'User'}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  userInitial
                )}
              </button>

              <div className={`avatar-menu${menuOpen ? ' open' : ''}`}>
                <button type="button" onClick={() => handleNav('profile')}>My Profile</button>
                <button type="button" onClick={() => handleNav('calendar')}>Trip Calendar</button>
                <button type="button" onClick={() => handleNav('createTrip')}>Plan Trip</button>
                <button type="button" onClick={() => handleNav('admin')}>Admin Panel</button>
                <button type="button" onClick={() => handleNav('home')}>Home Page</button>
                <button type="button" onClick={handleLogout}>Log Out</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE HEAD */}
      <div className="page-head">
        <div className="wrap">
          <span className="eyebrow">Travelers Hub</span>
          <h1>Community</h1>
          <p>
            Share travel discoveries, explore genuine traveler experiences, and connect with adventurers across the globe.
          </p>
        </div>
      </div>

      {shareNotice && (
        <div className="wrap" style={{ marginBottom: '16px' }}>
          <div style={{
            background: 'var(--indigo-deep)',
            color: 'var(--white)',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✓</span> {shareNotice}
          </div>
        </div>
      )}

      <main className="wrap">
        {/* TOOLBAR */}
        <div className="toolbar">
          <div className="search-field">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder="Search community posts, destinations, trips..."
              aria-label="Search community posts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="toolbar-selects">
            <select aria-label="Group by" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option value="none">Group by: None</option>
              <option value="category">Group by: Category</option>
            </select>

            <select aria-label="Filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Filter: All</option>
              <option value="adventure">Filter: Adventure</option>
              <option value="nature">Filter: Nature</option>
              <option value="heritage">Filter: Heritage</option>
              <option value="food">Filter: Food</option>
              <option value="water">Filter: Water</option>
            </select>

            <select aria-label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Sort by: Most recent</option>
              <option value="liked">Sort by: Most liked</option>
              <option value="commented">Sort by: Most commented</option>
            </select>
          </div>
        </div>

        {groupBy === 'none' ? (
          <section className="feed-group">
            <div className="section-head">
              <h2>Community feed</h2>
              <span className="section-count">{visiblePosts.length} posts</span>
            </div>
            <div className="feed">{sortPosts(visiblePosts).map(renderPost)}</div>
            {visiblePosts.length === 0 && <p className="group-empty show">No posts match your search criteria.</p>}
          </section>
        ) : (
          CATEGORY_ORDER.map((tag) => {
            if (filter !== 'all' && filter !== tag) return null;
            const groupPosts = sortPosts(visiblePosts.filter((p) => p.tag === tag));
            return (
              <section className="feed-group" key={tag}>
                <div className="section-head">
                  <span className={`status-dot ${tag}`} />
                  <h2>{CATEGORY_LABEL[tag]}</h2>
                  <span className="section-count">{groupPosts.length}</span>
                </div>
                <div className="feed">{groupPosts.map(renderPost)}</div>
                {groupPosts.length === 0 && (
                  <p className="group-empty show">No {CATEGORY_LABEL[tag].toLowerCase()} posts found.</p>
                )}
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
