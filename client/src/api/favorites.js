import axiosClient from './axiosClient';

export const getFavorites = async () => {
  const res = await axiosClient.get('/favorites/');
  return res.data;
};

export const addFavorite = async (movie) => {
  const res = await axiosClient.post('/favorites/', movie);
  return res.data;
};

export const updateFavoriteNote = async (id, nota) => {
  const res = await axiosClient.patch(`/favorites/${id}/`, { nota });
  return res.data;
};

export const deleteFavorite = async (id) => {
  const res = await axiosClient.delete(`/favorites/${id}/`);
  return res.data;
};
