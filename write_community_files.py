import os

def write_f(path, content):
    d = os.path.dirname(path)
    if d and not os.path.exists(d):
        os.makedirs(d, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as out:
        out.write(content.strip() + '\n')
    print(f'Wrote {path}')

# PostAuthor.jsx
write_f('src/components/Community/PostAuthor.jsx', """import React from 'react';
import { User, Award } from 'lucide-react';

function formatRelativeTime(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSec = Math.floor((now - date) / 1000);

    if (diffInSec < 60) return 'Just now';
    const diffInMin = Math.floor(diffInSec / 60);
    if (diffInMin < 60) return `${diffInMin}m ago`;
    const diffInHours = Math.floor(diffInMin / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export default function PostAuthor({ author, createdAt, tripDuration }) {
  return (
    <div className="gt-post-author-row">
      <div className="gt-author-avatar-wrapper">
        {author?.avatar ? (
          <img 
            src={author.avatar} 
            alt={author.name || author.username} 
            className="gt-post-avatar-img" 
            onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div className="gt-avatar-fallback" style={{ display: author?.avatar ? 'none' : 'flex' }}>
          <User size={18} />
        </div>
      </div>

      <div className="gt-author-info-col">
        <div className="gt-author-name-row">
          <span className="gt-author-name">{author?.name || author?.username || 'GlobeTrotter Traveler'}</span>
          {author?.badge && (
            <span className="gt-author-badge">
              <Award size={12} />
              <span>{author.badge}</span>
            </span>
          )}
        </div>
        <div className="gt-author-meta-row">
          <span className="gt-post-time">{formatRelativeTime(createdAt)}</span>
          {tripDuration && (
            <>
              <span className="gt-meta-dot">?</span>
              <span className="gt-post-trip-duration">{tripDuration}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
""")

# PostGallery.jsx
write_f('src/components/Community/PostGallery.jsx', """import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

export default function PostGallery({ images = [], title = '' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) return null;

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="gt-post-gallery-container">
      <div className="gt-gallery-main" onClick={() => setLightboxOpen(true)}>
        <img
          src={images[currentIndex]}
          alt={`${title} - view ${currentIndex + 1}`}
          className="gt-gallery-image"
          loading="lazy"
        />

        {images.length > 1 && (
          <>
            <button 
              type="button" 
              className="gt-gallery-nav-btn prev" 
              onClick={handlePrev}
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              type="button" 
              className="gt-gallery-nav-btn next" 
              onClick={handleNext}
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>

            <div className="gt-gallery-dots">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`gt-gallery-dot ${idx === currentIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                />
              ))}
            </div>
          </>
        )}

        <button 
          type="button" 
          className="gt-gallery-expand-btn" 
          onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
          title="Expand image"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Lightbox Preview */}
      {lightboxOpen && (
        <div className="gt-lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <button 
            type="button" 
            className="gt-lightbox-close" 
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
          >
            <X size={24} />
          </button>
          <div className="gt-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={images[currentIndex]} 
              alt={title} 
              className="gt-lightbox-image" 
            />
            {images.length > 1 && (
              <div className="gt-lightbox-counter">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
""")

# PostActions.jsx
write_f('src/components/Community/PostActions.jsx', """import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, Eye, Check } from 'lucide-react';

export default function PostActions({
  likesCount = 0,
  isLiked = false,
  commentsCount = 0,
  viewsCount = 0,
  onLike,
  onToggleComments,
  commentsOpen = false,
  postTitle = '',
  postId = ''
}) {
  const [copied, setCopied] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const handleLikeClick = () => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);
    onLike();
  };

  const handleShare = async () => {
    const shareData = {
      title: postTitle ? `${postTitle} | GlobeTrotter` : 'GlobeTrotter Community Post',
      text: 'Check out this travel experience on GlobeTrotter!',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(`${window.location.origin}/community#post-${postId}`);
    } catch {
      // fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="gt-post-actions-bar">
      <div className="gt-actions-left">
        {/* Like Button */}
        <button
          type="button"
          className={`gt-action-btn like-btn ${isLiked ? 'liked' : ''} ${likeAnimating ? 'animating' : ''}`}
          onClick={handleLikeClick}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart size={19} className={`heart-icon ${isLiked ? 'fill-current' : ''}`} />
          <span className="gt-action-count">{likesCount}</span>
        </button>

        {/* Comment Button */}
        <button
          type="button"
          className={`gt-action-btn comment-btn ${commentsOpen ? 'active' : ''}`}
          onClick={onToggleComments}
          title="Comments"
        >
          <MessageSquare size={19} />
          <span className="gt-action-count">{commentsCount}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          className={`gt-action-btn share-btn ${copied ? 'copied' : ''}`}
          onClick={handleShare}
          title={copied ? 'Link Copied!' : 'Share Post'}
        >
          {copied ? <Check size={18} className="text-success" /> : <Share2 size={19} />}
          <span className="gt-action-label">{copied ? 'Copied' : 'Share'}</span>
        </button>
      </div>

      {/* Views indicator */}
      {viewsCount > 0 && (
        <div className="gt-post-views-stat" title={`${viewsCount} Views`}>
          <Eye size={15} />
          <span>{viewsCount > 999 ? `${(viewsCount / 1000).toFixed(1)}k` : viewsCount}</span>
        </div>
      )}
    </div>
  );
}
""")
