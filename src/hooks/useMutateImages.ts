import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveImages } from 'services/firebase';
import { queryKeys } from './queryKeys';

export function useMutateImages() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveImages,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.images }),
  });
}
