import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import ErrorMessage from './ErrorMessage';
import { SkeletonCard } from './Loader';

const MovieRow = ({ title, loading, error, resultados, onRetry }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (error) {
    return (
      <section className="-my-6">
        <div className="px-4 md:px-8 mb-1">
          <h2 className="font-display text-xl md:text-2xl text-[#e9e4dc]">{title}</h2>
        </div>
        <div className="px-4 md:px-8 py-6">
          <ErrorMessage
            message="No se pudo cargar esta categoría"
            onRetry={onRetry}
            compact
          />
        </div>
      </section>
    );
  }

  return (
    <section className="-my-6 group/row">
      <div className="px-4 md:px-8 mb-1">
        <h2 className="font-display text-xl md:text-2xl text-[#e9e4dc]">{title}</h2>
      </div>
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-16 rounded-r-lg bg-black/70 backdrop-blur-sm text-[#e9e4dc] opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 hover:text-[#ff6b1a]"
        >
          <ChevronLeft size={24} />
        </button>
        <div
          ref={scrollRef}
          className="no-scrollbar flex gap-4 overflow-x-auto px-4 md:px-8 py-6"
        >
          {loading
            ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
            : resultados.map((movie) => (
                <MovieCard key={movie.id_pelicula} movie={movie} />
              ))}
        </div>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-16 rounded-l-lg bg-black/70 backdrop-blur-sm text-[#e9e4dc] opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 hover:text-[#ff6b1a]"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </section>
  );
};

export default MovieRow;
