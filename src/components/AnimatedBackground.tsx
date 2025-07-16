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
        'rgba(59, 130, 246, 0.1)', // blue
        'rgba(168, 85, 247, 0.1)', // purple
        'rgba(59, 130, 246, 0.15)', // blue slightly more opaque
        'rgba(168, 85, 247, 0.15)', // purple slightly more opaque
        'rgba(139, 92, 246, 0.1)', // violet
        'rgba(79, 70, 229, 0.1)', // indigo
      ];

      for (let i = 0; i < numberOfCircles; i++) {
        circles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 100 + 20,
          dx: (Math.random() - 0.5) * 0.5,
          dy: (Math.random() - 0.5) * 0.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: Math.random() * 0.3 + 0.1,
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

        // Draw circle
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = circle.color;
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
      style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}
    />
  );
};

export default AnimatedBackground;