'use client';

import { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [isLoginView, setIsLoginView] = useState(true);

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // We only create the main user document here. Language/Plot details are handled after login.
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: user.email,
        // Language will be set in the next step
      });
    } catch (error) {
      setError(error.message);
    }
  };
  
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                name: user.displayName,
                email: user.email,
            });
        }
    } catch (error) {
        setError(error.message);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-cyan-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <div className="flex flex-col items-center space-y-2">
  <div className="bg-green-600/20 p-3 rounded-full shadow-md">
    <i className="fas fa-seedling text-3xl text-green-600"></i>
  </div>
  <h1 className="text-3xl font-extrabold tracking-wide text-green-800 drop-shadow-sm">
    Krishi <span className="text-yellow-400">Sakhi</span>
  </h1>
  <p className="text-gray-500 text-sm">{isLoginView ? 'Welcome back!' : 'Your Personal AI Farming Assistant'}</p>
</div>

        
        <button
  onClick={handleGoogleSignIn}
  className="w-full flex items-center justify-center py-3 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition-colors text-gray-800 font-medium"
>
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
    <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
    <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
    <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
  <span>Continue with Google</span>
</button>


        <div className="flex items-center">
            <hr className="flex-grow border-t border-gray-200"/>
            <span className="px-3 text-sm text-gray-400">OR</span>
            <hr className="flex-grow border-t border-gray-200"/>
        </div>

        <form onSubmit={isLoginView ? handleEmailLogin : handleEmailSignup} className="space-y-4">
          {!isLoginView && (
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" required className="w-full px-4 py-3 bg-gray-50 border rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" required className="w-full px-4 py-3 bg-gray-50 border rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 bg-gray-50 border rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
          
          <button type="submit" className="w-full px-4 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
            {isLoginView ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-center text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
        
        <div className="text-center text-sm">
            <p className="text-gray-600">
                {isLoginView ? "Don't have an account? " : "Already have an account? "}
                <button type="button" onClick={() => setIsLoginView(!isLoginView)} className="font-medium text-green-600 hover:underline">
                    {isLoginView ? 'Sign Up' : 'Log In'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
}

