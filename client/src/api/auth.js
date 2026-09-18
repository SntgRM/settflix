import axiosClient from './axiosClient';

export const login = async (username, password) => {
  const res = await axiosClient.post('/auth/login/', { username, password });
  return res.data;
};