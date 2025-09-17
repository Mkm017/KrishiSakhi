'use client';

import React from 'react';
import { uiStrings } from '../lib/i18n';

export default function Dashboard({ user, userProfile, plots, activePlot, onEditPlot }) {
  const t = uiStrings[userProfile?.language] || uiStrings.en;

  const getRealTimeContext = (location) => {
    const isJaipur = /jaipur/i.test(location || '');
    return {
      location: location || "your area",
      weather: `Sunny with clear skies. High of 34°C. Low of 22°C.`,
      alert: isJaipur ? `Moderate white grub activity reported in the Jaipur region. Monitor root health.` : "No major pest alerts for your region.",
      mandiPrices: isJaipur ? [
          { crop: "Bajra (Pearl Millet)", price: "₹2,350 / quintal" },
          { crop: "Moong (Green Gram)", price: "₹7,800 / quintal" },
      ] : [
          { crop: "Wheat", price: "₹2,125 / quintal" },
          { crop: "Mustard", price: "₹5,450 / quintal" },
      ],
      scheme: "The state government has announced a 50% subsidy on drip irrigation systems. Last date to apply is Oct 31st."
    };
  };
  
  const realTimeContext = getRealTimeContext(plots[0]?.location);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-transparent">
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-green-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{t.welcome(user?.displayName)}</h1>
        <p className="text-gray-500">{t.farmSummary}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-lg border border-green-100">
             <div className="flex items-center mb-3">
               <div className="bg-blue-100 p-2 rounded-lg mr-3">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                 </svg>
               </div>
               <h3 className="font-bold text-lg text-gray-800">{t.weatherIn(realTimeContext.location)}</h3>
             </div>
             <p className="text-gray-700 text-sm pl-11">{realTimeContext.weather}</p>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-lg border border-green-100">
             <div className="flex items-center mb-3">
               <div className="bg-amber-100 p-2 rounded-lg mr-3">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                 </svg>
               </div>
               <h3 className="font-bold text-lg text-gray-800">{t.localAlert}</h3>
             </div>
             <p className="text-gray-700 text-sm pl-11">{realTimeContext.alert}</p>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-lg border border-green-100">
             <div className="flex items-center mb-3">
               <div className="bg-green-100 p-2 rounded-lg mr-3">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </div>
               <h3 className="font-bold text-lg text-gray-800">{t.mandiPrices}</h3>
             </div>
             <ul className="space-y-2 text-sm pl-11">
                {realTimeContext.mandiPrices.map(item => (
                    <li key={item.crop} className="flex justify-between">
                        <span className="text-gray-600">{item.crop}:</span>
                        <span className="font-semibold text-gray-800">{item.price}</span>
                    </li>
                ))}
             </ul>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-lg border border-green-100">
             <div className="flex items-center mb-3">
               <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                 </svg>
               </div>
               <h3 className="font-bold text-lg text-gray-800">{t.govtSchemes}</h3>
             </div>
             <p className="text-gray-700 text-sm pl-11">{realTimeContext.scheme}</p>
          </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-lg border border-green-100">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">{t.yourPlots}</h2>
            <button onClick={() => onEditPlot(null)} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 shadow-md flex items-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t.addNew}
            </button>
        </div>
        <div className="space-y-4">
          {plots.length > 0 ? plots.map(plot => (
            <div key={plot.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-green-300 transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{plot.plotName}</p>
                    <p className="text-sm text-gray-600">{plot.crop || 'Crop not set'} • {plot.landSize || 'Size not set'}</p>
                  </div>
                </div>
                <button onClick={() => onEditPlot(plot)} className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {t.editPlot}
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
                <p className="text-gray-500 mb-4">{t.noPlots}</p>
                <button onClick={() => onEditPlot(null)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    {t.createFirstPlot}
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}