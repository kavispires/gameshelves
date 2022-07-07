import { Image, ImageProps } from 'antd';
import { URLS } from 'utils/constants';

interface GameCoverProps extends ImageProps {
  src: string;
  name: string;
  width: number;
}

export function GameCover({ src, name, width, ...rest }: GameCoverProps) {
  return <Image src={src} width={80} fallback={URLS.BGG_NO_IMAGE} title={`Cover for: ${name}`} {...rest} />;
}
