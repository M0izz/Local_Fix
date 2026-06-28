import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UploadCloud, AlertCircle, CheckCircle, MapPin, Loader2 } from 'lucide-react';
import { analyzeIssueImage, checkDuplicates } from '../services/gemini';
import { db, storage } from '../config/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { awardCivicPoints } from '../services/userService';

function ReportIssue({ user }) {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const queryParams = new URLSearchParams(routerLocation.search);
  const initialCategory = queryParams.get('category') === 'event' ? 'Community Event' : 'Other';
  
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [location, setLocation] = useState(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [needsManualInput, setNeedsManualInput] = useState(false);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [severity, setSeverity] = useState(1);
  const [description, setDescription] = useState('');
  
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      
      // Auto-trigger AI analysis
      setIsAnalyzing(true);
      setError(null);
      setNeedsManualInput(false);
      
      const result = await analyzeIssueImage(selectedFile);
      setIsAnalyzing(false);
      
      if (result.success && result.data) {
        setAiData(result.data);
        setTitle(result.data.title || '');
        setCategory(result.data.category || 'Other');
        setSeverity(result.data.severity || 1);
      } else {
        // Fallback UI
        setNeedsManualInput(true);
        setError("AI couldn't clearly categorize this image. Please fill in the details manually.");
      }
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          setError("Failed to get location. Please enable location services.");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  // Run duplicate check before final submit
  const handlePreSubmit = async (e) => {
    e.preventDefault();
    if (!file || !location || !title) {
      setError("Please provide an image, title, and location.");
      return;
    }

    setIsCheckingDuplicates(true);
    
    // 1. Fetch recent nearby issues from Firestore (mocking geographic query for MVP)
    // In production, use GeoFire or geohashes. Here we just fetch recent active issues.
    let recentIssues = [];
    try {
      const q = query(collection(db, "issues"), where("status", "in", ["reported", "in_progress"]));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        recentIssues.push({ id: doc.id, ...doc.data() });
      });
      
      // Basic distance filter (rough approximation, ~5km)
      const nearby = recentIssues.filter(issue => {
        if (!issue.location) return false;
        const latDiff = Math.abs(issue.location.lat - location.lat);
        const lngDiff = Math.abs(issue.location.lng - location.lng);
        return latDiff < 0.05 && lngDiff < 0.05;
      });

      if (nearby.length > 0) {
        const dupResult = await checkDuplicates(file, description || title, nearby);
        if (dupResult.isDuplicate && dupResult.confidence > 75) {
          setDuplicateWarning({
            ...dupResult,
            matchedIssue: nearby.find(i => i.id === dupResult.duplicateOfId)
          });
          setIsCheckingDuplicates(false);
          return; // Stop submission
        }
      }
    } catch (err) {
      console.error("Duplicate check failed, proceeding anyway", err);
    }

    setIsCheckingDuplicates(false);
    submitFinal();
  };

  const submitFinal = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Upload Image to Firebase Storage
      const storageRef = ref(storage, `issues/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      // 2. Save to Firestore
      const issueData = {
        title,
        category,
        severity,
        isCritical: severity === 'Critical' || severity === 5,
        description,
        imageUrl,
        location,
        status: 'reported', // reported, in_progress, resolved
        createdAt: serverTimestamp(),
        reporterId: user ? user.uid : 'anonymous',
        upvotes: 0
      };

      await addDoc(collection(db, "issues"), issueData);
      
      if (user && !user.isAnonymous) {
        await awardCivicPoints(user.uid, 10, user.displayName);
      }
      
      // Success, redirect to map
      navigate('/');
    } catch (err) {
      console.error("Submission error:", err);
      setError("Failed to submit issue. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h2>Report a Community Issue</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Help improve your neighborhood by reporting issues. Our AI will help categorize it automatically.
      </p>

      {error && (
        <div style={{ backgroundColor: '#FEE2E2', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {duplicateWarning && (
        <div style={{ backgroundColor: '#FEF3C7', color: 'var(--warning)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 'bold' }}>
            <AlertCircle size={20} />
            Possible Duplicate Detected ({duplicateWarning.confidence}% confidence)
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
            AI Reason: {duplicateWarning.reason}
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>View Existing Map</button>
            <button className="btn btn-primary" onClick={() => { setDuplicateWarning(null); submitFinal(); }}>Submit Anyway</button>
          </div>
        </div>
      )}

      {!duplicateWarning && (
        <form onSubmit={handlePreSubmit}>
          {/* Image Upload Area */}
          <div 
            style={{ 
              border: '2px dashed var(--border)', 
              borderRadius: 'var(--radius-md)', 
              padding: '2rem', 
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '1.5rem',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
            
            {preview ? (
              <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
                <UploadCloud size={48} style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
                <p>Click or tap to upload a photo</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Clear photos help our AI categorize the issue</p>
              </div>
            )}
            
            {isAnalyzing && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                <p style={{ marginTop: '0.5rem', fontWeight: '500' }}>AI Analyzing Image...</p>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="input-group">
            <label className="input-label">Location</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={getLocation}>
                <MapPin size={18} />
                {location ? 'Location Captured' : 'Get Current Location'}
              </button>
            </div>
          </div>

          {/* AI or Manual Details */}
          {(aiData || needsManualInput) && (
            <div style={{ backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              {aiData && !needsManualInput && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', marginBottom: '1rem', fontWeight: '500' }}>
                  <CheckCircle size={18} />
                  AI Categorization Complete
                </div>
              )}
              
              <div className="input-group">
                <label className="input-label">Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Category</label>
                  <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="Pothole">Pothole</option>
                    <option value="Waste">Waste / Trash</option>
                    <option value="Streetlight">Streetlight</option>
                    <option value="Water Leak">Water Leak</option>
                    <option value="Community Event">Community Event (Initiative)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Severity</label>
                  <select 
                    className="input-field" 
                    value={severity} 
                    onChange={e => setSeverity(e.target.value)}
                  >
                    <option value="1">1 - Minor</option>
                    <option value="2">2 - Low</option>
                    <option value="3">3 - Medium</option>
                    <option value="4">4 - High</option>
                    <option value="Critical">Critical Emergency</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Additional Description (Optional)</label>
                <textarea 
                  className="input-field" 
                  rows="3" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Provide any extra context that might be helpful..."
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            disabled={!file || !location || isSubmitting || isCheckingDuplicates || isAnalyzing}
          >
            {isCheckingDuplicates ? 'Checking for Duplicates...' : isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      )}
    </div>
  );
}

export default ReportIssue;
