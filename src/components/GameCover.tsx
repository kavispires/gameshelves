import { Image, ImageProps } from 'antd';
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
      src={getImages(id)[type]}
      width={width}
      fallback={URLS.BGG_NO_IMAGE}
      title={`Cover for: ${name}`}
      {...rest}
    />
  );
}
