import { Tag } from 'antd';

type GameTypeTagProps = {
  containedGames: ContainedGameEntry[];
};

const contains = (games: ContainedGameEntry[], gameType: GameType) =>
  games.some((game) => game.type === gameType);

export function GameTypeTag({ containedGames }: GameTypeTagProps) {
  const moreEntries = containedGames.length > 0 ? '+' : '';
  if (contains(containedGames, 'big-box')) {
    return <Tag color="gold">Big Box{moreEntries}</Tag>;
  }

  if (contains(containedGames, 'base')) {
    return <Tag color="blue">Base Game{moreEntries}</Tag>;
  }

  if (contains(containedGames, 'expansion')) {
    return <Tag color="geek-blue">Expansion{moreEntries}</Tag>;
  }

  if (contains(containedGames, 'mini-expansion')) {
    return <Tag color="cyan">Big Box{moreEntries}</Tag>;
  }

  if (contains(containedGames, 'upgrade')) {
    return <Tag color="orange">Upgrade{moreEntries}</Tag>;
  }
  return <Tag>Other{moreEntries}</Tag>;
}
