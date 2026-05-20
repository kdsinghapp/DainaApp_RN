import { apiClient } from '../api';

export const getUsers = () => {
  return apiClient('/users');
};