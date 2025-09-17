'use client';

import { useState } from 'react';

export default function Onboarding({ onComplete }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getLocation = () => {
        setLoading(true);
        setError('');
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // In a real app, you'd use a reverse geocoding API.
                // For this prototype, we'll simulate a user-friendly name.
                const simulatedLocationName = `Jaipur Area (Lat: ${latitude.toFixed(2)})`;
                setLoading(false);
                onComplete(simulatedLocationName);
            },
            () => {
                setError("Unable to retrieve your location. Please grant permission or enter it manually in the next step.");
                setLoading(false);
                // Proceed without location
                setTimeout(() => onComplete(null), 2000);
            }
        );
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 text-center bg-white rounded-2xl shadow-lg">
                <i className="fas fa-map-marked-alt text-5xl text-green-500 mb-4"></i>
                <h1 className="text-2xl font-bold text-gray-800">Welcome to Krishi Sakhi!</h1>
                <p className="text-gray-600 mt-2 mb-6">To provide personalized advice, we need to know your farm&apos;s location.</p>
                <button 
                    onClick={getLocation} 
                    disabled={loading}
                    className="w-full px-4 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
                >
                    {loading ? 'Getting Location...' : 'Get My Location'}
                </button>
                <button 
                    onClick={() => onComplete(null)} 
                    className="mt-4 text-sm text-gray-500 hover:underline"
                >
                    Or enter manually
                </button>
                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            </div>
        </div>
    );
}

