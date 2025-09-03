import React from 'react';

interface BarberPoleIconProps {
  className?: string;
}

const BarberPoleIcon: React.FC<BarberPoleIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    {/* Main pole body */}
    <rect x="8" y="3" width="8" height="18" rx="1" fill="#f8f9fa" stroke="#000" strokeWidth="1.5" />
    
    {/* Top cap */}
    <circle cx="12" cy="3" r="2.5" fill="#6c757d" stroke="#000" strokeWidth="1.5" />
    
    {/* Bottom cap */}
    <circle cx="12" cy="21" r="2.5" fill="#6c757d" stroke="#000" strokeWidth="1.5" />
    
    {/* Red stripes - diagonal */}
    <path d="M8 3.5 L15 4.5 L15 6 L8 5 Z" fill="#dc3545" />
    <path d="M8 7.5 L15 8.5 L15 10 L8 9 Z" fill="#dc3545" />
    <path d="M8 11.5 L15 12.5 L15 14 L8 13 Z" fill="#dc3545" />
    <path d="M8 15.5 L15 16.5 L15 18 L8 17 Z" fill="#dc3545" />
    <path d="M8 19.5 L15 20.5 L15 22 L8 21 Z" fill="#dc3545" />
    
    {/* Blue stripes - diagonal */}
    <path d="M8 5 L15 6 L15 7.5 L8 6.5 Z" fill="#007bff" />
    <path d="M8 9 L15 10 L15 11.5 L8 10.5 Z" fill="#007bff" />
    <path d="M8 13 L15 14 L15 15.5 L8 14.5 Z" fill="#007bff" />
    <path d="M8 17 L15 18 L15 19.5 L8 18.5 Z" fill="#007bff" />
    
    {/* White stripes - diagonal */}
    <path d="M8 6.5 L15 7.5 L15 9 L8 8 Z" fill="#ffffff" />
    <path d="M8 10.5 L15 11.5 L15 13 L8 12 Z" fill="#ffffff" />
    <path d="M8 14.5 L15 15.5 L15 17 L8 16 Z" fill="#ffffff" />
    <path d="M8 18.5 L15 19.5 L15 21 L8 20 Z" fill="#ffffff" />
  </svg>
);

export default BarberPoleIcon;
