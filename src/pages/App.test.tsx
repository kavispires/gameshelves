import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { csvRow, shelfEntry, xmlRow } from '../test/fixtures';
import { App } from './App';

const service = vi.hoisted(() => ({
  getShelvedGames: vi.fn<() => Promise<Record<string, ShelfEntry>>>(),
  getImages: vi.fn<() => Promise<Record<string, GameImages>>>(),
  saveShelvedGames: vi.fn<() => Promise<void>>(),
  saveGames: vi.fn<(games: GameEntry[]) => Promise<void>>(),
}));
vi.mock('services/firebase', () => service);

beforeEach(() => {
  service.getShelvedGames.mockResolvedValue({ '1': shelfEntry });
  service.getImages.mockResolvedValue({});
  service.saveShelvedGames.mockResolvedValue();
  service.saveGames.mockResolvedValue();
  const getComputedStyle = window.getComputedStyle;
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => getComputedStyle(element));
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function navigate(path: string) {
  window.location.hash = path;
  render(
    <ConfigProvider theme={{ token: { motion: false } }}>
      <App />
    </ConfigProvider>,
  );
}

describe('modernized routes and Ant Design controls', () => {
  it('renders home/search and navigates to the selected game', async () => {
    await navigate('/');
    const search = await screen.findByRole('combobox');
    fireEvent.change(search, { target: { value: 'Test' } });
    fireEvent.mouseDown(search);
    fireEvent.click(await screen.findByText('Test Game [base] :: BOX'));
    expect(await screen.findByText('This is a boxed game instance.')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/shelves/1');
  });

  it('opens the shelf modal from mouse and keyboard interactions', async () => {
    await navigate('/shelves');
    const path = await screen.findByRole('button', { name: 'Select shelf ew-cl-0' });
    fireEvent.click(path);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.keyDown(path, { key: 'Enter' });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save Shelf' }));
    await waitFor(() => expect(service.saveShelvedGames).toHaveBeenCalledWith({ '1': shelfEntry }, false));
  });

  it.each(['/login', '/not-a-route', '/shelves/missing'])(
    'renders route %s without crashing',
    async (path) => {
      await navigate(path);
      expect(await screen.findByText(path === '/login' ? 'Login content' : '404')).toBeInTheDocument();
    },
  );

  it('completes CSV/XML import, classification, failed save and retry with mocked Firebase', async () => {
    await navigate('/sync');
    fireEvent.change(await screen.findByPlaceholderText('Paste JSON for BGG Collection'), {
      target: { value: JSON.stringify([csvRow]) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(await screen.findByPlaceholderText('Paste JSON for BGG XML Collection'), {
      target: { value: JSON.stringify({ item: [xmlRow] }) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add New Only' }));
    fireEvent.click(await screen.findByRole('radio', { name: 'base' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Data' }));
    const confirmation = await screen.findByRole('tooltip');
    fireEvent.click(within(confirmation).getByRole('button', { name: 'OK' }));
    service.saveGames.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(await screen.findByRole('button', { name: 'Save 1 games' }));
    expect(await screen.findByText('Failed to save games')).toBeInTheDocument();
    expect(await screen.findByText('offline')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save 1 games' }));
    expect(await screen.findByText('New games added successfully')).toBeInTheDocument();
    expect(service.saveGames.mock.lastCall?.[0]).toEqual([
      expect.objectContaining({ id: '2', name: 'Imported Game', type: 'base' }),
    ]);
  });
});
