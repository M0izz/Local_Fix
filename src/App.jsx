import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth, db } from './config/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import MapView from './components/MapView';
import ReportIssue from './components/ReportIssue';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import Communities from './components/Communities';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CivicAssistant from './components/CivicAssistant';
import LandingPage from './components/LandingPage';
import { AlertTriangle } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [criticalAlerts, setCriticalAlerts] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    if (!auth.currentUser) {
       signInAnonymously(auth).catch(err => console.warn("Anon auth disabled or failed:", err));
    }

    const q = query(collection(db, "issues"), where("isCritical", "==", true), where("status", "in", ["reported", "in_progress"]));
    const unsubscribeAlerts = onSnapshot(q, (snapshot) => {
      setCriticalAlerts(snapshot.docs.map(doc => doc.data()));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeAlerts();
    };
  }, []);

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {criticalAlerts.length > 0 && (
          <div style={{ backgroundColor: '#ef4444', color: 'white', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', zIndex: 9999 }}>
            <AlertTriangle size={20} />
            {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''} in your area! Please stay safe and check the Live Map.
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/app/*" element={
            <div style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
              {/* Ambient Background Glows */}
              <div className="ambient-orb ambient-orb-1"></div>
              <div className="ambient-orb ambient-orb-2"></div>

              <div className="app-layout" style={{ height: criticalAlerts.length > 0 ? 'calc(100vh - 48px)' : '100vh', position: 'relative', zIndex: 1 }}>
              <SidebarLeft user={user} />
              
              <main className="main-content glass-panel animate-fade-in">
                <Routes>
                  <Route path="/" element={<MapView user={user} />} />
                  <Route path="report" element={<ReportIssue user={user} />} />
                  <Route path="admin" element={<AdminDashboard user={user} />} />
                  <Route path="analytics" element={<AnalyticsDashboard />} />
                  <Route path="profile" element={<UserDashboard user={user} />} />
                  <Route path="communities" element={<Communities user={user} />} />
                </Routes>
              </main>

              <SidebarRight user={user} />
              
              <CivicAssistant />
            </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
