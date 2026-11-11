import { Tag } from 'antd';
import { GameTypeIcon } from './icons';

type GameTypeTagProps = {
  containedGames: ContainedGameEntry[];
};

const contains = (games: ContainedGameEntry[], gameType: GameType) =>
  games.some((game) => game.type === gameType);

export function GameTypeTag({ containedGames }: GameTypeTagProps) {
  const moreEntries = containedGames.length > 0 ? '+' : '';
  if (contains(containedGames, 'big-box')) {
    return (
      <Tag color="gold" icon={<GameTypeIcon type="big-box" />}>
        Big Box{moreEntries}
      </Tag>
    );
  }

  if (contains(containedGames, 'base')) {
    return (
      <Tag color="blue" icon={<GameTypeIcon type="base" />}>
        Base Game{moreEntries}
      </Tag>
    );
  }

  if (contains(containedGames, 'expansion')) {
    return (
      <Tag color="geek-blue" icon={<GameTypeIcon type="expansion" />}>
        Expansion{moreEntries}
      </Tag>
    );
  }

  if (contains(containedGames, 'mini-expansion')) {
    return (
      <Tag color="cyan" icon={<GameTypeIcon type="mini-expansion" />}>
        Big Box{moreEntries}
      </Tag>
    );
  }

  if (contains(containedGames, 'upgrade')) {
    return (
      <Tag color="orange" icon={<GameTypeIcon type="upgrade" />}>
        Upgrade{moreEntries}
      </Tag>
    );
  }
  return <Tag icon={<GameTypeIcon type="unknown" />}>Other{moreEntries}</Tag>;
}
