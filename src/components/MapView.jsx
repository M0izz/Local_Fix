import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import html2canvas from 'html2canvas';
import { collection, onSnapshot, query, where, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ThumbsUp, Camera } from 'lucide-react';
import { awardCivicPoints } from '../services/userService';

// Fix for default leaflet marker icon issue in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const criticalIcon = L.divIcon({
  className: 'pulse-red',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const eventIcon = L.divIcon({
  className: 'event-pin',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Force Leaflet to recalculate the map size after layout is fully rendered
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timeout);
  }, [map]);
  return null;
}

function MapView({ user }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votedIssues, setVotedIssues] = useState(new Set());
  const mapRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "issues"), where("status", "in", ["reported", "in_progress"]));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const issuesData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.location && data.location.lat && data.location.lng) {
          issuesData.push({ id: doc.id, ...data });
        }
      });
      setIssues(issuesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching issues:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpvote = async (issueId) => {
    if (votedIssues.has(issueId)) return;
    try {
      const issueRef = doc(db, "issues", issueId);
      await updateDoc(issueRef, { upvotes: increment(1) });
      setVotedIssues(prev => new Set([...prev, issueId]));
      if (user && !user.isAnonymous) {
        await awardCivicPoints(user.uid, 1, user.displayName);
      }
    } catch (err) {
      console.error("Error upvoting:", err);
    }
  };

  const handleScreenshot = async () => {
    if (mapRef.current) {
      try {
        const canvas = await html2canvas(mapRef.current, { useCORS: true });
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `localfix-map-${Date.now()}.png`;
        link.href = url;
        link.click();
      } catch (err) {
        console.error("Failed to capture screenshot:", err);
      }
    }
  };

  const defaultCenter = issues.length > 0 
    ? [issues[0].location.lat, issues[0].location.lng] 
    : [20.5937, 78.9629];

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', borderRadius: 'inherit', overflow: 'hidden' }}>
      
      {/* Screenshot Button Overlay */}
      <button 
        onClick={handleScreenshot}
        className="btn btn-primary"
        style={{ position: 'absolute', top: '1rem', right: '4rem', zIndex: 1000, padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', boxShadow: 'var(--clay-shadow)' }}
      >
        <Camera size={16} /> Capture Map
      </button>

      <div ref={mapRef} style={{ height: '100%', width: '100%' }}>
        <MapContainer center={defaultCenter} zoom={5} style={{ height: '100%', width: '100%', background: '#E8EDF2' }}>
          <MapResizer />
          {/* Map Layers */}
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street View (OSM)">
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite (Esri)">
              <TileLayer
                attribution='Tiles &copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Terrain (Esri)">
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Issue Clustering */}
          <MarkerClusterGroup chunkedLoading>
            {issues.map(issue => (
              <Marker 
                key={issue.id} 
                position={[issue.location.lat, issue.location.lng]}
                icon={issue.isCritical ? criticalIcon : (issue.category === 'Community Event' ? eventIcon : DefaultIcon)}
              >
                <Popup>
                  <div style={{ maxWidth: '200px' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{issue.title}</h4>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {issue.category} • Severity: {issue.severity}
                    </p>
                    {issue.imageUrl && (
                      <img src={issue.imageUrl} alt="Issue" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.5rem' }} crossOrigin="anonymous" />
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                       <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: issue.status === 'in_progress' ? 'var(--warning)' : 'var(--danger)' }}>
                         {issue.status === 'in_progress' ? 'In Progress' : 'Reported'}
                       </span>
                       <button 
                         className={`upvote-btn ${votedIssues.has(issue.id) ? 'voted' : ''}`}
                         onClick={() => handleUpvote(issue.id)}
                         style={{ padding: '0.1rem 0.25rem', border: '1px solid var(--border)', background: 'var(--surface)' }}
                       >
                         <ThumbsUp size={12} /> {issue.upvotes || 0}
                       </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
}

export default MapView;
