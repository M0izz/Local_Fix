import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import ResolveIssueModal from './ResolveIssueModal';

function AdminDashboard({ user }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Check if user is anonymous (citizen) or real account (admin)
  const isAdmin = user && !user.isAnonymous;

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = [];
      querySnapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setIssues(data);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setLoginError("Login failed. Check your credentials.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (!isAdmin) {
    return (
      <div className="card animate-fade-in" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Admin Login</h2>
        {loginError && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{loginError}</p>}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" required />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Admin Dashboard</h2>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {issues.map(issue => (
          <div key={issue.id} className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
               <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{issue.title}</h3>
               <span style={{ 
                 fontSize: '0.75rem', 
                 padding: '0.25rem 0.5rem', 
                 borderRadius: 'var(--radius-full)', 
                 backgroundColor: issue.status === 'resolved' ? '#D1FAE5' : 'var(--background)',
                 color: issue.status === 'resolved' ? 'var(--secondary)' : 'var(--text-muted)'
               }}>
                 {issue.status.toUpperCase()}
               </span>
            </div>
            
            <img src={issue.imageUrl} alt="Before" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{issue.category} • Severity: {issue.severity}</p>
            
            {issue.status !== 'resolved' && (
              <button onClick={() => setSelectedIssue(issue)} className="btn btn-primary" style={{ width: '100%' }}>
                Verify Resolution
              </button>
            )}
          </div>
        ))}
      </div>

      {selectedIssue && (
        <ResolveIssueModal 
          issue={selectedIssue} 
          onClose={() => setSelectedIssue(null)} 
        />
      )}
    </div>
  );
}

export default AdminDashboard;
