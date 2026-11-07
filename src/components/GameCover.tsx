import { Image, type ImageProps } from 'antd';
import { useQueryImages } from 'hooks';
import { URLS } from 'utils/constants';

interface GameCoverProps extends ImageProps {
  id: string;
  type?: 'thumbnail' | 'image';
  name: string;
  width: number;
}

export function GameCover({ id, type = 'thumbnail', name, width, ...rest }: GameCoverProps) {
  const { getImages } = useQueryImages();
  return (
    <Image
      src={getImages(id)[type] || URLS.BGG_NO_IMAGE}
      width={width}
      fallback={URLS.BGG_NO_IMAGE}
      title={`Cover for: ${name}`}
      {...rest}
    />
  );
}
