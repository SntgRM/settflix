import { Link } from 'react-router-dom';
import { Heart, Clapperboard } from 'lucide-react';
import FavoriteCard from '../components/FavoriteCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { updateFavoriteNote, deleteFavorite } from '../api/favorites';
import { useToast } from '../context/ToastContext';
import { useFavorites } from '../context/FavoritesContext';

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <Clapperboard className="w-14 h-14 text-[#5a554e] mb-4" />
    <p className="text-[#e9e4dc] text-lg mb-1">Aún no tienes favoritas</p>
    <p className="text-[#8f8a82] text-sm mb-6">
      Explora el catálogo y agrega las películas que más te gusten
    </p>
    <Link
      to="/"
      className="px-5 py-2.5 rounded-lg bg-[#ff6b1a] text-white text-sm font-medium hover:bg-[#ff8533] transition-colors"
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {favorites.map((fav) => (
          <FavoriteCard
            key={fav.id}
            favorite={fav}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="px-4 md:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Heart size={22} className="text-[#ff6b1a]" fill="currentColor" />
        <h1 className="font-display text-2xl text-[#e9e4dc]">Mis Favoritas</h1>
      </div>
      {renderContent()}
    </div>
  );
};

export default Favorites;
