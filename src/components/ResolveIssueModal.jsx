import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { verifyResolution } from '../services/gemini';
import { db, storage } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function ResolveIssueModal({ issue, onClose }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setVerificationResult(null);
      setError(null);
    }
  };

  const handleVerify = async () => {
    if (!file) return;
    setIsVerifying(true);
    setError(null);

    try {
      // Fetch the 'before' image as a blob to send to Gemini
      const beforeResponse = await fetch(issue.imageUrl);
      const beforeBlob = await beforeResponse.blob();

      // The selected file is the 'after' image
      const result = await verifyResolution(beforeBlob, file);
      setVerificationResult(result);
    } catch (err) {
      console.error(err);
      setError("Failed to run AI verification.");
    }
    
    setIsVerifying(false);
  };

  const handleFinalize = async () => {
    if (!verificationResult?.isResolved) return;
    setIsUpdating(true);

    try {
      // 1. Upload the 'after' image
      const storageRef = ref(storage, `resolutions/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const afterImageUrl = await getDownloadURL(uploadResult.ref);

      // 2. Update Firestore document
      const issueRef = doc(db, "issues", issue.id);
      await updateDoc(issueRef, {
        status: 'resolved',
        resolutionImageUrl: afterImageUrl,
        resolutionNotes: verificationResult.reason,
        resolvedAt: new Date()
      });

      onClose(); // Close modal on success
    } catch (err) {
      console.error(err);
      setError("Failed to update issue status.");
      setIsUpdating(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in">
        <h2 style={{ marginBottom: '1.5rem' }}>Verify Resolution</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <p className="input-label">Before</p>
            <img src={issue.imageUrl} alt="Before" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
          </div>
          <div>
             <p className="input-label">After (Upload Proof)</p>
             <div 
               style={{ 
                 border: '2px dashed var(--border)', 
                 borderRadius: 'var(--radius-md)', 
                 height: '150px',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 cursor: 'pointer',
                 overflow: 'hidden',
                 position: 'relative'
               }}
               onClick={() => fileInputRef.current.click()}
             >
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                {preview ? (
                  <img src={preview} alt="After Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UploadCloud size={24} color="var(--text-muted)" />
                )}
             </div>
          </div>
        </div>

        {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}

        {verificationResult && (
          <div style={{ 
            backgroundColor: verificationResult.isResolved ? '#D1FAE5' : '#FEE2E2', 
            color: verificationResult.isResolved ? 'var(--secondary)' : 'var(--danger)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
              {verificationResult.isResolved ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              AI Verdict: {verificationResult.isResolved ? 'Resolved' : 'Not Resolved'} ({verificationResult.confidence}% confidence)
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>{verificationResult.reason}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={isVerifying || isUpdating}>Cancel</button>
          
          {!verificationResult ? (
             <button className="btn btn-primary" onClick={handleVerify} disabled={!file || isVerifying}>
               {isVerifying ? <><Loader2 className="animate-spin" size={16} /> Verifying...</> : 'Run AI Verification'}
             </button>
          ) : (
             <>
               <button 
                 className="btn btn-primary" 
                 onClick={handleFinalize} 
                 disabled={isUpdating}
               >
                 {isUpdating ? 'Updating...' : (verificationResult.isResolved ? 'Confirm Resolution' : 'Override: Mark Resolved Anyway')}
               </button>
             </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResolveIssueModal;
