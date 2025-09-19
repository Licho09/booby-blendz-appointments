import React from 'react';

interface MobileLoadingScreenProps {
  isVisible: boolean;
}

const MobileLoadingScreen: React.FC<MobileLoadingScreenProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Bobby Blendz Logo with Overlay Animations */}
        <div className="relative">
          {/* Main Logo */}
          <img 
            src="/Bobby_Blendz..png" 
            alt="Bobby Blendz" 
            className="w-32 h-32 object-contain"
          />
          
          {/* Rotating Ring Animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-36 h-36 border-4 border-transparent border-t-blue-500 border-r-blue-500 rounded-full animate-spin"></div>
          </div>
          
          {/* Pulsing Dots Around Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-36 h-36">
              {/* Top dot */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              {/* Right dot */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              {/* Bottom dot */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              {/* Left dot */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
            </div>
          </div>
          
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </div>
        
        {/* Loading Text with Typewriter Effect */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 animate-pulse">
            Bobby Blendz
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 animate-bounce">
            Loading your appointments...
          </p>
        </div>
        
        {/* Enhanced Loading Spinner */}
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default MobileLoadingScreen;
