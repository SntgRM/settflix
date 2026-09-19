import axiosClient from './axiosClient';

export const login = async (username, password) => {
  const { data } = await axiosClient.post('/auth/login/', {
    username,
    password,
  });

  return data;
};

export const logout = async (refresh) => {
  const { data } = await axiosClient.post('/auth/logout/', {
    refresh,
  });

  return data;
};