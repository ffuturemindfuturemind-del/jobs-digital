import React, { useState, useRef } from 'react';

interface Card4DProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  maxTilt?: number; // max tilt angle in degrees (default 12)
  glareColor?: string;
}

export const Card4D: React.FC<Card4DProps> = ({
  children,
  className = '',
  onClick,
  maxTilt = 10,
  glareColor = 'rgba(255, 255, 255, 0.15)',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const normX = (x - centerX) / centerX;
    const normY = (y - centerY) / centerY;

    setRotX(-normY * maxTilt);
    setRotY(normX * maxTilt);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.8,
    });
  };

  const handleMouseLeave = () => {
    setRotX(0);
    setRotY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`perspective-1000 transform-style-3d transition-transform duration-200 ease-out cursor-pointer relative select-none ${className}`}
      style={{
        transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1, 1, 1)`,
      }}
    >
      {/* Dynamic Specular Shimmer Layer */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 z-20"
        style={{
          opacity: glarePos.opacity,
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, ${glareColor}, transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
};
