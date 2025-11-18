
import React, { useEffect, useRef, useState } from 'react';
import { GoalStep, MapStyle } from '../types';
import { Check, Lock, MapPin, Footprints, Star, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface TreasureMapProps {
  steps: GoalStep[];
  themeGradient: string;
  mapStyle: MapStyle;
  backgroundImage?: string;
  onStepClick: (step: GoalStep) => void;
  onCompleteStep: (stepId: string) => void;
  isGenerating: boolean;
}

const mapStyles: Record<string, { 
  textColor: string; 
  nodeBg: string;
  footprintColor: string; // Fallback
}> = {
  classic: { 
    textColor: 'text-amber-900',
    nodeBg: 'bg-[#fffef5]',
    footprintColor: '#8c5e2e'
  },
  midnight: { 
    textColor: 'text-slate-200',
    nodeBg: 'bg-slate-800',
    footprintColor: '#94a3b8'
  },
  blueprint: { 
    textColor: 'text-white',
    nodeBg: 'bg-white/10',
    footprintColor: '#60a5fa'
  },
  forest: { 
    textColor: 'text-emerald-900',
    nodeBg: 'bg-white',
    footprintColor: '#059669'
  },
};

// Subtle noise texture for non-solid backgrounds
const NOISE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.07'/%3E%3C/svg%3E`;

// Patterns
const STARS_SVG = `data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1' fill='white' opacity='0.5'/%3E%3Ccircle cx='40' cy='60' r='0.8' fill='white' opacity='0.4'/%3E%3Ccircle cx='80' cy='30' r='1.2' fill='white' opacity='0.3'/%3E%3C/svg%3E`;
const CROSSHAIR_SVG = `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0v40M0 20h40' stroke='white' stroke-width='0.5' opacity='0.1'/%3E%3C/svg%3E`;
const LEAVES_SVG = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0c0 0 10 10 10 20s-10 20-10 20S20 30 20 20s10-20 10-20z' fill='black' opacity='0.03'/%3E%3C/svg%3E`;

// Color Utils
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
};

const lerpColor = (color1: string, color2: string, factor: number) => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = c1.r + (c2.r - c1.r) * factor;
  const g = c1.g + (c2.g - c1.g) * factor;
  const b = c1.b + (c2.b - c1.b) * factor;
  return rgbToHex(r, g, b);
};

const hexToRgba = (hex: string, alpha: number) => {
  const c = hexToRgb(hex);
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
};

