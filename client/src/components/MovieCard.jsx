import { Plus, Check, Loader2 } from 'lucide-react';
import { useFavoriteAction } from '../hooks/useFavoriteAction';

const hasValidPoster = (poster) =>
  poster && poster !== 'N/A' && poster.trim() !== '';

const PosterPlaceholder = () => (
  <div className="w-full h-full bg-[#161616] flex items-center justify-center">
    <span className="text-[#5a554e] text-xs font-medium">Sin póster</span>
  </div>
);

const MovieCard = ({ movie }) => {
  const { add, loading, alreadyAdded } = useFavoriteAction();
  const valid = hasValidPoster(movie.poster);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading || alreadyAdded) return;
    add({
      id_pelicula: movie.id_pelicula,
      titulo: movie.titulo,
      anio: movie.anio,
      poster: movie.poster,
    });
  };

  return (
    <div className="relative flex-shrink-0 w-[140px] md:w-[180px] rounded-lg border border-white/5 shadow-md bg-[#161616] overflow-visible transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.04] hover:z-20 hover:border-[#ff6b1a]/50 hover:shadow-[0_20px_40px_-12px_rgba(255,107,26,0.35)] group/card">
      <div className="rounded-lg overflow-hidden aspect-[2/3] relative">
        {valid ? (
          <img
            src={movie.poster}
            alt={movie.titulo}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <PosterPlaceholder />
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
      </div>

      <button
        onClick={handleAdd}
        disabled={loading || alreadyAdded}
        className={`absolute top-2 right-2 z-10 flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md border transition-all duration-200 ${
          alreadyAdded
            ? 'bg-[#ff6b1a] border-[#ff6b1a] text-white cursor-default'
            : 'bg-black/60 border-white/10 text-[#e9e4dc] hover:border-[#ff6b1a]/60 hover:text-[#ff6b1a]'
        } disabled:opacity-70`}
        title={alreadyAdded ? 'Ya en favoritas' : 'Agregar a favoritas'}
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : alreadyAdded ? (
          <Check size={15} />
        ) : (
          <Plus size={15} />
        )}
      </button>

      <div className="mt-2 px-1 pb-1">
        <p className="text-sm text-[#e9e4dc] font-medium leading-snug line-clamp-2">
          {movie.titulo}
        </p>
        {movie.anio && movie.anio !== 'N/A' && (
          <p className="text-xs text-[#8f8a82] mt-0.5">{movie.anio}</p>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
