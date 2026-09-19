import { useState } from 'react';
import { Star } from 'lucide-react';

const clampRating = (value) => Math.max(0, Math.min(5, Number(value) || 0));

export default function StarRating({ value = 0, onChange, readOnly = false, size = 20, className = '' }) {
  const [hoverValue, setHoverValue] = useState(null);
  const displayValue = Math.round(clampRating(hoverValue ?? value));

  const getValue = (index) => index;

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      onMouseLeave={() => !readOnly && setHoverValue(null)}
      role={readOnly ? undefined : 'radiogroup'}
      aria-label={readOnly ? `Calificación: ${displayValue} de 5` : 'Calificación en estrellas'}
    >
      {[1, 2, 3, 4, 5].map((index) => {
        const fillPercent = Math.max(0, Math.min(1, displayValue - index + 1)) * 100;
        return (
          <button
            key={index}
            type="button"
            disabled={readOnly}
            role={readOnly ? undefined : 'radio'}
            aria-checked={!readOnly && value >= index}
            aria-label={!readOnly ? `${index} estrella${index === 1 ? '' : 's'}` : undefined}
            onMouseMove={() => !readOnly && setHoverValue(index)}
            onClick={() => !readOnly && onChange?.(index)}
            className={`relative grid shrink-0 place-items-center rounded-md p-0.5 transition-transform ${readOnly ? '' : 'cursor-pointer hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a2f]'}`}
            style={{ width: size + 6, height: size + 6 }}
          >
            <Star size={size} strokeWidth={1.8} className="text-white/15" />
            <span className="absolute inset-0.5 overflow-hidden" style={{ width: `${fillPercent}%` }}>
              <Star size={size} strokeWidth={1.8} className="text-[#ff7a2f]" fill="currentColor" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { clampRating };
