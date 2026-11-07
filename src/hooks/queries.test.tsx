import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gameEntry, shelfEntry } from '../test/fixtures';
import { queryKeys } from './queryKeys';
import { useMutateGame } from './useMutateGame';
import { useMutateImages } from './useMutateImages';
import { useMutateShelvedGames } from './useMutateShelvedGames';
import { useQueryGame } from './useQueryGame';
import { useQueryImages } from './useQueryImages';
import { useQueryShelvedGames } from './useQueryShelvedGames';

const service = vi.hoisted(() => ({
  getShelvedGames: vi.fn<() => Promise<Record<string, ShelfEntry>>>(),
  getImages: vi.fn<() => Promise<Record<string, GameImages>>>(),
  getGame: vi.fn<() => Promise<GameEntry>>(),
  saveShelvedGames: vi.fn<() => Promise<void>>(),
  saveImages: vi.fn<() => Promise<void>>(),
  saveGame: vi.fn<() => Promise<void>>(),
}));
vi.mock('services/firebase', () => service);

function harness() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

beforeEach(() => {
  vi.resetAllMocks();
  service.getShelvedGames.mockResolvedValue({ '1': shelfEntry });
  service.getImages.mockResolvedValue({});
  service.getGame.mockResolvedValue(gameEntry);
  service.saveShelvedGames.mockResolvedValue();
  service.saveImages.mockResolvedValue();
  service.saveGame.mockResolvedValue();
});

describe('TanStack query migration', () => {
  it('preserves initial loading, derived shelf data, and visible query failure', async () => {
    const { wrapper } = harness();
    const { result } = renderHook(() => useQueryShelvedGames(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.perShelf['ew-cl-0']).toEqual([shelfEntry]);
    expect(result.current.searchOptions[0].value).toBe('1');

    service.getShelvedGames.mockRejectedValueOnce(new Error('permission-denied'));
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('permission-denied');
    expect(result.current.response).toEqual({ '1': shelfEntry });
  });

  it('refreshes shelved games after a successful replacement write without a manual refetch', async () => {
    const { wrapper } = harness();
    const { result } = renderHook(
      () => ({
        query: useQueryShelvedGames(),
        mutation: useMutateShelvedGames(true),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    service.getShelvedGames.mockResolvedValue({});
    await act(async () => {
      await result.current.mutation.mutateAsync({});
    });
    await waitFor(() => expect(result.current.query.response).toEqual({}));
    expect(service.saveShelvedGames).toHaveBeenCalledWith({}, true);
    expect(result.current.mutation.isSuccess).toBe(true);
  });

  it('refreshes image and game queries using their full array keys', async () => {
    const { wrapper, client } = harness();
    const { result } = renderHook(
      () => ({
        images: useQueryImages(),
        game: useQueryGame('1'),
        saveImages: useMutateImages(),
        saveGame: useMutateGame('1'),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.game.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.images.isSuccess).toBe(true));
    service.getImages.mockResolvedValue({ '1': { thumbnail: 'new.jpg' } });
    service.getGame.mockResolvedValue({ ...gameEntry, name: 'Updated Game' });
    await act(async () => {
      await result.current.saveImages.mutateAsync({ '1': { thumbnail: 'new.jpg' } });
      await result.current.saveGame.mutateAsync({ ...gameEntry, name: 'Updated Game' });
    });
    await waitFor(() => expect(result.current.images.getThumbnail('1')).toBe('new.jpg'));
    expect(client.getQueryData(queryKeys.game('1'))).toEqual({ ...gameEntry, name: 'Updated Game' });
  });

  it('surfaces failed writes and does not invalidate successful cached data', async () => {
    const { wrapper } = harness();
    const { result } = renderHook(
      () => ({
        query: useQueryShelvedGames(),
        mutation: useMutateShelvedGames(),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    service.saveShelvedGames.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await expect(result.current.mutation.mutateAsync({})).rejects.toThrow('offline');
    });
    await waitFor(() => expect(result.current.mutation.isError).toBe(true));
    expect(service.getShelvedGames).toHaveBeenCalledTimes(1);
    expect(result.current.query.response).toEqual({ '1': shelfEntry });
  });
});
