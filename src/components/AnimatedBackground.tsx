import React, { useEffect, useRef } from 'react';

interface Circle {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  color: string;
  opacity: number;
}

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const circlesRef = useRef<Circle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createCircles = () => {
      const circles: Circle[] = [];
      const numberOfCircles = Math.floor((window.innerWidth * window.innerHeight) / 12000);
      
      // Using direct hex colors for better visibility
      const colors = [
        '#3B82F6', // blue
        '#A855F7', // purple
        '#8B5CF6', // violet
        '#6366F1', // indigo
        '#3B82F6', // blue
        '#A855F7', // purple
      ];

      for (let i = 0; i < numberOfCircles; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        circles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 150 + 50, // Larger circles
          dx: (Math.random() - 0.5) * 1, // Faster movement
          dy: (Math.random() - 0.5) * 1,
          color: color,
          opacity: Math.random() * 0.3 + 0.1, // More visible
        });
      }
      
      circlesRef.current = circles;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      circlesRef.current.forEach((circle) => {
        // Update position
        circle.x += circle.dx;
        circle.y += circle.dy;

        // Bounce off edges
        if (circle.x + circle.radius > canvas.width || circle.x - circle.radius < 0) {
          circle.dx = -circle.dx;
        }
        if (circle.y + circle.radius > canvas.height || circle.y - circle.radius < 0) {
          circle.dy = -circle.dy;
        }

        // Create gradient for glow effect
        const gradient = ctx.createRadialGradient(
          circle.x, circle.y, 0,
          circle.x, circle.y, circle.radius
        );
        
        // Convert hex to rgba for gradient
        const rgb = hexToRgb(circle.color);
        if (rgb) {
          gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${circle.opacity * 0.6})`);
          gradient.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${circle.opacity * 0.3})`);
          gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        }
        
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Helper function to convert hex to rgb
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    resizeCanvas();
    createCircles();
    animate();

    const handleResize = () => {
      resizeCanvas();
      createCircles();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Background gradient */}
      <div 
        className="fixed top-0 left-0 w-full h-full -z-20"
        style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 30%, #ddd6fe 70%, #f8fafc 100%)' 
        }}
      />
      {/* Animated circles */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
      />
    </>
  );
};

export default AnimatedBackground;