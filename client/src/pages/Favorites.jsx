import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Clapperboard, ArrowDownUp, Calendar, Check, ChevronDown } from 'lucide-react';
import FavoriteCard from '../components/FavoriteCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { updateFavoriteNote, deleteFavorite } from '../api/favorites';
import { useToast } from '../context/ToastContext';
import { useFavorites } from '../context/FavoritesContext';

const SORT_OPTIONS = [
  { value: 'reciente', label: 'Más recientes' },
  { value: 'anio_desc', label: 'Año (más nuevas)' },
  { value: 'anio_asc', label: 'Año (más antiguas)' },
  { value: 'nota_desc', label: 'Nota (mayor a menor)' },
  { value: 'nota_asc', label: 'Nota (menor a mayor)' },
];

const sortFavorites = (list, sortBy) => {
  const sorted = [...list];
  switch (sortBy) {
    case 'anio_desc':
      return sorted.sort((a, b) => (b.anio || '0').localeCompare(a.anio || '0'));
    case 'anio_asc':
      return sorted.sort((a, b) => (a.anio || '0').localeCompare(b.anio || '0'));
    case 'nota_desc':
      return sorted.sort((a, b) => (b.nota ?? -1) - (a.nota ?? -1));
    case 'nota_asc':
      return sorted.sort((a, b) => (a.nota ?? 6) - (b.nota ?? 6));
    case 'reciente':
    default:
      return sorted;
  }
};

const FilterDropdown = ({ icon: Icon, label, options, value, onChange }) => {
  const detailsRef = useRef(null);
  const current = options.find((opt) => opt.value === value) ?? options[0];

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!detailsRef.current?.contains(event.target)) {
        detailsRef.current?.removeAttribute('open');
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const select = (optValue) => {
    onChange(optValue);
    detailsRef.current?.removeAttribute('open');
  };

  return (
    <details ref={detailsRef} className="group/filter relative z-[100]">
      <summary
        className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-sm text-[#a19b91] outline-none transition-all duration-200 hover:border-[#ff6b1a]/40 hover:bg-white/[0.08] hover:text-[#e9e4dc] active:scale-95 [&::-webkit-details-marker]:hidden"
        aria-label={label}
      >
        <Icon size={14} className="text-[#ff6b1a]" />

        <span className="text-[#e9e4dc]">
          {current.label}
        </span>

        <ChevronDown
          size={14}
          className="text-[#6f6a63] transition-transform duration-200 group-open/filter:rotate-180"
        />
      </summary>

      <div className="dropdown-in absolute left-0 top-[calc(100%+0.5rem)] z-[9999] max-h-72 w-56 overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#151412]/95 p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        {options.map((opt) => {
          const active = opt.value === value;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => select(opt.value)}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150 active:scale-[0.98] ${
                active
                  ? 'bg-[#ff6b1a]/12 text-[#ff6b1a]'
                  : 'text-[#b2aca3] hover:bg-[#ff6b1a]/10 hover:text-[#ff6b1a]'
              }`}
            >
              {opt.label}
              {active && <Check size={15} className="flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </details>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <Clapperboard className="w-14 h-14 text-[#5a554e] mb-4" />
    <p className="text-[#e9e4dc] text-lg mb-1">Aún no tienes favoritas</p>
    <p className="text-[#8f8a82] text-sm mb-6">
      Explora el catálogo y agrega las películas que más te gusten
    </p>
    <Link
      to="/"
      className="inline-block rounded-lg bg-[#ff6b1a] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#ff8533] active:scale-95"
    >
      Explorar películas
    </Link>
  </div>
);

const Favorites = () => {
  const {
    favorites,
    loading,
    error,
    reload,
    addToFavoritesList,
    removeFromFavoritesList,
  } = useFavorites();
  const toast = useToast();

  const [sortBy, setSortBy] = useState('reciente');
  const [yearFilter, setYearFilter] = useState('all');

  const yearOptions = useMemo(() => {
    const years = new Set(favorites.map((f) => f.anio).filter(Boolean));
    const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
    return [
      { value: 'all', label: 'Todos los años' },
      ...sortedYears.map((year) => ({ value: year, label: year })),
    ];
  }, [favorites]);

  useEffect(() => {
    if (!yearOptions.some((opt) => opt.value === yearFilter)) {
      setYearFilter('all');
    }
  }, [yearOptions, yearFilter]);

  const visibleFavorites = useMemo(() => {
    const filtered =
      yearFilter === 'all' ? favorites : favorites.filter((f) => f.anio === yearFilter);
    return sortFavorites(filtered, sortBy);
  }, [favorites, yearFilter, sortBy]);

  const handleUpdate = async (id, nota) => {
    const fav = favorites.find((f) => f.id === id);
    try {
      await updateFavoriteNote(id, nota);
      if (fav) addToFavoritesList({ ...fav, nota });
      toast.success('Nota actualizada');
    } catch {
      toast.error('No se pudo actualizar la nota');
    }
  };

  const handleDelete = async (id) => {
    const fav = favorites.find((f) => f.id === id);
    try {
      await deleteFavorite(id);
      if (fav) removeFromFavoritesList(fav.id_pelicula);
      toast.success('Quitada de favoritas');
    } catch {
      toast.error('No se pudo quitar de favoritas');
    }
  };

  const renderContent = () => {
    if (loading) return <Loader label="Cargando tus favoritas..." />;
    if (error) {
      return (
        <ErrorMessage message="No se pudieron cargar tus favoritas" onRetry={reload} />
      );
    }
    if (favorites.length === 0) return <EmptyState />;

    return (
      <>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <FilterDropdown
              icon={ArrowDownUp}
              label="Ordenar favoritas"
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={setSortBy}
            />
            {yearOptions.length > 2 && (
              <FilterDropdown
                icon={Calendar}
                label="Filtrar por año"
                options={yearOptions}
                value={yearFilter}
                onChange={setYearFilter}
              />
            )}
          </div>

          <span className="text-xs text-[#5a554e]">
            {visibleFavorites.length} de {favorites.length}
          </span>
        </div>

        {visibleFavorites.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#8f8a82]">
            No tienes favoritas de ese año.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {visibleFavorites.map((fav) => (
              <FavoriteCard
                key={fav.id}
                favorite={fav}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center gap-2">
        <Heart size={22} className="text-[#ff6b1a]" fill="currentColor" />
        <h1 className="font-display text-2xl text-[#e9e4dc]">Mis Favoritas</h1>
      </div>
      {renderContent()}
    </div>
  );
};

export default Favorites;
