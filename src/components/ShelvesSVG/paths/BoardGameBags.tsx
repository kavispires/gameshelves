import { SHELVES_IDS } from 'utils/constants';

const { width, height } = SHELVES_IDS['board-game-bags'].dimensions;
const colors = ['#264653', '#315c63'];
const bagWidth = width / colors.length;

export function BoardGameBags() {
  return (
    <g stroke="#19343e" strokeWidth="6">
      {colors.map((color, index) => (
        <rect
          key={color}
          x={index * bagWidth}
          y="70"
          width={bagWidth}
          height={height - 70}
          rx="16"
          fill={color}
        />
      ))}
    </g>
  );
}

export function BoardGameBagsDetails() {
  return (
    <g fill="none" stroke="#19343e" strokeWidth="9" pointerEvents="none">
      {colors.map((color, index) => {
        const x = index * bagWidth;
        return (
          <g key={color} transform={`translate(${x} 0) scale(${bagWidth / 600} 1)`}>
            <path d="M190 95V46a36 36 0 0 1 36-36h148a36 36 0 0 1 36 36v49" />
            <path d={`M145 75v${height - 80}m310-${height - 80}v${height - 80}`} strokeWidth="15" />
            <path d="M20 100h560" stroke="#9cbbb8" strokeWidth="4" />
            <rect x="530" y="90" width="28" height="25" rx="4" fill="#a5bfbd" strokeWidth="3" />
          </g>
        );
      })}
    </g>
  );
}
