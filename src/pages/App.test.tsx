import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import type { User } from 'firebase/auth';
import Papa from 'papaparse';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthUser } from '../test/auth';
import { csvRow, library, promosLibrary, shelfEntry } from '../test/fixtures';
import type { Library, LibraryContent } from '../types/library';
import { App } from './App';

const service = vi.hoisted(() => ({
  auth: {},
  signIn: vi.fn<(email: string, password: string) => Promise<void>>(),
  getLibrary: vi.fn<() => Promise<Library>>(),
  saveLibrary: vi.fn<(base: Library, next: LibraryContent) => Promise<Library>>(),
}));
vi.mock('services/firebase', () => service);

const authSdk = vi.hoisted(() => ({
  onAuthStateChanged:
    vi.fn<
      (auth: unknown, onUser: (user: User | null) => void, onError: (error: Error) => void) => () => void
    >(),
}));
vi.mock('firebase/auth', () => authSdk);

let updateAuth: (user: User | null) => void;
let failAuth: (error: Error) => void;
let initialUser: User | null | undefined;
const unsubscribe = vi.fn();

beforeEach(() => {
  initialUser = createAuthUser();
  authSdk.onAuthStateChanged.mockImplementation((_auth, onUser, onError) => {
    updateAuth = onUser;
    failAuth = onError;
    if (initialUser !== undefined) onUser(initialUser);
    return unsubscribe;
  });
  service.signIn.mockReset().mockResolvedValue();
  service.getLibrary.mockResolvedValue(library);
  service.saveLibrary.mockImplementation(async (_base, next) => ({ ...next, revision: crypto.randomUUID() }));
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
  it('keeps overview furniture colors neutral and highlights only a selected shelf location', async () => {
    await navigate('/');
    const overview = await screen.findByRole('region', { name: 'Board game shelves' });
    expect(overview.querySelectorAll('[data-active-shelf]')).toHaveLength(0);

    fireEvent.click(screen.getByRole('link', { name: 'Shelves' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Select shelf ww-cl-0' }));
    await screen.findByRole('heading', { name: 'West Wall Left Cabinet 0' });
    const selected = screen.getByRole('region', { name: 'Board game shelves' });
    expect(selected.querySelectorAll('[data-active-shelf]')).toHaveLength(1);
    expect(selected.querySelector('[data-active-shelf]')).toHaveAttribute('data-active-shelf', 'ww-cl-0');
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
  });

  it('uses separate game and box routes with the correct navigation selection', async () => {
    await navigate('/');
    expect(await screen.findByRole('heading', { name: 'Find Game' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find Game' })).toHaveAttribute('aria-current', 'page');
    const search = await screen.findByRole('combobox');
    fireEvent.change(search, { target: { value: 'Test' } });
    fireEvent.mouseDown(search);
    fireEvent.click(await screen.findByText('Test Game [base]'));
    expect(await screen.findByRole('heading', { name: 'Original box' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/games/1');
    expect(screen.getByRole('link', { name: 'Find Game' })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('link', { name: 'Test Game' }));
    await waitFor(() => expect(window.location.hash).toBe('#/boxes/1'));
    expect(screen.getByRole('link', { name: 'Shelves' })).toHaveAttribute('aria-current', 'page');
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
  });

  it('navigates through all five menu entries and highlights the current page', async () => {
    await navigate('/');
    const navigation = screen.getByRole('navigation', { name: 'Main' });
    expect(
      within(navigation)
        .getAllByRole('link')
        .map((link) => link.textContent?.trim()),
    ).toEqual(['Find Game', 'Game Night', 'Shelves', 'Friends', 'Settings']);

    for (const [label, path] of [
      ['Game Night', '/game-night'],
      ['Shelves', '/shelves'],
      ['Friends', '/friends'],
      ['Settings', '/settings'],
      ['Find Game', '/'],
    ]) {
      const link = within(navigation).getByRole('link', { name: label });
      fireEvent.click(link);
      expect(await screen.findByRole('heading', { name: label })).toBeInTheDocument();
      expect(window.location.hash).toBe(`#${path}`);
      expect(link).toHaveAttribute('aria-current', 'page');
      expect(
        within(navigation)
          .getAllByRole('link')
          .filter((item) => item.hasAttribute('aria-current')),
      ).toHaveLength(1);
    }
  });

  it.each([
    ['/game-night', 'Game Night', 'Game night planning and game suggestions are coming soon.'],
    ['/friends', 'Friends', 'Friends and their game ratings are coming soon.'],
  ])('opens placeholder %s directly', async (path, title, description) => {
    await navigate(path);
    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('opens compact navigation and closes it after choosing a route', async () => {
    await navigate('/');
    const trigger = screen.getByRole('button', { name: 'Open navigation' });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const menu = await screen.findByRole('menu');
    fireEvent.click(within(menu).getByRole('link', { name: 'Friends' }));
    expect(await screen.findByRole('heading', { name: 'Friends' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/friends');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it.each([
    ['/home', '/', 'Find Game'],
    ['/sync', '/settings', 'Settings'],
  ])('redirects legacy route %s to %s', async (path, destination, title) => {
    await navigate(path);
    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
    expect(window.location.hash).toBe(`#${destination}`);
    expect(screen.getByRole('link', { name: title })).toHaveAttribute('aria-current', 'page');
  });

  it('opens shelf tables from mouse and keyboard selection and moves existing boxes into them', async () => {
    await navigate('/shelves');
    const path = await screen.findByRole('button', { name: 'Select shelf ew-cl-0' });
    fireEvent.click(path);
    expect(await screen.findByRole('heading', { name: 'East Wall Left Cabinet 0' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Test Game' })[0]).toHaveAttribute('href', '#/boxes/1');
    fireEvent.click(screen.getByRole('link', { name: 'All shelves' }));
    fireEvent.keyDown(await screen.findByRole('button', { name: 'Select shelf ww-cl-0' }), { key: 'Enter' });
    expect(await screen.findByRole('heading', { name: 'West Wall Left Cabinet 0' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add boxes' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: 'Boxes to add' }));
    fireEvent.change(within(dialog).getByRole('combobox', { name: 'Boxes to add' }), {
      target: { value: 'Test' },
    });
    fireEvent.click(await screen.findByText('Test Game'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add boxes' }));
    await waitFor(() =>
      expect(service.saveLibrary).toHaveBeenCalledWith(library, {
        games: library.games,
        boxes: { '1': { ...library.boxes['1'], shelfId: 'ww-cl-0', updatedAt: expect.any(Number) } },
      }),
    );
  });

  it.each([
    ['tv-cl-0', 'TV Shelf Upper Left', 'TV shelf'],
    ['garage-container', 'Garage container', 'Garage container'],
    ['board-game-bags', 'Board game bags', 'Board game bags'],
  ])(
    'assigns a box to %s and shows only its cached location without rereading',
    async (shelfId, locationName, svgName) => {
      await navigate('/shelves');
      fireEvent.click(await screen.findByRole('button', { name: `Select shelf ${shelfId}` }));
      expect(await screen.findByRole('heading', { name: locationName })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Add boxes' }));
      const dialog = screen.getByRole('dialog');
      fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: 'Boxes to add' }));
      fireEvent.change(within(dialog).getByRole('combobox', { name: 'Boxes to add' }), {
        target: { value: 'Test' },
      });
      fireEvent.click(await screen.findByText('Test Game'));
      fireEvent.click(within(dialog).getByRole('button', { name: 'Add boxes' }));
      await waitFor(() =>
        expect(service.saveLibrary).toHaveBeenCalledWith(library, {
          games: library.games,
          boxes: { '1': { ...library.boxes['1'], shelfId, updatedAt: expect.any(Number) } },
        }),
      );
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      fireEvent.click(screen.getByRole('link', { name: 'Find Game' }));
      const search = await screen.findByRole('combobox', { name: 'Find a game' });
      fireEvent.change(search, { target: { value: 'Test' } });
      fireEvent.mouseDown(search);
      fireEvent.click(await screen.findByText('Test Game [base]'));
      expect(await screen.findByText(`Current location: ${locationName}`)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: svgName })).toBeInTheDocument();
      for (const other of [
        'East shelf',
        'West shelf',
        'TV shelf',
        'Unshelved games',
        'Garage container',
        'Board game bags',
      ]) {
        if (other !== svgName) expect(screen.queryByRole('img', { name: other })).not.toBeInTheDocument();
      }
      expect(service.getLibrary).toHaveBeenCalledTimes(1);
      expect(library.boxes['1'].shelfId).toBe('ew-cl-0');
    },
  );

  it.each([
    { path: '/shelves/1', data: library, destination: '/boxes/1' },
    { path: '/shelves/promos', data: promosLibrary, destination: '/boxes/promos' },
    { path: '/shelves/1', data: promosLibrary, destination: '/games/1' },
  ])('redirects the old detail URL $path to $destination', async ({ path, data, destination }) => {
    service.getLibrary.mockResolvedValue(data);
    await navigate(path);
    await waitFor(() => expect(window.location.hash).toBe(`#${destination}`));
    expect(
      await screen.findByRole('heading', {
        name: destination.endsWith('promos') ? 'Promos shoe box' : 'Test Game',
      }),
    ).toBeInTheDocument();
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
  });

  it.each(['/boxes/1', '/games/promos'])('does not confuse a game with a box at %s', async (path) => {
    service.getLibrary.mockResolvedValue(promosLibrary);
    await navigate(path);
    expect(await screen.findByText('404')).toBeInTheDocument();
  });

  it('keeps legacy loose games out of box routes and redirects their old URLs to games', async () => {
    service.getLibrary.mockResolvedValue({
      revision: null,
      games: {},
      boxes: {},
      legacy: { images: {}, shelves: { '1': { ...shelfEntry, box: 'none', shelfId: 'unshelved' } } },
    });
    await navigate('/shelves/1');
    expect(await screen.findByRole('heading', { name: 'Test Game' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/games/1');
    expect(screen.getByText('Not assigned to a box.')).toBeInTheDocument();
    act(() => {
      window.location.hash = '/boxes/1';
    });
    expect(await screen.findByText('404')).toBeInTheDocument();
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
  });

  it('switches the shelf overview to a complete table and preserves placement on failed removal before retry', async () => {
    await navigate('/shelves');
    fireEvent.click(await screen.findByRole('radio', { name: 'Table' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/shelves?view=table');
    expect(screen.queryByRole('group', { name: 'East shelf' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Test Game' })[0]).toHaveAttribute('href', '#/boxes/1');
    fireEvent.click(screen.getByRole('button', { name: 'Unshelve Test Game' }));
    expect(service.saveLibrary).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(service.saveLibrary).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Unshelve Test Game' }));
    service.saveLibrary.mockRejectedValueOnce(new Error('Placement save failed'));
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(await screen.findByText('Placement save failed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'East Wall Left Cabinet 0' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Unshelve Test Game' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(await screen.findByRole('link', { name: 'Yet to be shelved' })).toBeInTheDocument();
    expect(service.saveLibrary.mock.lastCall?.[1]).toMatchObject({
      games: library.games,
      boxes: { '1': { ...library.boxes['1'], shelfId: 'unshelved', updatedAt: expect.any(Number) } },
    });
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
  });

  it('saves a pasted cover URL with the box and reuses it across cached pages', async () => {
    const base: Library = {
      ...library,
      games: { '1': { ...library.games['1'], image: '', thumbnail: '' } },
    };
    service.getLibrary.mockResolvedValue(base);
    await navigate('/games/1');
    const imageUrl = await screen.findByLabelText('Image URL');
    const url = 'https://cf.geekdo-images.com/example/pic123.jpg';
    expect(screen.getByRole('link', { name: 'View on BoardGameGeek' })).toHaveAttribute(
      'href',
      'https://boardgamegeek.com/boardgame/1',
    );
    fireEvent.change(imageUrl, { target: { value: ` ${url} ` } });
    expect(service.saveLibrary).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Save box' }));
    await waitFor(() => expect(screen.getByRole('img', { name: 'Test Game' })).toHaveAttribute('src', url));
    expect(service.saveLibrary.mock.lastCall?.[1]).toMatchObject({
      games: { '1': { image: url, thumbnail: url } },
      boxes: { '1': { ...library.boxes['1'], updatedAt: expect.any(Number) } },
    });
    fireEvent.click(screen.getByRole('link', { name: 'Find Game' }));
    const search = await screen.findByRole('combobox', { name: 'Find a game' });
    fireEvent.change(search, { target: { value: 'Test' } });
    fireEvent.mouseDown(search);
    fireEvent.click(await screen.findByText('Test Game [base]'));
    expect(await screen.findByLabelText('Image URL')).toHaveValue(url);
    expect(screen.getByRole('img', { name: 'Test Game' })).toHaveAttribute('src', url);
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
    expect(base.games['1'].image).toBe('');
  });

  it('clears a thumbnail-only cover without creating a box or retaining the old image', async () => {
    const base: Library = {
      ...library,
      boxes: {},
      games: { '1': { ...library.games['1'], image: '' } },
    };
    service.getLibrary.mockResolvedValue(base);
    await navigate('/games/1');
    expect(await screen.findByLabelText('Image URL')).toHaveValue(base.games['1'].thumbnail);
    expect(screen.getByRole('img', { name: 'Test Game' })).toHaveAttribute('src', base.games['1'].thumbnail);
    fireEvent.change(screen.getByLabelText('Image URL'), { target: { value: '' } });
    expect(screen.getByRole('button', { name: 'Save game details' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Save game details' }));
    await waitFor(() =>
      expect(service.saveLibrary.mock.lastCall?.[1]).toMatchObject({
        games: { '1': { image: '', thumbnail: '' } },
        boxes: {},
      }),
    );
  });

  it('rejects invalid cover URLs and lets an unassigned game save or clear its cover without creating a box', async () => {
    const base: Library = { ...library, boxes: {} };
    service.getLibrary.mockResolvedValue(base);
    await navigate('/games/1');
    const imageUrl = await screen.findByLabelText('Image URL');
    for (const invalid of ['not-an-image-url', 'javascript:alert(1)']) {
      fireEvent.change(imageUrl, { target: { value: invalid } });
      fireEvent.click(screen.getByRole('button', { name: 'Save game details' }));
      expect(await screen.findByText(/Enter a complete HTTP or HTTPS image URL/)).toBeInTheDocument();
      expect(service.saveLibrary).not.toHaveBeenCalled();
    }
    const url = 'https://cf.geekdo-images.com/example/cover.jpg';
    fireEvent.change(imageUrl, { target: { value: url } });
    service.saveLibrary.mockRejectedValueOnce(new Error('Cover save failed'));
    fireEvent.click(screen.getByRole('button', { name: 'Save game details' }));
    expect(await screen.findByText('Cover save failed')).toBeInTheDocument();
    expect(screen.getByLabelText('Image URL')).toHaveValue(url);
    expect(screen.getByRole('img', { name: 'Test Game' })).toHaveAttribute('src', base.games['1'].image);
    fireEvent.click(screen.getByRole('button', { name: 'Save game details' }));
    await waitFor(() => expect(screen.getByRole('img', { name: 'Test Game' })).toHaveAttribute('src', url));
    expect(service.saveLibrary.mock.lastCall?.[1]).toMatchObject({
      games: { '1': { image: url, thumbnail: url } },
      boxes: {},
    });
    fireEvent.change(screen.getByLabelText('Image URL'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save game details' }));
    await waitFor(() => expect(screen.getByLabelText('Image URL')).toHaveValue(''));
    await waitFor(() =>
      expect(service.saveLibrary.mock.lastCall?.[1]).toMatchObject({
        games: { '1': { image: '', thumbnail: '' } },
        boxes: {},
      }),
    );
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
  });

  it('keeps restored sessions working under Strict Mode', async () => {
    window.location.hash = '/';
    const view = render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    expect(await screen.findByRole('combobox')).toBeInTheDocument();
    expect(unsubscribe).toHaveBeenCalled();
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(2);
  });

  it('redirects the old login route home for authenticated visitors', async () => {
    await navigate('/login');
    expect(await screen.findByRole('combobox')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/');
  });

  it.each([
    '/not-a-route',
    '/shelves/missing',
    '/boxes/missing',
    '/games/missing',
    '/boxes/toString',
    '/games/__proto__',
    '/shelves/constructor',
  ])('renders route %s without crashing', async (path) => {
    await navigate(path);
    expect(await screen.findByText('404')).toBeInTheDocument();
  });

  it('previews direct CSV, requires complete/deletion confirmation, and preserves data on save failure and retry', async () => {
    await navigate('/settings');
    const uploadRequest = vi.spyOn(XMLHttpRequest.prototype, 'open');
    const file = new File([Papa.unparse([csvRow])], 'collection.csv', { type: 'text/csv' });
    Object.defineProperty(file, 'text', { value: () => Promise.resolve(Papa.unparse([csvRow])) });
    fireEvent.change(await screen.findByLabelText('BGG collection CSV'), { target: { files: [file] } });
    expect(await screen.findByRole('region', { name: 'Import preview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose CSV file' })).toBeInTheDocument();
    expect(screen.getByText('collection.csv')).toBeInTheDocument();
    expect(uploadRequest).not.toHaveBeenCalled();
    const review = screen.getByRole('button', { name: 'Review and save import' });
    expect(review).toBeDisabled();
    expect(service.saveLibrary).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('checkbox', { name: /complete collection/ }));
    expect(review).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: /confirm deleting/ }));
    fireEvent.click(review);
    service.saveLibrary.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm import' }));
    expect(await screen.findByText('offline')).toBeInTheDocument();
    fireEvent.click(review);
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm import' }));
    expect(await screen.findByText('Collection imported successfully')).toBeInTheDocument();
    expect(service.saveLibrary.mock.lastCall?.[1]).toMatchObject({
      games: { '2': { id: '2', name: 'Imported Game', type: 'base' } },
      boxes: {},
    });
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('link', { name: 'Find Game' }));
    const search = await screen.findByRole('combobox');
    fireEvent.change(search, { target: { value: 'Imported' } });
    fireEvent.mouseDown(search);
    fireEvent.click(await screen.findByText('Imported Game [base]'));
    expect(await screen.findByText('Not assigned to a box.')).toBeInTheDocument();
  });

  it('reloads saved data without a CSV or writes, and discards an unsaved preview', async () => {
    await navigate('/settings');
    const reload = await screen.findByRole('button', { name: 'Reload saved library' });
    await waitFor(() => expect(reload).toBeEnabled());
    fireEvent.click(reload);
    await waitFor(() => expect(service.getLibrary).toHaveBeenCalledTimes(2));
    expect(service.saveLibrary).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Review and save import' })).not.toBeInTheDocument();
    const file = new File([], 'collection.csv', { type: 'text/csv' });
    Object.defineProperty(file, 'text', { value: () => Promise.resolve(Papa.unparse([csvRow])) });
    fireEvent.change(screen.getByLabelText('BGG collection CSV'), { target: { files: [file] } });
    expect(await screen.findByRole('region', { name: 'Import preview' })).toBeInTheDocument();
    fireEvent.click(reload);
    await waitFor(() => expect(service.getLibrary).toHaveBeenCalledTimes(3));
    expect(screen.queryByRole('region', { name: 'Import preview' })).not.toBeInTheDocument();
    expect(screen.queryByText('collection.csv')).not.toBeInTheDocument();
    expect(service.saveLibrary).not.toHaveBeenCalled();
  });

  it('edits the promos shoe box and can remove its first and only contained game', async () => {
    service.getLibrary.mockResolvedValue(promosLibrary);
    await navigate('/boxes/promos');
    expect(await screen.findByRole('heading', { name: 'Promos shoe box' })).toBeInTheDocument();
    expect(screen.getByLabelText('Games in box')).toBeInTheDocument();
    expect(screen.queryByLabelText('Game classification')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Image URL')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'East shelf' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'West shelf' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save box' }));
    await waitFor(() =>
      expect(service.saveLibrary).toHaveBeenCalledWith(promosLibrary, {
        games: promosLibrary.games,
        boxes: { promos: { ...promosLibrary.boxes.promos, updatedAt: expect.any(Number) } },
      }),
    );
    fireEvent.click(screen.getByRole('link', { name: 'Test Game' }));
    expect(await screen.findByRole('heading', { name: 'Test Game' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Promos shoe box' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'East shelf' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'TV shelf' })).not.toBeInTheDocument();
    const savedBeforeRemoval = service.saveLibrary.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Remove from box' }));
    await waitFor(() => expect(screen.getByText('Remove this game from its box?')).toBeVisible());
    expect(service.saveLibrary).toHaveBeenCalledTimes(savedBeforeRemoval);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument());
    expect(service.saveLibrary).toHaveBeenCalledTimes(savedBeforeRemoval);
    expect(screen.queryByText('Not assigned to a box.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove from box' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(await screen.findByText('Not assigned to a box.')).toBeInTheDocument();
    expect(service.saveLibrary.mock.lastCall?.[1]).toMatchObject({
      games: promosLibrary.games,
      boxes: { promos: { mainGameId: null, name: 'Promos shoe box', contains: [] } },
    });
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
  });
  it('creates a measured box after import without accepting partial dimensions', async () => {
    service.getLibrary.mockResolvedValue({ ...library, boxes: {} });
    await navigate('/games/1');
    fireEvent.click(await screen.findByRole('button', { name: 'Create original box' }));
    fireEvent.change(screen.getByLabelText('Width (mm)'), { target: { value: '300' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save box' }));
    expect(await screen.findByText(/Enter all three positive dimensions/)).toBeInTheDocument();
    expect(service.saveLibrary).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Height (mm)'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Depth (mm)'), { target: { value: '300' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save box' }));
    await waitFor(() =>
      expect(service.saveLibrary).toHaveBeenCalledWith(
        { ...library, boxes: {} },
        expect.objectContaining({
          boxes: {
            '1': expect.objectContaining({
              contains: ['1'],
              dimensions: { width: 300, height: 80, depth: 300 },
            }),
          },
        }),
      ),
    );
  });
});

describe('authentication gate', () => {
  it.each([
    '/',
    '/home',
    '/login',
    '/game-night',
    '/shelves',
    '/shelves/ew-cl-0',
    '/boxes/1',
    '/games/1',
    '/friends',
    '/settings',
    '/sync',
    '/not-a-route',
  ])('does not mount navigation or read Firestore before authentication at %s', async (path) => {
    initialUser = undefined;
    await navigate(path);
    expect(screen.getByRole('status', { name: 'Verifying auth...' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(service.getLibrary).not.toHaveBeenCalled();

    act(() => updateAuth(null));
    expect(screen.getByText('You are not logged in')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(service.getLibrary).not.toHaveBeenCalled();
    expect(window.location.hash).toBe(`#${path}`);
  });

  it('validates credentials, reports failure and resumes the original URL after observed sign-in', async () => {
    initialUser = null;
    await navigate('/games/1');
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    const dialog = screen.getByRole('dialog');
    const login = within(dialog).getByRole('button', { name: 'Login' });
    fireEvent.click(login);
    expect(await screen.findByText('Enter your email.')).toBeInTheDocument();
    expect(await screen.findByText('Enter your password.')).toBeInTheDocument();
    expect(service.signIn).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'not-a-real-password' } });
    fireEvent.submit(screen.getByRole('form', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email.')).toBeInTheDocument();
    expect(service.signIn).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'test@example.com' } });
    service.signIn.mockRejectedValueOnce(new Error('Invalid credentials'));
    fireEvent.click(login);
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(service.getLibrary).not.toHaveBeenCalled();

    let finishSignIn: () => void = () => {
      throw new Error('Sign-in was not started');
    };
    service.signIn.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishSignIn = resolve;
        }),
    );
    fireEvent.click(login);
    await waitFor(() => expect(login).toBeDisabled());
    fireEvent.click(login);
    expect(service.signIn).toHaveBeenCalledTimes(2);
    await act(async () => finishSignIn());
    expect(screen.getByText('You are not logged in')).toBeInTheDocument();
    expect(service.getLibrary).not.toHaveBeenCalled();

    act(() => updateAuth(createAuthUser()));
    expect(await screen.findByRole('heading', { name: 'Original box' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/games/1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('discards credentials when the login modal is dismissed', async () => {
    initialUser = null;
    await navigate('/');
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'discard-this-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('surfaces observer errors without mounting data queries', async () => {
    initialUser = undefined;
    await navigate('/');
    act(() => failAuth(new Error('Auth unavailable')));
    expect(screen.getByText('Unable to verify authentication')).toBeInTheDocument();
    expect(screen.getByText('Auth unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(service.getLibrary).not.toHaveBeenCalled();
  });

  it('drops cached data on account changes and sign-out, including late reads', async () => {
    let finishOldRead: (data: Library) => void = () => {
      throw new Error('Old read was not started');
    };
    service.getLibrary.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishOldRead = resolve;
        }),
    );
    await navigate('/games/1');
    await waitFor(() => expect(service.getLibrary).toHaveBeenCalledTimes(1));

    const changed = { ...library, games: { '1': { ...library.games['1'], name: 'Other session game' } } };
    service.getLibrary.mockResolvedValue(changed);
    act(() => updateAuth(createAuthUser('other-user')));
    expect(await screen.findByRole('heading', { name: 'Other session game' })).toBeInTheDocument();
    await act(async () => finishOldRead(library));
    expect(screen.getByRole('heading', { name: 'Other session game' })).toBeInTheDocument();

    act(() => updateAuth(null));
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByText('You are not logged in')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const previousReads = service.getLibrary.mock.calls.length;
    service.getLibrary.mockResolvedValue({ revision: 'empty', games: {}, boxes: {} });
    act(() => updateAuth(createAuthUser('other-user')));
    expect(await screen.findByText('404')).toBeInTheDocument();
    expect(service.getLibrary.mock.calls.length).toBeGreaterThan(previousReads);
  });
});
