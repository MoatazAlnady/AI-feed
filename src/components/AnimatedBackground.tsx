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
      const numberOfCircles = Math.floor((window.innerWidth * window.innerHeight) / 15000);
      
      const colors = [
        'rgba(59, 130, 246, 0.25)', // blue much more visible
        'rgba(168, 85, 247, 0.25)', // purple much more visible  
        'rgba(59, 130, 246, 0.3)', // blue even more visible
        'rgba(168, 85, 247, 0.3)', // purple even more visible
        'rgba(139, 92, 246, 0.28)', // violet
        'rgba(79, 70, 229, 0.28)', // indigo
        'rgba(147, 51, 234, 0.25)', // purple variant
        'rgba(37, 99, 235, 0.25)', // blue variant
      ];

      for (let i = 0; i < numberOfCircles; i++) {
        circles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 120 + 40, // Larger circles
          dx: (Math.random() - 0.5) * 0.8, // Slightly faster movement
          dy: (Math.random() - 0.5) * 0.8,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: Math.random() * 0.4 + 0.2, // More visible
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

        // Draw circle with glow effect
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        
        // Create gradient for glow effect
        const gradient = ctx.createRadialGradient(
          circle.x, circle.y, 0,
          circle.x, circle.y, circle.radius
        );
        gradient.addColorStop(0, circle.color.replace(/0\.\d+/, '0.4')); // Center more opaque
        gradient.addColorStop(1, circle.color.replace(/0\.\d+/, '0.05')); // Edge less opaque
        
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
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
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
      style={{ background: 'linear-gradient(135deg, hsl(221 83% 53% / 0.08) 0%, hsl(262 83% 58% / 0.12) 50%, hsl(221 83% 53% / 0.06) 100%)' }}
    />
  );
};

export default AnimatedBackground;