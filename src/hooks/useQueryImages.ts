import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getImages as getImagesDocument } from 'services/firebase';
import { URLS } from 'utils/constants';
import { queryKeys } from './queryKeys';

const fallback: GameImages = {
  thumbnail: URLS.BGG_NO_IMAGE,
  image: URLS.BGG_NO_IMAGE,
};

/**
 * Queries game images
 */
export function useQueryImages() {
  const { isSuccess, data, ...rest } = useQuery({
    queryKey: queryKeys.images,
    queryFn: getImagesDocument,
  });

  const images = useMemo(() => data ?? {}, [data]);

  const getImages = (id: GameId) => images?.[id] ?? fallback;

  const getThumbnail = (id: GameId) => getImages(id).thumbnail ?? URLS.BGG_NO_IMAGE;

  const getCover = (id: GameId) => getImages(id).thumbnail ?? URLS.BGG_NO_IMAGE;

  return {
    ...rest,
    isSuccess,
    data,
    images,
    getImages,
    getThumbnail,
    getCover,
  };
}
