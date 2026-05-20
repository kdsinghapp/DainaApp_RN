import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) =>
      apiClient('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
  });
};
