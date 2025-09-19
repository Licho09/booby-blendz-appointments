import React from 'react';

interface MobileLoadingScreenProps {
  isVisible: boolean;
}

const MobileLoadingScreen: React.FC<MobileLoadingScreenProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      {/* Full Screen Bobby Blendz Image */}
      <img 
        src="/Bobby_Blendz..png" 
        alt="Bobby Blendz" 
        className="w-full h-full object-cover"
      />
      
      {/* Overlay with Loading Circles */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* 4 Loading Circles */}
        <div className="flex space-x-3">
          <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default MobileLoadingScreen;
