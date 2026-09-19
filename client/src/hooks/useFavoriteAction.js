import { useState, useCallback } from 'react';
import { addFavorite } from '../api/favorites';
import { useToast } from '../context/ToastContext';
import { useFavorites } from '../context/FavoritesContext';

export const useFavoriteAction = (movie) => {
  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const toast = useToast();
  const {
    isFavorite,
    addToFavoritesList,
    reload,
  } = useFavorites();

  const alreadyAdded = isFavorite(movie.id_pelicula);

  const add = useCallback(async () => {
    if (loading || alreadyAdded) return;

    setLoading(true);

    try {
      const created = await addFavorite(movie.id_pelicula);

      addToFavoritesList(created);

      setJustAdded(true);

      toast.success('Agregada a tus favoritas');
    } catch (error) {
      const status = error.response?.status;

      if (status === 409) {
        reload();
        toast.info('Esta película ya está en tus favoritas');
      } else if (status === 400) {
        toast.error('Los datos de la película no son válidos');
      } else if (status === 401) {
        toast.error('Tu sesión ha expirado');
      } else {
        toast.error('No se pudo agregar a favoritas');
      }
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    alreadyAdded,
    movie.id_pelicula,
    addToFavoritesList,
    reload,
    toast,
  ]);

  return {
    add,
    loading,
    alreadyAdded,
    justAdded,
  };
};