import React from 'react';
import { Plus, Sparkles } from 'lucide-react';

export default function CommunityHeader({ onOpenCreateModal }) {
  return (
    <div className="community-header-container">
      <div className="community-header-content">
        <div className="community-badge-pill">
          <Sparkles size={14} className="pill-icon" />
          <span>Traveler Network</span>
        </div>
        <h1 className="community-main-title">Community</h1>
        <p className="community-main-subtitle">
          Share your travel experiences, discover new destinations,
          and connect with fellow travelers.
        </p>
      </div>

      <div className="community-header-action">
        <button type="button" className="btn-create-post" onClick={onOpenCreateModal}>
          <Plus size={20} />
          <span>Create Post</span>
        </button>
      </div>
    </div>
  );
}
