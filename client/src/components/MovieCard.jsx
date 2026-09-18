import { useFavoriteAction } from '../hooks/useFavoriteAction';
import { getYear } from '../utils/movie';
import PosterImage from './PosterImage';
import FavoriteIcon from './FavoriteIcon';

const MovieCard = ({ movie }) => {
  const { add, loading, alreadyAdded, justAdded } = useFavoriteAction(movie);
  const year = getYear(movie.anio);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    add();
  };

  return (
    <div className="relative flex-shrink-0 w-[140px] md:w-[180px] rounded-lg border border-white/5 shadow-md bg-[#161616] overflow-visible transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.04] hover:z-20 hover:border-[#ff6b1a]/50 hover:shadow-[0_20px_40px_-12px_rgba(255,107,26,0.35)] group/card">
      <div className="rounded-lg overflow-hidden aspect-[2/3] relative">
        <PosterImage
          src={movie.poster}
          alt={movie.titulo}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
      </div>

      <button
        onClick={handleAdd}
        disabled={loading || alreadyAdded}
        className={`absolute top-2 right-2 z-10 flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md border transition-all duration-200 active:scale-90 ${
          alreadyAdded
            ? 'bg-[#ff6b1a] border-[#ff6b1a] text-white cursor-default'
            : 'bg-black/60 border-white/10 text-[#e9e4dc] hover:border-[#ff6b1a]/60 hover:text-[#ff6b1a]'
        } disabled:opacity-70`}
        title={alreadyAdded ? 'Ya en favoritas' : 'Agregar a favoritas'}
        aria-label={alreadyAdded ? 'Ya en favoritas' : 'Agregar a favoritas'}
      >
        <FavoriteIcon loading={loading} added={alreadyAdded} justAdded={justAdded} />
      </button>

      <div className="mt-2 px-1 pb-1">
        <p className="text-sm text-[#e9e4dc] font-medium leading-snug line-clamp-2">
          {movie.titulo}
        </p>
        {year && <p className="text-xs text-[#8f8a82] mt-0.5">{year}</p>}
      </div>
    </div>
  );
};

export default MovieCard;