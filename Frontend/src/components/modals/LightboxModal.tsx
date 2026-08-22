import React from 'react';
import type { Car } from '../../types';
import { getCarImageUrl, handleImageError } from '../../utils/carImages';

interface LightboxModalProps {
  selectedCar: Car | null;
  showLightbox: boolean;
  zoomScale: number;
  panPosition: { x: number; y: number };
  isDragging: boolean;
  onClose: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onDoubleClick: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onContainerClick: (e: React.MouseEvent) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  selectedCar,
  showLightbox,
  zoomScale,
  panPosition,
  isDragging,
  onClose,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onWheel,
  onDoubleClick,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onTouchStart,
  onTouchMove,
  onContainerClick
}) => {
  if (!showLightbox || !selectedCar) return null;

  return (
    <div className="lightbox-overlay" onClick={onContainerClick}>
      <div className="lightbox-header">
        <button className="lightbox-btn close-btn" onClick={onClose} title="Close (Esc)">
          &times;
        </button>
      </div>

      <div
        className={`lightbox-container ${isDragging ? 'grabbing' : ''}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onMouseUp}
        onWheel={onWheel}
        onClick={onContainerClick}
      >
        <div
          className="lightbox-img-wrapper"
          style={{
            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`
          }}
          onDoubleClick={onDoubleClick}
        >
          <img
            src={getCarImageUrl(selectedCar)}
            alt={`${selectedCar.make} ${selectedCar.model}`}
            onError={handleImageError}
          />
        </div>
      </div>

      <div className="lightbox-controls">
        <button className="lightbox-btn" onClick={onZoomOut} title="Zoom Out" disabled={zoomScale <= 1}>
          ➖
        </button>
        <span className="lightbox-zoom-info">{Math.round(zoomScale * 100)}%</span>
        <button className="lightbox-btn" onClick={onZoomIn} title="Zoom In" disabled={zoomScale >= 4}>
          ➕
        </button>
        <button className="lightbox-btn" onClick={onZoomReset} title="Reset Zoom">
          🔄
        </button>
      </div>
    </div>
  );
};

export default LightboxModal;
