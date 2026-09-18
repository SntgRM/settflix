import { useState } from 'react';
import { Film } from 'lucide-react';
import { hasValidPoster } from '../utils/movie';

export const PosterPlaceholder = ({ className = '' }) => (
    <div
        role="img"
        aria-label="Sin póster"
        className={`flex flex-col items-center justify-center gap-2 bg-[#161616] text-[#5a554e] ${className}`}
    >
        <Film size={28} strokeWidth={1.5} />
        <span className="text-xs font-medium">Sin póster</span>
    </div>
);

const PosterImage = ({ src, alt, className = '', ...rest }) => {
    const [failedSrc, setFailedSrc] = useState(null);

    if (!hasValidPoster(src) || failedSrc === src) {
        return <PosterPlaceholder className={className} />;
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setFailedSrc(src)}
            {...rest}
        />
    );
};

export default PosterImage;