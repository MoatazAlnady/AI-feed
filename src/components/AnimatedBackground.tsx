import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <>
      {/* Light mode: use theme background */}
      <div 
        className="fixed top-0 left-0 w-full h-full -z-20 dark:hidden"
        style={{ background: 'hsl(var(--background))' }}
      />
      {/* Dark mode: match the logged-in dark gradient */}
      <div 
        className="fixed top-0 left-0 w-full h-full -z-20 hidden dark:block"
        style={{ 
          background: 'radial-gradient(circle at 10% 20%, #0b1120 0%, #131c3a 40%, #1c263f 75%)' 
        }}
      />
    </>
  );
};

export default AnimatedBackground;
