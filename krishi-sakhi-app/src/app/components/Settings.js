'use client';

import React, { useState, useEffect } from 'react';
import { uiStrings } from '../lib/i18n';

export default function SettingsModal({ user, userProfile, onUpdateUser, plots, onEditPlot, onAddNewPlot, onClose }) {
  const t = uiStrings[userProfile?.language] || uiStrings.en;
  const [networkStatus, setNetworkStatus] = useState('online');
  const [storageUsage, setStorageUsage] = useState(null);

  // Network Status Detection
  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calculate storage usage (for PWA)
  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        const used = estimate.usage ? (estimate.usage / 1024 / 1024).toFixed(2) : 'N/A';
        const quota = estimate.quota ? (estimate.quota / 1024 / 1024).toFixed(2) : 'N/A';
        setStorageUsage({ used, quota });
      });
    }
  }, []);

  const handleNameChange = () => {
    const newName = prompt("Enter your new name:", userProfile.name);
    if (newName && newName.trim() !== "") {
      onUpdateUser({ name: newName });
    }
  };

  const handleLangChange = (e) => {
    onUpdateUser({ language: e.target.value });
  };

  const clearCache = () => {
    if (caches && window.confirm(t.clearCacheConfirm)) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
        alert(t.cacheCleared);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <div className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Network Status Indicator */}
        {networkStatus === 'offline' && (
          <div className="bg-yellow-500 py-1 text-center text-sm text-white">
            <i className="fas fa-wifi-slash mr-2"></i> {t.offlineMode}
          </div>
        )}
        
        <header className="flex items-center border-b bg-gray-50 p-3 sm:p-4 shrink-0">
          <button onClick={onClose} className="mr-3 sm:mr-4 text-gray-600 hover:text-gray-900">
            <i className="fas fa-arrow-left text-lg sm:text-xl"></i>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t.settingsTitle}</h1>
        </header>
        
        <div className="flex-1 space-y-4 sm:space-y-6 overflow-y-auto bg-gray-50 p-3 sm:p-4">
          {/* User Profile Section */}
          <div className="rounded-xl border bg-white p-3 sm:p-4 shadow-md">
            <h2 className="mb-2 sm:mb-3 text-base sm:text-lg font-bold text-green-700">{t.yourProfile}</h2>
            <div className="space-y-3 sm:space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="text-gray-700">
                  <strong className="text-gray-600">{t.name}:</strong> {userProfile?.name}
                </p>
                <button onClick={handleNameChange} className="text-xs font-semibold text-blue-600 hover:underline ml-2 whitespace-nowrap">{t.change}</button>
              </div>
              <p className="text-gray-700">
                <strong className="text-gray-600">{t.email}:</strong> {user.email}
              </p>

              <div>
                <label 
                  htmlFor="lang-select" 
                  className="mb-1 block font-bold text-gray-600"
                >
                  {t.appLang}
                </label>
                <select 
                  id="lang-select" 
                  value={userProfile?.language || 'en'} 
                  onChange={handleLangChange} 
                  className="w-full rounded-md border bg-gray-50 p-2 text-sm sm:text-base text-gray-700"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="ml">Malayalam (മലയാളം)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Farm Plots Section */}
          <div className="rounded-xl border bg-white p-3 sm:p-4 shadow-md">
            <div className="mb-2 sm:mb-3 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-green-700">{t.yourPlots}</h2>
              <button 
                onClick={onAddNewPlot} 
                className="rounded-lg bg-green-600 px-2 py-1 text-xs text-white shadow hover:bg-green-700 whitespace-nowrap"
              >
                <i className="fas fa-plus mr-1"></i> {t.addNew}
              </button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {plots.length > 0 ? plots.map(plot => (
                <div key={plot.id} className="flex items-center justify-between rounded-md border bg-gray-50 p-2 sm:p-3">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-semibold text-gray-800 truncate">{plot.plotName}</p>
                    <p className="text-xs text-gray-500 truncate">{plot.location} • {plot.landSize} • {plot.crop || t.noCrop}</p>
                  </div>
                  <button onClick={() => onEditPlot(plot)} className="px-2 py-1 sm:px-3 sm:py-1.5 bg-green-100 text-green-700 text-xs sm:text-sm rounded-lg hover:bg-green-200 transition-colors flex items-center whitespace-nowrap flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {t.editPlot}
                  </button>
                </div>
              )) : (
                <p className="py-3 sm:py-4 text-center text-sm text-gray-500">{t.noPlots}</p>
              )}
            </div>
          </div>
          
          {/* PWA Settings Section */}
          <div className="rounded-xl border bg-white p-3 sm:p-4 shadow-md">
            <h2 className="mb-2 sm:mb-3 text-base sm:text-lg font-bold text-green-700">{t.appSettings}</h2>
            <div className="space-y-2 sm:space-y-3">
              {storageUsage && (
                <div className="rounded-md border bg-gray-50 p-2 sm:p-3">
                  <p className="font-semibold text-gray-800 text-sm sm:text-base">{t.storageUsage}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{t.storageUsed}: {storageUsage.used} MB / {storageUsage.quota} MB</p>
                </div>
              )}
              <div className="rounded-md border bg-gray-50 p-2 sm:p-3">
                <p className="font-semibold text-gray-800 text-sm sm:text-base">{t.clearCache}</p>
                <p className="mb-2 text-xs sm:text-sm text-gray-600">{t.clearCacheDesc}</p>
                <button 
                  onClick={clearCache} 
                  className="rounded-lg bg-yellow-500 px-2 py-1 text-xs text-white hover:bg-yellow-600"
                >
                  {t.clearCacheButton}
                </button>
              </div>
              <div className="rounded-md border bg-gray-50 p-2 sm:p-3">
                <p className="font-semibold text-gray-800 text-sm sm:text-base">{t.networkStatus}</p>
                <p className="text-xs sm:text-sm text-gray-600">
                  {networkStatus === 'online' ? (
                    <span className="text-green-600"><i className="fas fa-wifi mr-1"></i> {t.online}</span>
                  ) : (
                    <span className="text-yellow-600"><i className="fas fa-wifi-slash mr-1"></i> {t.offline}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* Helpline Section */}
          <div className="rounded-xl border bg-white p-3 sm:p-4 shadow-md">
            <h2 className="mb-2 sm:mb-3 text-base sm:text-lg font-bold text-green-700">{t.helplineTitle}</h2>
            <div className="space-y-2 sm:space-y-3">
                <div className="rounded-md border bg-gray-50 p-2 sm:p-3">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">{t.kcc}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{t.kccDesc}</p>
                    <a href="tel:18001801551" className="text-sm sm:text-lg font-bold text-blue-600 block mt-1">{t.kccNumber}</a>
                </div>
                 <div className="rounded-md border bg-gray-50 p-2 sm:p-3">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">{t.localOfficer}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{t.localOfficerDesc}</p>
                </div>
            </div>
          </div>

          {/* App Info Section */}
          <div className="rounded-xl border bg-white p-3 sm:p-4 shadow-md">
            <h2 className="mb-2 sm:mb-3 text-base sm:text-lg font-bold text-green-700">{t.appInfo}</h2>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <p><strong>{t.version}:</strong> 1.0.0</p>
              <p><strong>{t.pwaStatus}:</strong> {window.matchMedia('(display-mode: standalone)').matches ? t.installed : t.notInstalled}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}