const extractGradientColors = (gradient: string, defaultColor: string): [string, string] => {
  const matches = gradient.match(/#[a-fA-F0-9]{6}/g);
  if (!matches || matches.length < 2) {
    return [matches ? matches[0] : defaultColor, matches ? matches[0] : defaultColor];
  }
  return [matches[0], matches[1]];
};


// Helper to calculate point on Cubic Bezier
const getBezierPoint = (t: number, p0: {x:number, y:number}, p1: {x:number, y:number}, p2: {x:number, y:number}, p3: {x:number, y:number}) => {
  const cX = 3 * (p1.x - p0.x);
  const bX = 3 * (p2.x - p1.x) - cX;
  const aX = p3.x - p0.x - cX - bX;

  const cY = 3 * (p1.y - p0.y);
  const bY = 3 * (p2.y - p1.y) - cY;
  const aY = p3.y - p0.y - cY - bY;

  const x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
  const y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;

  return { x, y };
};

// Helper to calculate angle on Cubic Bezier
const getBezierAngle = (t: number, p0: {x:number, y:number}, p1: {x:number, y:number}, p2: {x:number, y:number}, p3: {x:number, y:number}) => {
  const dx = 3 * (1-t) * (1-t) * (p1.x - p0.x) + 6 * (1-t) * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
  const dy = 3 * (1-t) * (1-t) * (p1.y - p0.y) + 6 * (1-t) * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
  return Math.atan2(dy, dx);
};

export const TreasureMap: React.FC<TreasureMapProps> = ({ 
  steps = [], 
  themeGradient, 
  mapStyle, 
  backgroundImage,
  onStepClick, 
  onCompleteStep, 
  isGenerating 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 800 });
  const [zoomLevel, setZoomLevel] = useState(1.0);
  
  // Panning state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  
  // Defensive style lookup
  const styleKey = mapStyles[mapStyle] ? mapStyle : 'classic';
  const style = mapStyles[styleKey];

  // Extract colors for gradient path
  const [gradStartColor, gradEndColor] = extractGradientColors(themeGradient, style.footprintColor);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: Math.max(600, (steps?.length || 0) * 160 + 300), 
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    return () => window.removeEventListener('resize', updateDimensions);
  }, [steps?.length]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const getPosition = (index: number) => {
    const yStart = 120;
    const yGap = 160;
    const xCenter = dimensions.width / 2;
    const xAmplitude = Math.min(dimensions.width * 0.35, 160);

    const y = yStart + index * yGap;
    const xOffset = Math.sin(index * Math.PI * 0.5) * xAmplitude; 
    const x = xCenter + xOffset;

    return { x, y };
  };

  const renderPathSegments = () => {
    if (!steps || (steps.length < 2 && !isGenerating)) return null;
    const elements = [];
    const totalSegments = steps.length + (isGenerating ? 1 : 0) - 1;

    // Render actual path segments
    for (let i = 1; i < steps.length; i++) {
       if (!steps[i] || !steps[i-1]) continue; // Safety
       elements.push(renderCurveWithFootprints(i - 1, i, false, totalSegments));
    }

    // Render generating path
    if (isGenerating) {
      const lastIdx = steps.length > 0 ? steps.length - 1 : 0;
      elements.push(renderCurveWithFootprints(lastIdx, lastIdx + 1, true, totalSegments));
    }

    return elements;
  };

  const renderCurveWithFootprints = (startIdx: number, endIdx: number, isGhost: boolean, totalSegments: number) => {
    const startPos = getPosition(startIdx);
    // For ghost path, simulate next position
    const endPos = isGhost 
      ? { 
          x: getPosition(startIdx).x + (Math.sin((startIdx + 1) * Math.PI * 0.5) * 100), 
          y: getPosition(startIdx).y + 160 
        }
      : getPosition(endIdx);

    const cp1 = { x: startPos.x, y: startPos.y + (endPos.y - startPos.y) * 0.5 };
    const cp2 = { x: endPos.x, y: endPos.y - (endPos.y - startPos.y) * 0.5 };

    const pathD = `M ${startPos.x} ${startPos.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${endPos.x} ${endPos.y}`;

    const footprints = [];
    const stepsCount = 6; // Number of footprints per segment
    for (let i = 1; i <= stepsCount; i++) {
      const t = i / (stepsCount + 1);
      const pos = getBezierPoint(t, startPos, cp1, cp2, endPos);
      const angle = getBezierAngle(t, startPos, cp1, cp2, endPos) * (180 / Math.PI);
      
      // Calculate global progress (0 to 1) for color interpolation
      // segmentStart (startIdx) + localProgress (t)
      const globalProgress = Math.min(1, Math.max(0, (startIdx + t) / Math.max(1, totalSegments)));
      const stepColor = lerpColor(gradStartColor, gradEndColor, globalProgress);
      
      // Alternate left/right offset for footprints
      const isRightFoot = i % 2 === 0;
      const offset = isRightFoot ? 8 : -8;
      const offsetX = Math.cos((angle + 90) * (Math.PI/180)) * offset;
      const offsetY = Math.sin((angle + 90) * (Math.PI/180)) * offset;

      const shoePath = "M3.5,0 C5.5,0 7,1.5 7,5 C7,7.5 6,9 5,11 L5,11.5 C6,12 6.5,13 6.5,14 C6.5,16 5,17 3.5,17 C2,17 0.5,16 0.5,14 C0.5,13 1,12 2,11.5 L2,11 C1,9 0,7.5 0,5 C0,1.5 1.5,0 3.5,0 Z";

      footprints.push(
        <g 
          key={`fp-${startIdx}-${i}`}
          style={{
            transform: `translate(${pos.x + offsetX}px, ${pos.y + offsetY}px) rotate(${angle + 90}deg) scale(0.85)`,
            opacity: isGhost ? 0.4 : 0.85,
            transition: 'opacity 0.5s ease-in-out'
          }}
        >
           <path 
             d={shoePath} 
             fill={stepColor}
             transform={`translate(-3.5, -8.5) ${isRightFoot ? '' : 'scale(-1, 1)'}`} 
           />
        </g>
      );
    }
    
    // Calculate average color for this segment's dotted line
    const segmentMidColor = lerpColor(gradStartColor, gradEndColor, (startIdx + 0.5) / Math.max(1, totalSegments));

    return (
      <React.Fragment key={`segment-${startIdx}`}>
        <path d={pathD} fill="none" stroke={segmentMidColor} strokeWidth="2" strokeDasharray="4 4" className="opacity-30" />
        {footprints}
      </React.Fragment>
    );
  };


  // Generate dynamic background styles based on Theme Colors and Map Style
  const getBackgroundStyle = () => {
    if (backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }

    const c1 = gradStartColor;
    const c2 = gradEndColor;

    // Determine focus point for lighting
    let focusY = 120; // Default start
    let focusX = dimensions.width / 2;

    if (steps && steps.length > 0) {
      // Find last completed or last existing
      const lastCompletedIdx = steps.reduce((last, step, idx) => step.isCompleted ? idx : last, -1);
      const targetIdx = lastCompletedIdx >= 0 ? lastCompletedIdx : 0;
      const pos = getPosition(targetIdx);
      focusY = pos.y;
      focusX = pos.x;
    }

    // Dynamic lighting gradient that moves with the user
    // Applying to static background, we center it relative to map
    // Since panning moves the content, we ideally want the light to follow content?
    // Or stay fixed? Let's keep it simple, fixed on the background container but tracking progress.
    const lightingGradient = `radial-gradient(circle 600px at ${focusX}px ${focusY}px, ${hexToRgba(c1, 0.15)}, transparent 70%)`;

    if (mapStyle === 'midnight') {
      // Deep dark background with starfield and progress glow
      return {
        backgroundColor: '#0f172a', // Slate 900
        backgroundImage: `
          ${lightingGradient},
          url("${STARS_SVG}"),
          linear-gradient(to bottom, #0f172a, #1e293b)
        `
      };
    } 
    else if (mapStyle === 'blueprint') {
      // Technical background with crosshairs
      return {
        backgroundColor: '#1e293b', // Fallback dark
        backgroundImage: `
          ${lightingGradient},
          url("${CROSSHAIR_SVG}"),
          radial-gradient(circle at 50% 50%, ${hexToRgba(c1, 0.2)}, transparent 80%),
          linear-gradient(to bottom, #0f172a, #0f172a)
        `,
        backgroundBlendMode: 'screen, normal, normal'
      };
    } 
    else if (mapStyle === 'forest') {
      // Organic leaves pattern
      return {
        backgroundColor: '#f0fdf4',
        backgroundImage: `
          ${lightingGradient},
          url("${LEAVES_SVG}"),
          linear-gradient(to bottom, #f0fdf4, #ecfdf5)
        `
      };
    } 
    else {
      // Classic Parchment
      return {
        backgroundColor: '#fffef5',
        backgroundImage: `
          ${lightingGradient},
          radial-gradient(circle at 50% 20%, ${hexToRgba(c1, 0.05)}, transparent 60%),
          radial-gradient(circle at 10% 90%, ${hexToRgba(c2, 0.05)}, transparent 50%)
        `
      };
    }
  };

  const bgStyles = getBackgroundStyle();

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full overflow-hidden min-h-[500px] rounded-xl shadow-inner transition-colors duration-500 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        ...bgStyles,
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Noise Texture Overlay - Gives it a non-solid, tactile feel */}
      {!backgroundImage && (
        <div 
          className="absolute inset-0 pointer-events-none z-0 mix-blend-multiply opacity-50"
          style={{ backgroundImage: `url("${NOISE_SVG}")` }}
        />
      )}

      {/* Blueprint specific tint overlay if needed for contrast */}
      {mapStyle === 'blueprint' && !backgroundImage && (
         <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      )}

      {/* Zoom Controls */}
      <div className="sticky top-4 right-4 z-50 float-right flex flex-col gap-2 p-2" onMouseDown={(e) => e.stopPropagation()}>
        <div className="bg-white/90 backdrop-blur shadow-md border border-slate-200 rounded-lg flex flex-col overflow-hidden">
          <button 
            onClick={handleZoomIn} 
            className="p-2 hover:bg-slate-100 text-slate-600 active:bg-slate-200 border-b border-slate-100"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <button 
            onClick={handleResetZoom}
            className="p-2 hover:bg-slate-100 text-slate-600 active:bg-slate-200 border-b border-slate-100"
            title="Reset View"
          >
            <RotateCcw size={16} />
          </button>
          <button 
            onClick={handleZoomOut}
            className="p-2 hover:bg-slate-100 text-slate-600 active:bg-slate-200"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
        </div>
        <div className="text-center bg-white/80 rounded px-1 text-[10px] font-bold text-slate-500 backdrop-blur">
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>

      {/* Scalable Content Wrapper */}
      <div 
        style={{ 
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`, 
          transformOrigin: 'top center',
          height: dimensions.height,
          width: '100%',
          minHeight: '100%' 
        }}
        className="relative transition-transform duration-75 ease-out"
      >
        <svg width="100%" height={dimensions.height} className="absolute top-0 left-0 pointer-events-none z-0">
          {renderPathSegments()}
        </svg>

        {steps && steps.map((step, index) => {
          if (!step) return null; // Safety check
          const pos = getPosition(index);
          const isLocked = !step.isCompleted && index > 0 && steps[index - 1] && !steps[index - 1].isCompleted;
          
          // Node border gradient
          const total = Math.max(1, (steps.length - 1));
          const nodeColor = lerpColor(gradStartColor, gradEndColor, index / total);

          return (
            <div
              key={step.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 group"
              style={{ left: pos.x, top: pos.y }}
            >
              <button
                onClick={() => onStepClick(step)}
                // Prevent drag from triggering click by checking dragging state? 
                // Simple workaround: Standard buttons handle clicks on MouseUp. 
                // If dragged, the user likely moved off the button or we can just let it click.
                // For better UX, we could check distance moved, but for now native behavior is acceptable.
                onMouseDown={(e) => e.stopPropagation()} 
                disabled={isLocked}
                style={step.isCompleted ? { background: themeGradient, borderColor: 'transparent', color: 'white' } : {}}
                className={`
                  relative flex items-center justify-center w-16 h-16 rounded-full border-4 shadow-lg transition-all duration-300 hover:scale-110
                  ${step.isCompleted 
                    ? `text-white border-transparent` 
                    : isLocked 
                      ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed grayscale' 
                      : `${style.nodeBg} text-slate-600 animate-bounce-slow` 
                  }
                `}
              >
                 {/* Dynamic border ring using interpolated color if not complete */}
                 {!step.isCompleted && !isLocked && (
                   <div className="absolute inset-0 rounded-full border-4 opacity-50" style={{ borderColor: nodeColor }}></div>
                 )}

                {step.isCompleted ? (
                  <Check size={32} strokeWidth={3} />
                ) : isLocked ? (
                  <Lock size={24} />
                ) : (
                  <MapPin size={32} strokeWidth={2.5} className="drop-shadow-sm" style={{ color: nodeColor }} />
                )}
              </button>

              {/* Step Label */}
              <div className={`
                mt-3 px-4 py-2 rounded-lg shadow-md text-sm font-bold max-w-[200px] text-center transition-all duration-300 font-serif border
                ${step.isCompleted 
                   ? 'bg-white text-slate-800 opacity-60 line-through decoration-2 decoration-slate-400 border-slate-200' 
                   : mapStyle === 'blueprint'
                      ? 'bg-slate-800 text-white border-slate-600 ring-1 ring-white/10' 
                      : `${style.nodeBg} ${style.textColor} scale-105 border-transparent ring-1 ring-black/5`
                }
                ${isLocked ? 'opacity-50' : 'opacity-100'}
              `}>
                {index + 1}. {step.title}
              </div>
            </div>
          );
        })}

        {/* Generation Loading Indicator */}
        {isGenerating && steps && (
           <div 
             className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
             style={{ left: getPosition(steps.length).x, top: getPosition(steps.length).y + 20 }}
           >
              <div className={`p-3 rounded-full ${style.nodeBg} shadow-lg border-2 border-dashed border-gray-400`}>
                <Footprints className={`animate-pulse text-gray-400`} size={24} />
              </div>
              <span className={`mt-2 text-xs font-semibold animate-pulse bg-white text-slate-800 px-2 py-1 rounded-md shadow-sm`}>Scouting Path...</span>
           </div>
        )}

        {/* Start Icon */}
         <div 
             className="absolute transform -translate-x-1/2 -translate-y-1/2 z-0 opacity-40 drop-shadow-md"
             style={{ left: getPosition(0).x, top: getPosition(0).y }}
           >
             <Star className="rotate-12" size={120} fill={gradStartColor} stroke="white" strokeWidth={1} />
           </div>
      </div>
    </div>
  );
};
