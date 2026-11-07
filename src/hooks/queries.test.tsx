import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { catalogGame, library, promosLibrary } from '../test/fixtures';
import type { Library, LibraryContent } from '../types/library';
import { queryKeys } from './queryKeys';
import { useLibrary, useSaveLibrary } from './useLibrary';
import { useMutateShelvedGames } from './useMutateShelvedGames';
import { useQueryImages } from './useQueryImages';
import { useQueryShelvedGames } from './useQueryShelvedGames';

const service = vi.hoisted(() => ({
  getLibrary: vi.fn<() => Promise<Library>>(),
  saveLibrary: vi.fn<(base: Library, next: LibraryContent) => Promise<Library>>(),
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
  service.getLibrary.mockResolvedValue(library);
  service.saveLibrary.mockImplementation(async (_base, next) => ({ ...next, revision: 'saved' }));
});

describe('shared session library cache', () => {
  it('shares one load across hooks and remounts, including expansion search and covers', async () => {
    service.getLibrary.mockResolvedValue({
      ...library,
      games: { ...library.games, '2': { ...catalogGame, id: '2', name: 'Expansion' } },
      boxes: { '1': { ...library.boxes['1'], contains: ['1', '2'] } },
    });
    const { wrapper } = harness();
    const view = renderHook(() => ({ shelves: useQueryShelvedGames(), images: useQueryImages() }), {
      wrapper,
    });
    await waitFor(() => expect(view.result.current.shelves.isSuccess).toBe(true));
    expect(view.result.current.shelves.searchOptions.map((option) => option.value)).toEqual(['2', '1']);
    expect(view.result.current.images.getCover('1')).toBe(catalogGame.image);
    view.unmount();
    const again = renderHook(() => useLibrary(), { wrapper });
    await waitFor(() => expect(again.result.current.isSuccess).toBe(true));
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
  });

  it('sets the whole library cache after saves without invalidating or rereading it', async () => {
    const { wrapper, client } = harness();
    const { result } = renderHook(() => ({ query: useLibrary(), save: useSaveLibrary() }), { wrapper });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    const next = { games: { '1': { ...catalogGame, name: 'Updated game' } }, boxes: {} };
    await act(async () => {
      await result.current.save.mutateAsync({ base: library, next });
    });
    expect(client.getQueryData(queryKeys.library)).toEqual({ ...next, revision: 'saved' });
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
  });

  it('adapts shelf placement writes into atomic shared-library writes', async () => {
    const { wrapper } = harness();
    const { result } = renderHook(() => ({ query: useQueryShelvedGames(), save: useMutateShelvedGames() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    const entry = result.current.query.response['1'];
    await act(async () => {
      await result.current.save.mutateAsync({ '1': { ...entry, shelfId: 'unshelved' } });
    });
    expect(service.saveLibrary).toHaveBeenCalledWith(library, {
      games: library.games,
      boxes: { '1': { ...library.boxes['1'], shelfId: 'unshelved' } },
    });
    await waitFor(() => expect(result.current.query.perShelf.unshelved).toHaveLength(1));
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
  });

  it('surfaces failed writes and retains the successful cached snapshot', async () => {
    const { wrapper } = harness();
    const { result } = renderHook(() => ({ query: useLibrary(), save: useSaveLibrary() }), { wrapper });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    service.saveLibrary.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await expect(
        result.current.save.mutateAsync({ base: library, next: { games: {}, boxes: {} } }),
      ).rejects.toThrow('offline');
    });
    expect(result.current.query.data).toEqual(library);
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
  });

  it('preserves the promos container identity, label and measurements when moving shelves', async () => {
    service.getLibrary.mockResolvedValue(promosLibrary);
    const { wrapper } = harness();
    const { result } = renderHook(() => ({ query: useQueryShelvedGames(), save: useMutateShelvedGames() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    const entry = result.current.query.response.promos;
    await act(async () => {
      await result.current.save.mutateAsync({ promos: { ...entry, shelfId: 'unshelved' } });
    });
    expect(service.saveLibrary).toHaveBeenCalledWith(promosLibrary, {
      games: promosLibrary.games,
      boxes: { promos: { ...promosLibrary.boxes.promos, shelfId: 'unshelved' } },
    });
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
  });
});
