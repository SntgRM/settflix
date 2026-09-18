import { useState, useEffect } from 'react';
import { Plus, Check, Loader2, Star } from 'lucide-react';
import { useFavoriteAction } from '../hooks/useFavoriteAction';

const hasValidPoster = (poster) =>
  poster && poster !== 'N/A' && poster.trim() !== '';

const HeroSlide = ({ movie, active }) => {
  const { add, loading, alreadyAdded } = useFavoriteAction();
  const valid = hasValidPoster(movie.poster);

  const handleAdd = () => {
    if (loading || alreadyAdded) return;
    add({
      id_pelicula: movie.id_pelicula,
      titulo: movie.titulo,
      anio: movie.anio,
      poster: movie.poster,
    });
  };

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ${
        active ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {valid ? (
        <img
          src={movie.poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-50 scale-125"
        />
      ) : (
        <div className="absolute inset-0 bg-[#161616] opacity-50" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-[#0a0a0a]/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

      <div className="relative h-full flex items-center px-6 md:px-16">
        {valid && (
          <img
            src={movie.poster}
            alt={movie.titulo}
            className="hidden md:block w-[240px] h-[360px] object-cover rounded-xl shadow-2xl flex-shrink-0 border border-white/10"
          />
        )}
        <div className={`w-full max-w-xl flex flex-col ${valid ? 'md:ml-10' : ''}`}>
          {/* Badge: fixed slot */}
          <div className="h-[26px] flex items-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff6b1a]/15 border border-[#ff6b1a]/30 text-[#ff6b1a] text-xs font-medium">
              <Star size={12} fill="currentColor" />
              Destacada del catálogo
            </span>
          </div>

          {/* Title: fixed-height slot, always 2 lines tall, clamps overflow */}
          <h2 className="font-display text-4xl md:text-6xl text-[#e9e4dc] leading-tight mb-2 h-[88px] md:h-[144px] line-clamp-2 overflow-hidden">
            {movie.titulo}
          </h2>

          {/* Year: fixed slot, reserved even when absent */}
          <p className="text-[#8f8a82] text-lg mb-6 h-[28px]">
            {movie.anio && movie.anio !== 'N/A' ? movie.anio : '\u00A0'}
          </p>

          {/* Button: fixed slot */}
          <div>
            <button
              onClick={handleAdd}
              disabled={loading || alreadyAdded}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                alreadyAdded
                  ? 'bg-[#ff6b1a]/20 border border-[#ff6b1a]/50 text-[#ff6b1a] cursor-default'
                  : 'bg-[#ff6b1a] text-white hover:bg-[#ff8533] shadow-lg shadow-[#ff6b1a]/20'
              } disabled:opacity-70`}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : alreadyAdded ? (
                <Check size={16} />
              ) : (
                <Plus size={16} />
              )}
              {alreadyAdded ? 'Ya en favoritas' : 'Agregar a favoritas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HeroCarousel = ({ movies }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || movies.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % movies.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [paused, movies.length]);

  useEffect(() => {
    if (current >= movies.length) setCurrent(0);
  }, [movies.length, current]);

  if (!movies.length) return null;

  return (
    <div
      className="relative w-full h-[60vh] min-h-[460px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {movies.map((movie, i) => (
        <HeroSlide key={movie.id_pelicula} movie={movie} active={i === current} />
      ))}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {movies.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current
                ? 'w-8 bg-[#ff6b1a]'
                : 'w-2 bg-[#5a554e] hover:bg-[#8f8a82]'
            }`}
            aria-label={`Ir a la película ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;