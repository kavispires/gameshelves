type UnshelvedGamesProps = {
  /**
   * Displays more or less game boxes ranging from 0 to 75
   */
  quantity: number;
};

export function UnshelvedGames({ quantity }: UnshelvedGamesProps) {
  return (
    <g>
      {quantity > 0 && <path fill="#2a9d8f" d="M218.36 330.07h47.41v7.62h-47.41z"></path>}
      {quantity > 3 && <path fill="#e76f51" d="M220.69 322.44h42.75v7.62h-42.75z"></path>}
      {quantity > 5 && <path fill="#e9c46a" d="M223.64 314.82h42.75v7.62h-42.75z"></path>}
      {quantity > 10 && <path fill="#2a9d8f" d="M225.35 307.19h35.77v7.62h-35.77z"></path>}
      {quantity > 15 && <path fill="#8ab17d" d="M219.91 299.57h42.75v7.62h-42.75z"></path>}
      {quantity > 20 && <path fill="#f4a261" d="M228.79 291.94h23.76v7.62h-23.76z"></path>}
      {quantity > 35 && <path fill="#e76f51" d="M233.79 284.32h16.55v7.62h-16.55z"></path>}
      {quantity > 50 && (
        <path fill="#e97c61" d="M269.456 294.999l10.48 41.446-7.388 1.868-10.48-41.446z"></path>
      )}
      {quantity > 75 && (
        <path fill="#2a9d8f" d="M282.858 320.185l11.703 11.703-5.388 5.388-11.703-11.703z"></path>
      )}
    </g>
  );
}
