'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Signup from './Signup';
import Chat from './Chat';
import LanguageSelection from './LanguageSelection'; // Import new component

export default function AuthWrapper() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check for user profile to get language setting
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().language) {
          setUserProfile(userDoc.data());
        } else {
          setUserProfile(null); // No profile or language set
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const handleLanguageSet = async () => {
    // Re-fetch the profile after language is set
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    setUserProfile(userDoc.data());
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100">Loading Krishi Sakhi...</div>;
  }

  if (!user) {
    return <Signup />;
  }

  // If user is logged in but has not selected a language, show language selection screen
  if (user && !userProfile?.language) {
      return <LanguageSelection user={user} onComplete={handleLanguageSet} />;
  }

  // Once language is set, Chat component will handle the rest (onboarding, etc.)
  return <Chat user={user} />;
}

