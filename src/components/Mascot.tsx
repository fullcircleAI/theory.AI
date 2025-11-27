import React from 'react';
import { logger } from '../utils/logger';
import './Mascot.css';

// Define allowed moods
export type MascotMood = 'neutral' | 'happy' | 'sad' | 'excited' | 'thinking';

const mascotImages: Record<MascotMood, string> = {
  neutral: '/images/mascot.png',
  happy: '/images/mascot.png',
  sad: '/images/mascot.png',
  excited: '/images/mascot.png',
  thinking: '/images/mascot.png',
};

export function Mascot({ size = 120, mood = 'neutral' }: { size?: number; mood?: MascotMood }) {
  const [imgError, setImgError] = React.useState(false);
  
  // Pick animation class based on mood - default to bounce for visibility
  let animationClass = 'mascot-img mascot-bounce';
  if (mood === 'sad') animationClass = 'mascot-img mascot-sad';
  if (mood === 'thinking') animationClass = 'mascot-img mascot-thinking';
  if (mood === 'neutral') animationClass = 'mascot-img mascot-wave';

  const handleError = () => {
    logger.error('Failed to load mascot image from:', mascotImages[mood]);
    setImgError(true);
  };

  if (imgError) {
    // Fallback: Show emoji mascot
    return (
      <div className="mascot-spotlight" style={{ width: size + 32, height: size + 32 }}>
        <div 
          style={{ 
            width: size, 
            height: size, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: size * 0.7,
            background: 'linear-gradient(135deg, #002868 0%, #1A3E7A 100%)',
            borderRadius: '50%',
            color: 'white'
          }}
        >
          🎓
        </div>
      </div>
    );
  }

  return (
    <div className="mascot-spotlight" style={{ width: size + 32, height: size + 32 }}>
      <img
        src={mascotImages[mood]}
        alt="Mascot"
        className={animationClass}
        style={{ width: size, height: size, objectFit: 'contain', aspectRatio: '1 / 1', maxWidth: '200px', maxHeight: '200px' }}
        onError={handleError}
        onLoad={() => logger.debug('Mascot image loaded successfully from:', mascotImages[mood])}
      />
    </div>
  );
} 