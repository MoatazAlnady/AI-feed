import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <>
      {/* Background gradient for light mode */}
      <div 
        className="fixed top-0 left-0 w-full h-full -z-20 dark:hidden"
        style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 30%, #ddd6fe 70%, #f8fafc 100%)' 
        }}
      />
      {/* Background gradient for dark mode */}
      <div 
        className="fixed top-0 left-0 w-full h-full -z-20 hidden dark:block"
        style={{ 
          background: 'linear-gradient(135deg, #202444 0%, #462560 100%)' 
        }}
      />
    </>
  );
};

export default AnimatedBackground;