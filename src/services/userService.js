import { doc, setDoc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Helper to award points to a user. Creates the user doc if it doesn't exist.
export const awardCivicPoints = async (uid, points, displayName = 'Anonymous Citizen') => {
  if (!uid) return;
  
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        civicPoints: increment(points),
        lastActive: serverTimestamp()
      });
    } else {
      await setDoc(userRef, {
        uid,
        displayName,
        civicPoints: points,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Failed to award civic points:", error);
  }
};
