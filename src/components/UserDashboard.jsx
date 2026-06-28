import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, Activity, AlertCircle, Award, CheckCircle } from 'lucide-react';

function UserDashboard({ user }) {
  const [issues, setIssues] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Fetch My Issues
        const q = query(
          collection(db, "issues"), 
          where("reporterId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const myIssues = [];
        querySnapshot.forEach((doc) => {
          myIssues.push({ id: doc.id, ...doc.data() });
        });
        
        myIssues.sort((a, b) => {
          if(a.createdAt && b.createdAt) return b.createdAt.toMillis() - a.createdAt.toMillis();
          return 0;
        });

        setIssues(myIssues);

        // Fetch Leaderboard
        const leadQ = query(collection(db, "users"), orderBy("civicPoints", "desc"), limit(5));
        const leadSnap = await getDocs(leadQ);
        const leaders = [];
        leadSnap.forEach(doc => leaders.push({ id: doc.id, ...doc.data() }));
        setLeaderboard(leaders);

      } catch (err) {
        console.error("Error fetching user dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user || user.isAnonymous) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />
        <h2>Please Sign In</h2>
        <p style={{ color: 'var(--text-muted)' }}>You must be signed in with Google to track your reported issues.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', height: '100%', overflowY: 'auto' }}>
      
      <div style={{ flex: '1 1 60%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ margin: 0 }}>My Reports</h2>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                <CheckCircle size={14} /> Verified Resident
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Track the status of issues you've submitted.</p>
          </div>
        </div>

        {loading ? (
          <p>Loading your reports...</p>
        ) : issues.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p>You haven't reported any issues yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {issues.map(issue => (
              <div key={issue.id} className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {issue.imageUrl && (
                  <img src={issue.imageUrl} alt={issue.title} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ marginBottom: '0.25rem' }}>{issue.title}</h3>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: 'var(--radius-full)', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      backgroundColor: issue.status === 'resolved' ? 'rgba(90, 139, 184, 0.1)' : 'rgba(222, 155, 82, 0.1)',
                      color: issue.status === 'resolved' ? 'var(--primary)' : 'var(--warning)'
                    }}>
                      {issue.status.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{issue.category} • Severity: {issue.severity}</p>
                  <p style={{ fontSize: '0.875rem' }}>{issue.description}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Activity size={14} /> {issue.upvotes || 0} Upvotes
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: '1 1 30%', minWidth: '300px' }}>
         <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
              <Award size={24} />
              <h3 style={{ margin: 0 }}>Civic Leaderboard</h3>
            </div>
            
            {leaderboard.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No leaders yet. Be the first to report!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {leaderboard.map((leader, idx) => (
                  <div key={leader.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: 'var(--surface-solid)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--clay-pressed)' }}>
                     <div style={{ fontWeight: 'bold', color: idx === 0 ? '#DE9B52' : 'var(--text-muted)', width: '20px' }}>
                       #{idx + 1}
                     </div>
                     <div style={{ flex: 1, overflow: 'hidden' }}>
                       <p style={{ fontWeight: '600', fontSize: '0.875rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{leader.displayName}</p>
                     </div>
                     <div style={{ fontWeight: '800', color: 'var(--primary)' }}>
                       {leader.civicPoints || 0} pts
                     </div>
                  </div>
                ))}
              </div>
            )}
         </div>
      </div>
    </div>
  );
}

export default UserDashboard;
