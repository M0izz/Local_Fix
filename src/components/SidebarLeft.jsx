import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Shield, Map as MapIcon, PlusCircle, LogIn, LogOut, Settings, User as UserIcon, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { auth } from '../config/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

function SidebarLeft({ user }) {
  const location = useLocation();

  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(err => {
      console.error("Google Sign In Error:", err);
    });
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  const isRealUser = user && !user.isAnonymous;

  const navItems = [
    { path: '/app', label: 'Live Map', icon: <MapIcon size={20} /> },
    { path: '/app/communities', label: 'Communities', icon: <Users size={20} /> },
    { path: '/app/report', label: 'Report Issue', icon: <PlusCircle size={20} /> },
    { path: '/app/analytics', label: 'Impact Dashboard', icon: <TrendingUp size={20} /> },
  ];

  if (isRealUser) {
    navItems.push({ path: '/app/profile', label: 'My Reports', icon: <UserIcon size={20} /> });
  }
  return (
    <aside className="sidebar-left glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <NavLink to="/" className="logo">
        <div className="flex items-center space-x-3 text-white cursor-pointer" onClick={() => navigate('/app')}>
          <Menu className="h-6 w-6 text-yellow-500" />
          <span>Local Fix</span>
        </div>
      </NavLink>

      <nav className="sidebar-nav">
        <NavLink to="/app" end className={({ isActive }) => `nav-item hover-lift ${isActive ? 'active' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapIcon size={20} />
            <span>Live Heatmaps</span>
          </div>
          <span className="live-dot"></span>
        </NavLink>
        
        <NavLink to="/app/communities" className={({ isActive }) => `nav-item hover-lift ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Communities</span>
        </NavLink>

        <NavLink to="/app/report" className={({ isActive }) => `nav-item hover-lift ${isActive ? 'active' : ''}`}>
          <PlusCircle size={20} />
          <span>Report Issue</span>
        </NavLink>

        <NavLink to="/app/analytics" className={({ isActive }) => `nav-item hover-lift ${isActive ? 'active' : ''}`}>
          <TrendingUp size={20} />
          <span>Impact Dashboard</span>
        </NavLink>

        {isRealUser && (
          <NavLink to="/app/profile" className={({ isActive }) => `nav-item hover-lift ${isActive ? 'active' : ''}`}>
            <UserIcon size={20} />
            <span>My Reports</span>
          </NavLink>
        )}

        <NavLink to="/app/admin" className={({ isActive }) => `nav-item hover-lift ${isActive ? 'active' : ''}`}>
          <Settings size={20} />
          <span>City Admin</span>
        </NavLink>
      </nav>
      
      <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
        {isRealUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.displayName || 'User'}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.email}</p>
              </div>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSignOut}>
              <LogOut size={16} /> <span className="nav-label">Sign Out</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p className="nav-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sign in to track your reports</p>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleGoogleSignIn}>
              <LogIn size={16} /> <span className="nav-label">Sign In with Google</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default SidebarLeft;
