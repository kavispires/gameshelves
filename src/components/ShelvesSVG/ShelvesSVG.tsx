import clsx from 'clsx';
import { ActiveShelves } from './paths/ActiveShelves';
import { ClickableAreas } from './paths/ClickableAreas';
import { EastShelf } from './paths/EastShelf';
import { ShelfContent } from './paths/ShelfContent';
import { UnshelvedGames } from './paths/UnshelvedGames';
import { WestShelf } from './paths/WestShelf';
import { Window } from './paths/Window';

type ShelvesSVGProps = {
  active?: ShelfId[];
  perShelf?: Record<ShelfId, ShelfEntry[]>;
  className?: string;
  onSelectShelf?: (id: ShelfId) => void;
};

export function ShelvesSVG({ active, perShelf, className, onSelectShelf, ...rest }: ShelvesSVGProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 768 360"
      role={onSelectShelf ? 'group' : 'img'}
      aria-label="Board game shelves"
      className={clsx('shelves-svg mx-auto my-4 block w-[96%] max-w-[960px]', className)}
      {...rest}
    >
      <Window />
      <WestShelf />
      <EastShelf />
      <UnshelvedGames quantity={100} />
      <ActiveShelves active={active ?? []} />
      <ShelfContent perShelf={perShelf ?? {}} />
      {onSelectShelf && <ClickableAreas onSelectShelf={onSelectShelf} />}
    </svg>
  );
}
