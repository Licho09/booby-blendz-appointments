import React, { useState, useEffect } from 'react';

interface MobileLoadingScreenProps {
  isVisible: boolean;
  isWarmLoad?: boolean; // Whether this is a warm load (app already loaded before)
}

const MobileLoadingScreen: React.FC<MobileLoadingScreenProps> = ({ isVisible, isWarmLoad = false }) => {
  const [shouldShow, setShouldShow] = useState(false);
  
  useEffect(() => {
    // Simply show/hide based on visibility - timing handled by parent
    setShouldShow(isVisible);
  }, [isVisible]);
  
  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-gray-900" 
         style={{ 
           height: '100vh', 
           width: '100vw',
           paddingLeft: 'env(safe-area-inset-left)',
           paddingRight: 'env(safe-area-inset-right)',
           paddingBottom: 'env(safe-area-inset-bottom)'
         }}>
      {/* Full Screen Bobby Blendz Image */}
      <img 
        src="/Agregar un título.png" 
        alt="Bobby Blendz" 
        className="w-full h-full object-contain object-center"
        style={{ width: '100vw', height: '120vh', objectFit: 'contain' }}
      />
      
      {/* Overlay with Loading Circles - Positioned below center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center">
          {/* 4 Loading Circles */}
          <div className="flex space-x-3 mt-8">
            <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
            <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLoadingScreen;
