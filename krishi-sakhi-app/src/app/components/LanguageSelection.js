'use client';

import { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function LanguageSelection({ user, onComplete }) {
    const [loading, setLoading] = useState(false);

    const selectLanguage = async (lang) => {
        setLoading(true);
        const userDocRef = doc(db, "users", user.uid);
        try {
            await setDoc(userDocRef, { language: lang }, { merge: true });
            onComplete(); // Signal to the AuthWrapper that language is set.
        } catch (error) {
            console.error("Error saving language:", error);
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 text-center bg-white rounded-2xl shadow-lg">
                <i className="fas fa-language text-5xl text-green-500 mb-4"></i>
                <h1 className="text-2xl font-bold text-gray-800">Choose Your Language</h1>
                <p className="text-gray-600 mt-2 mb-8">Select your preferred language to continue.</p>
                <div className="space-y-4">
                    <button onClick={() => selectLanguage('en')} disabled={loading} className="w-full px-4 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400">
                        English
                    </button>
                    <button onClick={() => selectLanguage('hi')} disabled={loading} className="w-full px-4 py-3 font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300">
                        हिंदी (Hindi)
                    </button>
                    <button onClick={() => selectLanguage('ml')} disabled={loading} className="w-full px-4 py-3 font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300">
                        മലയാളം (Malayalam)
                    </button>
                </div>
            </div>
        </div>
    );
}
