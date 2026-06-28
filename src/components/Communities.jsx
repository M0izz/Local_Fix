import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Users, PlusCircle, AlertCircle } from 'lucide-react';

function Communities({ user }) {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // New Community Form State
  const [name, setName] = useState('');
  const [locality, setLocality] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAttemptedSeed = useRef(false);

  useEffect(() => {
    const q = query(collection(db, "communities"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comms = [];
      snapshot.forEach(doc => comms.push({ id: doc.id, ...doc.data() }));
      setCommunities(comms);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching communities:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!user || user.isAnonymous) {
      setError("You must be signed in with Google to create a community.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      await addDoc(collection(db, "communities"), {
        name,
        locality,
        description,
        memberCount: 1, // Creator is the first member
        creatorId: user.uid,
        createdAt: serverTimestamp()
      });
      setShowCreateModal(false);
      setName('');
      setLocality('');
      setDescription('');
    } catch (err) {
      console.error("Failed to create community:", err);
      setError("Failed to create community. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const seedDemoCommunities = async () => {
    const demoGroups = [
      { name: "Green Streets Initiative", locality: "Downtown Core", description: "Dedicated to planting trees and maintaining public parks in the downtown area.", memberCount: 142, creatorId: 'demo' },
      { name: "Safe Roads Alliance", locality: "Westside District", description: "Advocating for better street lighting and pothole repairs to reduce accidents.", memberCount: 89, creatorId: 'demo' },
      { name: "Neighborhood Watch - North", locality: "North Hills", description: "Community patrol and hazard reporting group to keep our streets safe at night.", memberCount: 215, creatorId: 'demo' },
      { name: "Eco-Warriors Beach Cleanup", locality: "Coastal Zone", description: "Weekend warriors cleaning up plastic waste along the city beaches.", memberCount: 304, creatorId: 'demo' }
    ];
    
    setIsSubmitting(true);
    for (const group of demoGroups) {
      await addDoc(collection(db, "communities"), {
        ...group,
        createdAt: serverTimestamp()
      });
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!loading && communities.length === 0 && !hasAttemptedSeed.current) {
      hasAttemptedSeed.current = true;
      seedDemoCommunities();
    }
  }, [loading, communities.length]);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <h2>Local Communities</h2>
            <p style={{ color: 'var(--text-muted)' }}>Join local groups and take action together.</p>
          </div>
        </div>
        
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <PlusCircle size={18} /> Create Group
        </button>
      </div>

      {loading ? (
        <p>Loading communities...</p>
      ) : communities.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Users size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3>Seeding communities...</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Setting up demo groups for you.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {communities.map(comm => (
            <div key={comm.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <h3 style={{ marginBottom: '0.25rem' }}>{comm.name}</h3>
              <p style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.875rem', marginBottom: '1rem' }}>📍 {comm.locality}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', flex: 1, marginBottom: '1.5rem' }}>{comm.description}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Users size={14} /> {comm.memberCount || 1} Members
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => window.location.href = '/report?category=event'}>Organize Event</button>
                  <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Join</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false) }}>
          <div className="modal-content animate-fade-in">
            <h2 style={{ marginBottom: '1.5rem' }}>Create Community Group</h2>
            
            {error && (
              <div style={{ backgroundColor: 'rgba(217, 108, 108, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <AlertCircle size={18} /> <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateCommunity}>
              <div className="input-group">
                <label className="input-label">Group Name</label>
                <input type="text" className="input-field" placeholder="e.g. Downtown Defenders" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Locality / Area</label>
                <input type="text" className="input-field" placeholder="e.g. Bandra West, Mumbai" value={locality} onChange={e => setLocality(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="input-field" rows="3" placeholder="What is this group focused on?" value={description} onChange={e => setDescription(e.target.value)} required />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Communities;
