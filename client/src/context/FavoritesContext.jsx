import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { getFavorites } from '../api/favorites';

const FavoritesContext = createContext(null);

const EMPTY_MAP = new Map();

const normalizeList = (data) =>
  Array.isArray(data) ? data : data?.results ?? [];

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();

  const [state, setState] = useState({
    map: EMPTY_MAP,
    status: 'idle',
    error: null,
    owner: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    getFavorites()
      .then((data) => {
        if (cancelled) return;
        const map = new Map(normalizeList(data).map((f) => [f.id_pelicula, f]));
        setState({ map, status: 'ready', error: null, owner: user });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((prev) => ({
          map: prev.owner === user ? prev.map : EMPTY_MAP,
          status: 'error',
          error: err,
          owner: user,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  const belongsToUser = !!user && state.owner === user;
  const favoritesMap = belongsToUser ? state.map : EMPTY_MAP;
  const loading = !!user && (!belongsToUser || state.status === 'loading');
  const error = belongsToUser && state.status === 'error' ? state.error : null;

  const isFavorite = useCallback(
    (idPelicula) => favoritesMap.has(idPelicula),
    [favoritesMap]
  );

  const addToFavoritesList = useCallback((favorita) => {
    setState((prev) => ({
      ...prev,
      map: new Map(prev.map).set(favorita.id_pelicula, favorita),
    }));
  }, []);

  const removeFromFavoritesList = useCallback((idPelicula) => {
    setState((prev) => {
      const map = new Map(prev.map);
      map.delete(idPelicula);
      return { ...prev, map };
    });
  }, []);

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    setReloadKey((k) => k + 1);
  }, []);

  const favorites = useMemo(() => Array.from(favoritesMap.values()), [favoritesMap]);

  const value = useMemo(
    () => ({
      favorites,
      loading,
      error,
      reload,
      isFavorite,
      addToFavoritesList,
      removeFromFavoritesList,
    }),
    [
      favorites,
      loading,
      error,
      reload,
      isFavorite,
      addToFavoritesList,
      removeFromFavoritesList,
    ]
  );

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites debe usarse dentro de FavoritesProvider');
  return ctx;
};