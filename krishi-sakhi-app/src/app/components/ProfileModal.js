'use client';

import { useState, useEffect } from 'react';

export default function ProfileModal({ plotData, onSave, onClose }) {
  const [formData, setFormData] = useState({
    plotName: '',
    location: '',
    landSize: '',
    irrigationSource: 'Rain-fed',
    crop: '',
    soilType: '',
    soilPH: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    sowingDate: '',
    previousCrop: ''
  });

  useEffect(() => {
    if (plotData) {
      setFormData({
        plotName: plotData.plotName || '',
        location: plotData.location || '',
        landSize: plotData.landSize || '',
        irrigationSource: plotData.irrigationSource || 'Rain-fed',
        crop: plotData.crop || '',
        soilType: plotData.soilType || '',
        soilPH: plotData.soilPH || '',
        nitrogen: plotData.nitrogen || '',
        phosphorus: plotData.phosphorus || '',
        potassium: plotData.potassium || '',
        sowingDate: plotData.sowingDate || '',
        previousCrop: plotData.previousCrop || ''
      });
    }
  }, [plotData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Farm Plot Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plot Name</label>
              <input type="text" name="plotName" value={formData.plotName} onChange={handleChange} placeholder="Plot Name (e.g., North Field)" required className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Location (e.g., Jaipur, Rajasthan)" required className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Land Size</label>
              <input type="text" name="landSize" value={formData.landSize} onChange={handleChange} placeholder="Land Size (e.g., 2.5 Acres)" required className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Irrigation Source</label>
              <select name="irrigationSource" value={formData.irrigationSource} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option value="Rain-fed">Rain-fed</option>
                <option value="Canal">Canal</option>
                <option value="Borewell/Tubewell">Borewell / Tubewell</option>
                <option value="Drip Irrigation">Drip Irrigation</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <h3 className="font-bold text-gray-700">Soil Lab Test Details</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Enter details from your soil report. You can leave these blank if you don&apos;t have them.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Soil Type</label>
                <input type="text" name="soilType" value={formData.soilType} onChange={handleChange} placeholder="Soil Type" className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Soil pH</label>
                <input type="text" name="soilPH" value={formData.soilPH} onChange={handleChange} placeholder="Soil pH (e.g., 7.2)" className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nitrogen (kg/ha)</label>
                <input type="text" name="nitrogen" value={formData.nitrogen} onChange={handleChange} placeholder="Nitrogen" className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phosphorus (kg/ha)</label>
                <input type="text" name="phosphorus" value={formData.phosphorus} onChange={handleChange} placeholder="Phosphorus" className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Potassium (kg/ha)</label>
                <input type="text" name="potassium" value={formData.potassium} onChange={handleChange} placeholder="Potassium" className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-sm" />
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">File upload for reports will be available in a future update.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Crop</label>
              <input type="text" name="crop" value={formData.crop} onChange={handleChange} placeholder="Current Crop (e.g., Bajra)" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              <p className="text-xs text-gray-500 mt-1">Leave blank if you want suggestions on what to grow.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sowing Date</label>
              <input type="date" name="sowingDate" value={formData.sowingDate} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Previous Crop</label>
              <input type="text" name="previousCrop" value={formData.previousCrop} onChange={handleChange} placeholder="Previous Crop (e.g., Fallow)" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Save Plot</button>
          </div>
        </form>
      </div>
    </div>
  );
}