import { URLS } from 'utils/constants';
import { useLibrary } from './useLibrary';

export function useQueryImages() {
  const query = useLibrary();
  const images: Record<string, GameImages> = query.data?.legacy?.images ?? query.data?.games ?? {};
  const getImages = (id: GameId): GameImages => images[id] ?? {};
  const getThumbnail = (id: GameId) => getImages(id).thumbnail || URLS.BGG_NO_IMAGE;
  const getCover = (id: GameId) => getImages(id).image || getThumbnail(id);
  return { ...query, images, getImages, getThumbnail, getCover };
}
