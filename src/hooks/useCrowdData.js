import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export const useCrowdData = () => {
  const [data, setData] = useState({
    zones: [],
    gates: [],
    alerts: [],
    coordinates: []
  });

  useEffect(() => {
    // In a real app we'd listen to specific documents. 
    // Here we assume a single "current_state" document inside "crowd_data" collection is updated.
    const unsubscribe = onSnapshot(collection(db, "crowd_data"), (snapshot) => {
        if (!snapshot.empty) {
            // Assume the first document contains the full state for demo purposes.
            // A more robust structure would parse appropriately.
            const docData = snapshot.docs[0].data();
            if (docData) {
              setData(docData);
            }
        }
    });

    return () => unsubscribe();
  }, []);

  return data;
};
