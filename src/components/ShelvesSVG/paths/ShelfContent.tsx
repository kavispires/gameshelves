import { useMemo } from 'react';

type ShelfContentProps = {
  perShelf: Record<string, ShelfEntry[]>;
};

export function ShelfContent({ perShelf }: ShelfContentProps) {
  const getQuantity = useMemo(() => (id: string) => perShelf?.[id]?.length ?? 0, [perShelf]);

  return (
    <g className="shelf-content">
      <ContentForEwSl0 quantity={getQuantity('ew-sl-0')} />
    </g>
  );
}

type ContentProps = {
  quantity: number;
};

function ContentForEwSl0({ quantity }: ContentProps) {
  return (
    <>
      {quantity > 0 && <path fill="#264653" d="M8.43 28.27h6.39v28.82H8.43z"></path>}
      {quantity > 1 && <path fill="#e76f51" d="M23.18 28.27h6.39v28.82h-6.39z"></path>}
      {quantity > 2 && <path fill="#f4a261" d="M46.56 28.27h6.39v28.82h-6.39z"></path>}
      {quantity > 3 && <path fill="#8ab17d" d="M54.21 28.27h3.19v28.82h-3.19z"></path>}
      {quantity > 4 && <path fill="#e76f51" d="M58.42 28.27h3.19v28.82h-3.19z"></path>}
      {quantity > 5 && <path fill="#e9c46a" d="M15.82 29.99h6.39v27.09h-6.39z"></path>}
      {quantity > 7 && (
        <path fill="#2a9d8f" d="M30.78 39.35h4.68v17.74h-4.68zM73.79 39.35h3.5v17.74h-3.5z"></path>
      )}
      {quantity > 9 && <path fill="#264653" d="M36.55 31.04h8.82v26.05h-8.82z"></path>}
      {quantity > 10 && <path fill="#f4a261" d="M62.6 32.4h10.21v24.68H62.6z"></path>}
    </>
  );
}
