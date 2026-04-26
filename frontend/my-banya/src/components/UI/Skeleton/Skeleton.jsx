// src/components/UI/Skeleton/Skeleton.jsx
import React from 'react';

function Skeleton({ className = '', variant = 'text', width = '100%', height, circle = false }) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]';
  const animationClass = 'animate-[shimmer_1.5s_infinite]';
  
  const variantClasses = {
    text: 'h-4',
    title: 'h-6',
    subtitle: 'h-5',
    card: 'h-32',
    button: 'h-10',
    avatar: 'h-10 w-10',
    thumbnail: 'h-20 w-20',
    table: 'h-12',
    'title-lg': 'h-8',
    'text-sm': 'h-3',
  };

  const shapeClass = circle ? 'rounded-full' : 'rounded';
  const heightClass = height || variantClasses[variant] || variantClasses.text;

  return (
    <div
      className={`${baseClasses} ${animationClass} ${heightClass} ${shapeClass} ${className}`}
      style={{ width }}
    />
  );
}

// Subcomponents for convenience
Skeleton.Text = ({ className = '', width = '100%' }) => (
  <Skeleton variant="text" className={className} width={width} />
);

Skeleton.TextSm = ({ className = '', width = '100%' }) => (
  <Skeleton variant="text-sm" className={className} width={width} />
);

Skeleton.Title = ({ className = '', width = '100%' }) => (
  <Skeleton variant="title" className={className} width={width} />
);

Skeleton.TitleLg = ({ className = '', width = '100%' }) => (
  <Skeleton variant="title-lg" className={className} width={width} />
);

Skeleton.Subtitle = ({ className = '', width = '100%' }) => (
  <Skeleton variant="subtitle" className={className} width={width} />
);

Skeleton.Card = ({ className = '', width = '100%' }) => (
  <Skeleton variant="card" className={className} width={width} />
);

Skeleton.Button = ({ className = '', width = '120px' }) => (
  <Skeleton variant="button" className={className} width={width} />
);

Skeleton.Avatar = ({ className = '', size = '40px' }) => (
  <Skeleton 
    variant="avatar" 
    className={className} 
    width={size} 
    height={size}
    circle
  />
);

Skeleton.Thumbnail = ({ className = '', width = '80px', height = '80px' }) => (
  <Skeleton 
    variant="thumbnail" 
    className={className} 
    width={width}
    height={height}
  />
);

Skeleton.Table = ({ className = '', width = '100%' }) => (
  <Skeleton variant="table" className={className} width={width} />
);

Skeleton.Circle = ({ className = '', size = '40px' }) => (
  <Skeleton 
    className={className} 
    width={size} 
    height={size}
    circle
  />
);

export default Skeleton;
