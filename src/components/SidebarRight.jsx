import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Activity, Clock, ThumbsUp, Newspaper } from 'lucide-react';
import { awardCivicPoints } from '../services/userService';

function SidebarRight({ user }) {
  const [recentIssues, setRecentIssues] = useState([]);
  const [votedIssues, setVotedIssues] = useState(new Set()); // Keep track of local votes

  useEffect(() => {
    try {
      const q = query(collection(db, "issues"), limit(10));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const issues = [];
        snapshot.forEach((doc) => {
          issues.push({ id: doc.id, ...doc.data() });
        });
        
        issues.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
             return b.createdAt.toMillis() - a.createdAt.toMillis();
          }
          return 0;
        });
        setRecentIssues(issues.slice(0, 5));
      });

      return () => unsubscribe();
    } catch(e) {
      console.warn("Error setting up live feed:", e);
    }
  }, []);

  const handleUpvote = async (issueId) => {
    if (votedIssues.has(issueId)) return; // Prevent double voting locally for now
    
    try {
      const issueRef = doc(db, "issues", issueId);
      await updateDoc(issueRef, {
        upvotes: increment(1)
      });
      setVotedIssues(prev => new Set([...prev, issueId]));
      if (user && !user.isAnonymous) {
        await awardCivicPoints(user.uid, 1, user.displayName);
      }
    } catch (err) {
      console.error("Error upvoting:", err);
    }
  };

  return (
    <aside className="sidebar-right glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Activity size={20} color="var(--primary)" />
        <h3 style={{ fontSize: '1.125rem' }}>Live Feed</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {recentIssues.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No recent activity detected.</p>
        ) : (
          recentIssues.map((issue, idx) => (
            <div key={issue.id} className="feed-item hover-lift animate-fade-in" style={{ animationDelay: `${0.3 + (idx * 0.1)}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <strong style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{issue.title}</strong>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: issue.status === 'resolved' ? 'var(--primary)' : (issue.status === 'in_progress' ? 'var(--warning)' : 'var(--danger)') }}>
                  {issue.status}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {issue.description || issue.category}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  <Clock size={12} />
                  <span>{issue.createdAt ? new Date(issue.createdAt.toDate()).toLocaleTimeString() : 'Just now'}</span>
                </div>
                
                <button 
                  className={`upvote-btn ${votedIssues.has(issue.id) ? 'voted' : ''}`}
                  onClick={() => handleUpvote(issue.id)}
                  title="Upvote this issue"
                >
                  <ThumbsUp size={14} />
                  {issue.upvotes || 0}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* City News Section */}
      <div style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Newspaper size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1.125rem' }}>City News</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { id: 1, title: 'The Great Global Cleanup: Millions mobilize for community park restorations', url: 'https://www.earthday.org/campaign/cleanup/', date: 'Today', tag: 'Events' },
            { id: 2, title: 'New global framework established for sustainable smart city infrastructure', url: 'https://capacitymedia.com/', date: 'Yesterday', tag: 'Technology' },
            { id: 3, title: 'Major Urban Projects: Cities push toward transit-oriented sustainable growth', url: 'https://indianexpress.com/section/cities/', date: '2 days ago', tag: 'Infrastructure' }
          ].map(news => (
            <div key={news.id} className="feed-item hover-lift animate-fade-in">
              <a href={news.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <strong style={{ fontSize: '0.875rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                  {news.title}
                </strong>
              </a>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{news.tag}</span>
                <span style={{ color: 'var(--text-muted)' }}>{news.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default SidebarRight;
