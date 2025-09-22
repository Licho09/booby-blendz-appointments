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
    
    // Set body and html class for notch background when loading screen is visible
    if (isVisible) {
      document.body.classList.add('loading-screen');
      document.body.classList.remove('main-app', 'login-screen');
      document.documentElement.classList.add('loading-screen');
      document.documentElement.classList.remove('main-app', 'login-screen');
    } else {
      document.body.classList.remove('loading-screen');
      document.documentElement.classList.remove('loading-screen');
    }
    
    return () => {
      document.body.classList.remove('loading-screen');
      document.documentElement.classList.remove('loading-screen');
    };
  }, [isVisible]);
  
  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center" 
         style={{ 
           backgroundColor: '#5170ff',
           height: '100vh', 
           width: '100vw',
           minHeight: '100vh',
           minHeight: '100dvh',
           position: 'fixed',
           top: 0,
           left: 0,
           right: 0,
           bottom: 0
         }}>
      {/* Full Screen Bobby Blendz Image */}
      <img 
        src="/Agregar un título.png" 
        alt="Bobby Blendz" 
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ 
          width: '100vw', 
          height: '100vh', 
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
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
