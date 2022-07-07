import { useFirestoreDocument } from '@react-query-firebase/firestore';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';
import { firestore } from 'services/firebase';
import { URLS } from 'utils/constants';

const fallback: GameImages = {
  thumbnail: URLS.BGG_NO_IMAGE,
  image: URLS.BGG_NO_IMAGE,
};

/**
 * Queries game images
 */
export function useQueryImages() {
  const ref = doc(firestore, 'general', 'images');

  const { isSuccess, data, ...rest } = useFirestoreDocument<Record<string, GameImages>>(
    ['general', 'images'],
    ref
  );

  const images = useMemo(() => (isSuccess ? data?.data() ?? {} : {}), [isSuccess, data]);

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
