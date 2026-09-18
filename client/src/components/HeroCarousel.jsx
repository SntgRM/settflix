import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useFavoriteAction } from '../hooks/useFavoriteAction';
import { hasValidPoster, getYear } from '../utils/movie';
import PosterImage from './PosterImage';
import FavoriteIcon from './FavoriteIcon';

const HeroSlide = ({ movie, active }) => {
  const { add, loading, alreadyAdded, justAdded } = useFavoriteAction(movie);
  const valid = hasValidPoster(movie.poster);

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
    >
      {valid ? (
        <img
          src={movie.poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-50 scale-125"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[#1f1f1f] via-[#161616] to-[#0a0a0a]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_30%,rgba(255,107,26,0.16),transparent_60%)]" />
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-[#0a0a0a]/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

      <div className="relative h-full flex items-center px-6 md:px-16">
        <div className="hidden md:block flex-shrink-0">
          <PosterImage
            src={movie.poster}
            alt={movie.titulo}
            className="w-[240px] h-[360px] object-cover rounded-xl shadow-2xl border border-white/10"
          />
        </div>

        <div
          className={`w-full max-w-xl flex flex-col md:ml-10 transition-all duration-700 delay-200 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
          <div className="h-[26px] flex items-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff6b1a]/15 border border-[#ff6b1a]/30 text-[#ff6b1a] text-xs font-medium">
              <Star size={12} fill="currentColor" />
              Destacada del catálogo
            </span>
          </div>

          <h2 className="font-display text-4xl md:text-6xl text-[#e9e4dc] leading-tight mb-2 h-[88px] md:h-[144px] line-clamp-2 overflow-hidden">
            {movie.titulo}
          </h2>

          <p className="text-[#8f8a82] text-lg mb-6 h-[28px]">
            {getYear(movie.anio) ?? '\u00A0'}
          </p>

          <div>
            <button
              onClick={add}
              disabled={loading || alreadyAdded}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 active:scale-95 ${alreadyAdded
                  ? 'bg-[#ff6b1a]/20 border border-[#ff6b1a]/50 text-[#ff6b1a] cursor-default'
                  : 'bg-[#ff6b1a] text-white hover:bg-[#ff8533] shadow-lg shadow-[#ff6b1a]/20 hover:shadow-[0_0_28px_rgba(255,107,26,0.45)]'
                } disabled:opacity-70`}
            >
              <FavoriteIcon
                loading={loading}
                added={alreadyAdded}
                justAdded={justAdded}
                size={16}
              />
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
        {movies.map((m, i) => (
          <button
            key={m.id_pelicula}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === current
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