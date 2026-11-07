export const queryKeys = {
  shelvedGames: ['general', 'shelved-games'] as const,
  images: ['general', 'images'] as const,
  game: (id: GameId) => ['games', id] as const,
};
