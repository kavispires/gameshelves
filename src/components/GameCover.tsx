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
  const { getCover, getThumbnail } = useQueryImages();
  return (
    <Image
      src={type === 'image' ? getCover(id) : getThumbnail(id)}
      width={width}
      fallback={URLS.BGG_NO_IMAGE}
      title={`Cover for: ${name}`}
      alt={name}
      {...rest}
    />
  );
}
