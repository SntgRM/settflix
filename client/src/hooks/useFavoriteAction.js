import { useState, useCallback } from 'react';
import { addFavorite } from '../api/favorites';
import { useToast } from '../context/ToastContext';

export const useFavoriteAction = () => {
  const [loading, setLoading] = useState(false);
  const [alreadyAdded, setAlreadyAdded] = useState(false);
  const toast = useToast();

  const add = useCallback(
    async (movie) => {
      if (loading || alreadyAdded) return;
      setLoading(true);
      try {
        await addFavorite(movie);
        setAlreadyAdded(true);
        toast.success('Agregada a tus favoritas');
      } catch (error) {
        const status = error.response?.status;
        if (status === 409) {
          setAlreadyAdded(true);
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
    },
    [loading, alreadyAdded, toast]
  );

  return { add, loading, alreadyAdded };
};
