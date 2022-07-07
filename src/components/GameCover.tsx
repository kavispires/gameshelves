import { Image, ImageProps } from 'antd';
import { URLS } from 'utils/constants';

interface GameCoverProps extends ImageProps {
  src: string;
  name: string;
  width: number;
}

export const GameCover: React.FunctionComponent<GameCoverProps> = ({ src, name, width, ...rest }) => {
  return <Image src={src} width={80} fallback={URLS.BGG_NO_IMAGE} title={`Cover for: ${name}`} {...rest} />;
};
