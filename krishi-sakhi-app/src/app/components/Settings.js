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

  const clearCache = async () => {
    if (window.confirm(t.clearCacheConfirm || "Are you sure you want to clear the cache?")) {
      try {
        // Clear service worker cache
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        }
        
        // Clear localStorage (optional)
        // localStorage.clear();
        
        // Clear sessionStorage (optional)
        // sessionStorage.clear();
        
        alert(t.cacheCleared || "Cache cleared successfully!");
        
        // Reload the page to ensure clean state
        window.location.reload();
      } catch (error) {
        console.error('Error clearing cache:', error);
        alert("Error clearing cache. Please try again.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Network Status Indicator */}
        {networkStatus === 'offline' && (
          <div className="bg-yellow-500 py-1 text-center text-sm text-white">
            <i className="fas fa-wifi-slash mr-2"></i> {t.offlineMode || "Offline Mode"}
          </div>
        )}
        
        <header className="flex items-center border-b bg-gray-50 p-4 shrink-0">
          <button onClick={onClose} className="mr-4 text-gray-600 hover:text-gray-900">
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{t.settingsTitle || "Settings"}</h1>
        </header>
        
        <div className="flex-1 space-y-6 overflow-y-auto bg-gray-50 p-4">
          {/* User Profile Section */}
          <div className="rounded-xl border bg-white p-4 shadow-md">
            <h2 className="mb-3 text-lg font-bold text-green-700">{t.yourProfile || "Your Profile"}</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="text-gray-700">
                  <strong className="text-gray-600">{t.name || "Name"}:</strong> {userProfile?.name}
                </p>
                <button onClick={handleNameChange} className="text-xs font-semibold text-blue-600 hover:underline">{t.change || "Change"}</button>
              </div>
              <p className="text-gray-700">
                <strong className="text-gray-600">{t.email || "Email"}:</strong> {user.email}
              </p>

              <div>
                <label 
                  htmlFor="lang-select" 
                  className="mb-1 block font-bold text-gray-600"
                >
                  {t.appLang || "App Language"}
                </label>
                <select 
                  id="lang-select" 
                  value={userProfile?.language || 'en'} 
                  onChange={handleLangChange} 
                  className="w-full rounded-md border bg-gray-50 p-2 text-gray-700"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="ml">Malayalam (മലയാളം)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Farm Plots Section */}
          <div className="rounded-xl border bg-white p-4 shadow-md">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-green-700">{t.yourPlots || "Your Plots"}</h2>
              <button 
                onClick={onAddNewPlot} 
                className="rounded-lg bg-green-600 px-3 py-1 text-xs text-white shadow hover:bg-green-700"
              >
                <i className="fas fa-plus mr-1"></i> {t.addNew || "Add New"}
              </button>
            </div>
            <div className="space-y-3">
              {plots.length > 0 ? plots.map(plot => (
                <div key={plot.id} className="flex items-center justify-between rounded-md border bg-gray-50 p-3">
                  <div>
                    <p className="font-semibold text-gray-800">{plot.plotName}</p>
                    <p className="text-xs text-gray-500">{plot.location} • {plot.landSize} • {plot.crop || t.noCrop || "No crop set"}</p>
                  </div>
                  <button onClick={() => onEditPlot(plot)} className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-colors flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {t.editPlot || "Edit"}
                  </button>
                </div>
              )) : (
                <p className="py-4 text-center text-sm text-gray-500">{t.noPlots || "No plots added yet"}</p>
              )}
            </div>
          </div>
          
          {/* PWA Settings Section */}
          <div className="rounded-xl border bg-white p-4 shadow-md">
            <h2 className="mb-3 text-lg font-bold text-green-700">{t.appSettings || "App Settings"}</h2>
            <div className="space-y-3">
              {storageUsage && (
                <div className="rounded-md border bg-gray-50 p-3">
                  <p className="font-semibold text-gray-800">{t.storageUsage || "Storage Usage"}</p>
                  <p className="text-sm text-gray-600">{t.storageUsed || "Storage used"}: {storageUsage.used} MB / {storageUsage.quota} MB</p>
                </div>
              )}
              <div className="rounded-md border bg-gray-50 p-3">
                <p className="font-semibold text-gray-800">{t.clearCache || "Clear Cache"}</p>
                <p className="mb-2 text-sm text-gray-600">{t.clearCacheDesc || "Clear cached data to free up space"}</p>
                <button 
                  onClick={clearCache} 
                  className="rounded-lg bg-yellow-500 px-3 py-1 text-xs text-white hover:bg-yellow-600"
                >
                  {t.clearCacheButton || "Clear Cache"}
                </button>
              </div>
              <div className="rounded-md border bg-gray-50 p-3">
                <p className="font-semibold text-gray-800">{t.networkStatus || "Network Status"}</p>
                <p className="text-sm text-gray-600">
                  {networkStatus === 'online' ? (
                    <span className="text-green-600"><i className="fas fa-wifi mr-1"></i> {t.online || "Online"}</span>
                  ) : (
                    <span className="text-yellow-600"><i className="fas fa-wifi-slash mr-1"></i> {t.offline || "Offline"}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* Helpline Section */}
          <div className="rounded-xl border bg-white p-4 shadow-md">
            <h2 className="mb-3 text-lg font-bold text-green-700">{t.helplineTitle || "Helpline"}</h2>
            <div className="space-y-3">
                <div className="rounded-md border bg-gray-50 p-3">
                    <p className="font-semibold text-gray-800">{t.kcc || "Kisan Call Center"}</p>
                    <p className="text-sm text-gray-600">{t.kccDesc || "Get expert advice on farming issues"}</p>
                    <a href="tel:18001801551" className="text-lg font-bold text-blue-600">{t.kccNumber || "1800-180-1551"}</a>
                </div>
                 <div className="rounded-md border bg-gray-50 p-3">
                    <p className="font-semibold text-gray-800">{t.localOfficer || "Local Agriculture Officer"}</p>
                    <p className="text-sm text-gray-600">{t.localOfficerDesc || "Contact your local agriculture office for assistance"}</p>
                </div>
            </div>
          </div>

          {/* App Info Section */}
          <div className="rounded-xl border bg-white p-4 shadow-md">
            <h2 className="mb-3 text-lg font-bold text-green-700">{t.appInfo || "App Information"}</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>{t.version || "Version"}:</strong> 1.0.0</p>
              <p><strong>{t.pwaStatus || "PWA Status"}:</strong> {window.matchMedia('(display-mode: standalone)').matches ? t.installed || "Installed" : t.notInstalled || "Not Installed"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}