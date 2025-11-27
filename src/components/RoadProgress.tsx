import React, { memo } from 'react';
import './RoadProgress.css';

interface RoadProgressProps {
  progress: number; // 0-100
  label?: string;
  showLabel?: boolean;
}

export const RoadProgress: React.FC<RoadProgressProps> = memo(({ 
  progress, 
  label = 'Progress',
  showLabel = true 
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  // Memoize car position calculation to prevent recalculation on every render
  const carPosition = React.useMemo(() => {
    // Calculate car position (center of emoji at progress percentage)
    // Emoji is 64px wide (doubled size), so we offset by half (32px) to center it
    // When progress is 0%, car starts at left edge
    // When progress is 100%, car crosses the finish line at right edge
    return clampedProgress === 0 
      ? '0px' // Start fully visible at left edge
      : clampedProgress === 100
      ? 'calc(100% - 32px)' // Center car at finish line (half emoji width from right edge)
      : `calc(${clampedProgress}% - 32px)`; // Center car at progress point
  }, [clampedProgress]);

  return (
    <div className="road-progress-container">
      {showLabel && label && (
        <div className="road-progress-label">{label}</div>
      )}
      <div className="road-progress-wrapper">
        {/* Road Background */}
        <div className="road-surface">
          {/* Lane Markings - Static dashed lines */}
          <div className="road-lane-markings"></div>
          
          {/* Road Edges */}
          <div className="road-edge road-edge-left"></div>
          <div className="road-edge road-edge-right"></div>
          
          {/* Formula One Finish Line - Checkered Flag Pattern */}
          <div className="f1-finish-line"></div>
          
          {/* Animated Red Race Car Emoji */}
          <div 
            className="road-car f1-race-car"
            style={{
              left: carPosition,
            }}
          >
            <span className="race-car-emoji">🏎️</span>
          </div>
          
          {/* Progress Fill (optional - shows completed road) */}
          <div 
            className="road-progress-fill"
            style={{
              width: `${clampedProgress}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
});

