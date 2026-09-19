import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import ErrorMessage from './ErrorMessage';
import { SkeletonCard } from './Loader';

const ScrollButton = ({ direction, onClick }) => {
  const isLeft = direction === 'left';
  const Icon = isLeft ? ChevronLeft : ChevronRight;

  return (
    <button
      onClick={onClick}
      aria-label={isLeft ? 'Desplazar a la izquierda' : 'Desplazar a la derecha'}
      className={`absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-16 bg-black/70 backdrop-blur-sm text-[#e9e4dc] opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 hover:text-[#ff6b1a] ${
        isLeft ? 'left-0 rounded-r-lg' : 'right-0 rounded-l-lg'
      }`}
    >
      <Icon size={24} />
    </button>
  );
};

const RowTitle = ({ children }) => (
  <div className="px-4 md:px-8 mb-1">
    <h2 className="font-display text-xl md:text-2xl text-[#e9e4dc]">{children}</h2>
  </div>
);

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
      <section>
        <RowTitle>{title}</RowTitle>
        <div className="px-4 md:px-8 -my-6 py-6">
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
    <section className="group/row">
      <RowTitle>{title}</RowTitle>
      <div className="relative">
        <ScrollButton direction="left" onClick={() => scroll('left')} />
        <div
          ref={scrollRef}
          className="no-scrollbar flex gap-4 overflow-x-auto px-4 md:px-8 -my-6 py-6"
        >
          {loading
            ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
            : resultados.map((movie) => (
                <MovieCard key={movie.id_pelicula} movie={movie} compact />
              ))}
        </div>
        <ScrollButton direction="right" onClick={() => scroll('right')} />
      </div>
    </section>
  );
};

export default MovieRow;