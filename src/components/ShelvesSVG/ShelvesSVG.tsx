import { EastShelf } from './paths/EastShelf';
import { ActiveShelves } from './paths/ActiveShelves';
import { UnshelvedGames } from './paths/UnshelvedGames';
import { WestShelf } from './paths/WestShelf';
import { Window } from './paths/Window';

type ShelvesSVGProps = {
  active?: ShelfId[];
  perShelf?: Record<ShelfId, ShelfEntry[]>;
};

export function ShelvesSVG({ active, perShelf, ...rest }: ShelvesSVGProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 360" {...rest}>
      <Window />
      <WestShelf />
      <EastShelf />
      <UnshelvedGames quantity={100} />
      <ActiveShelves active={active ?? []} />
    </svg>
  );
}
