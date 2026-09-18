import axiosClient from './axiosClient';

export const searchMovies = async (q, page = 1) => {
  const res = await axiosClient.get('/movies/search/', {
    params: { q, page },
  });
  return res.data;
};
