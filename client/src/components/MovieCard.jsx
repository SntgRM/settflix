import { useFavoriteAction } from '../hooks/useFavoriteAction';
import { getYear } from '../utils/movie';
import PosterImage from './PosterImage';
import FavoriteIcon from './FavoriteIcon';

const MovieCard = ({ movie, compact = false }) => {
  const { add, loading, alreadyAdded, justAdded } = useFavoriteAction(movie);
  const year = getYear(movie.anio);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    add();
  };

  return (
    <article className={`group relative w-full min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#171719] shadow-[0_16px_40px_rgba(0,0,0,.22)] transition duration-300 hover:z-20 hover:-translate-y-1 hover:border-[#ff7a2f]/45 hover:shadow-[0_18px_48px_rgba(255,109,36,.14)] ${
      compact ? 'flex-none w-[170px] sm:w-[190px] md:w-[210px] lg:w-[220px]' : ''
    }`}>
      <div className="relative aspect-[2/3] overflow-hidden bg-white/5">
        <PosterImage
          src={movie.poster}
          alt={movie.titulo}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
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

      <div className="p-3.5 md:p-4">
        <h2 className="line-clamp-2 min-h-10 text-[13px] font-semibold leading-5 text-[#f5eee8] md:min-h-12 md:text-[15px] md:leading-6">
          {movie.titulo}
        </h2>
        {year && <p className="mt-1 text-[11px] font-medium text-[#9b928c] md:text-xs">{year}</p>}
      </div>
    </article>
  );
};

export default MovieCard;
