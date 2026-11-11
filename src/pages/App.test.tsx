import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import type { User } from 'firebase/auth';
import Papa from 'papaparse';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthUser } from '../test/auth';
import { csvRow, library, promosLibrary, shelfEntry } from '../test/fixtures';
import type { Library, LibraryContent } from '../types/library';
import { URLS } from '../utils/constants';
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

function tableLibrary(count: number): Library {
  const games = Object.fromEntries(
    Array.from({ length: count }, (_, index) => {
      const id = String(index + 1);
      return [id, { ...library.games['1'], id, name: `Box ${id.padStart(2, '0')}` }];
    }),
  );
  const boxes = Object.fromEntries(
    Object.keys(games).map((id) => [
      id,
      { ...library.boxes['1'], id, contains: [id], shelfId: Number(id) <= 40 ? 'ew-cl-0' : 'tv-cl-0' },
    ]),
  );
  return { ...library, games, boxes };
}

function treeLibrary(): Library {
  const base = tableLibrary(5);
  base.games['1'] = { ...base.games['1'], name: 'An exceptionally long game box' };
  base.games['2'] = { ...base.games['2'], name: 'Hidden expansion', type: 'expansion' };
  base.games['4'] = { ...base.games['4'], type: 'promo' };
  base.boxes['1'] = { ...base.boxes['1'], contains: ['1', '2'] };
  delete base.boxes['2'];
  delete base.boxes['3'];
  delete base.boxes['4'];
  base.boxes.promos = { ...promosLibrary.boxes.promos, contains: ['4'] };
  base.boxes.spare = {
    ...promosLibrary.boxes.promos,
    mainGameId: null,
    id: 'spare',
    name: 'Spare container',
    contains: [],
  };
  return base;
}

async function filterGameColumn(name: RegExp, values: string[] | null) {
  fireEvent.click(within(screen.getByRole('columnheader', { name })).getByRole('button', { name: 'filter' }));
  if (values) {
    for (const value of values) {
      fireEvent.click(await screen.findByRole('menuitem', { name: value }));
    }
  } else {
    fireEvent.click(await screen.findByRole('button', { name: 'Reset' }));
  }
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
}

describe('modernized routes and Ant Design controls', () => {
  it('finds missing images without treating image-only or thumbnail-only games as missing, and resets pagination', async () => {
    const base = tableLibrary(13);
    base.games['1'] = { ...base.games['1'], image: '', thumbnail: '' };
    base.games['2'] = { ...base.games['2'], thumbnail: '' };
    base.games['3'] = { ...base.games['3'], image: '' };
    base.games['4'] = { ...base.games['4'], image: '???', thumbnail: '   ' };
    base.games['5'] = { ...base.games['5'], image: URLS.BGG_NO_IMAGE, thumbnail: '' };
    service.getLibrary.mockResolvedValue(base);
    await navigate('/?page=2&from=bookmark');
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Select Box 12' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Missing images only' }));
    expect(await screen.findByText('3 games')).toBeInTheDocument();
    for (const id of ['01', '04', '05']) {
      expect(screen.getByRole('link', { name: `Box ${id}` })).toBeInTheDocument();
    }
    for (const id of ['02', '03', '12']) {
      expect(screen.queryByRole('link', { name: `Box ${id}` })).not.toBeInTheDocument();
    }
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    expect(params.get('image')).toBe('missing');
    expect(params.has('page')).toBe(false);
    expect(params.get('from')).toBe('bookmark');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Missing images only' }));
    expect(await screen.findByText('13 games')).toBeInTheDocument();
    expect(new URLSearchParams(window.location.hash.split('?')[1]).has('image')).toBe(false);
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
    expect(service.saveLibrary).not.toHaveBeenCalled();
  });

  it('combines type, unboxed and unshelved filters, keeping contained games distinct from unboxed games', async () => {
    const base = tableLibrary(13);
    base.games['2'] = { ...base.games['2'], type: 'expansion' };
    base.games['3'] = { ...base.games['3'], type: 'promo' };
    base.games['4'] = { ...base.games['4'], type: 'expansion' };
    base.games['6'] = { ...base.games['6'], type: 'expansion' };
    base.games['7'] = { ...base.games['7'], type: 'promo' };
    base.boxes['1'] = { ...base.boxes['1'], contains: ['1', '2'], shelfId: 'unshelved' };
    for (const id of ['2', '3', '4', '7']) delete base.boxes[id];
    base.boxes.promos = { ...promosLibrary.boxes.promos, contains: ['7'], shelfId: 'unshelved' };
    service.getLibrary.mockResolvedValue(base);
    await navigate('/');
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Select Box 04' }));
    fireEvent.keyDown(within(screen.getByTitle('2')).getByRole('button'), { key: 'Enter', keyCode: 13 });
    await filterGameColumn(/^Type/, ['expansion', 'promo']);
    expect(await screen.findByText('5 games')).toBeInTheDocument();
    expect(new URLSearchParams(window.location.hash.split('?')[1]).getAll('type')).toEqual([
      'expansion',
      'promo',
    ]);
    expect(new URLSearchParams(window.location.hash.split('?')[1]).has('page')).toBe(false);
    await filterGameColumn(/^Box/, ['Unboxed']);
    expect(await screen.findByText('2 games')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Box 03' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Box 04' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Box 02' })).not.toBeInTheDocument();
    await filterGameColumn(/^Shelf location/, ['Unshelved']);
    expect(screen.queryByRole('row', { name: /^Box \d/ })).not.toBeInTheDocument();
    expect(new URLSearchParams(window.location.hash.split('?')[1]).get('shelf')).toBe('unshelved');
    await filterGameColumn(/^Box/, null);
    expect(await screen.findByText('2 games')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Box 02' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Box 07' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Box 04' })).not.toBeInTheDocument();
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    await filterGameColumn(/^Shelf location/, null);
    expect(await screen.findByText('5 games')).toBeInTheDocument();
    await filterGameColumn(/^Type/, null);
    expect(await screen.findByText('13 games')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select Box 04' })).toBeChecked();
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
    expect(service.saveLibrary).not.toHaveBeenCalled();
  });

  it.each(['unboxed', 'unshelved'])(
    'restores combined %s filters through detail navigation and suspends them in Boxes view',
    async (filter) => {
      const base = tableLibrary(13);
      base.games['13'] = { ...base.games['13'], type: 'promo', image: '', thumbnail: '' };
      if (filter === 'unboxed') delete base.boxes['13'];
      else base.boxes['13'] = { ...base.boxes['13'], shelfId: 'unshelved' };
      service.getLibrary.mockResolvedValue(base);
      await navigate(
        `/?search=Box&image=missing&type=promo&type=not-a-type&${filter === 'unboxed' ? 'box=unboxed' : 'shelf=unshelved'}&sort=name&order=descend&selected=13&from=bookmark`,
      );
      await screen.findByText('1 game');
      expect(screen.getByRole('checkbox', { name: 'Missing images only' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Select Box 13' })).toBeChecked();
      const address = window.location.hash;
      fireEvent.click(screen.getByRole('link', { name: 'Box 13' }));
      await screen.findByLabelText('Image URL');
      if (filter === 'unboxed') await act(async () => window.history.back());
      else fireEvent.click(screen.getByRole('link', { name: 'Back' }));
      await screen.findByText('1 game');
      expect(window.location.hash).toBe(address);
      expect(screen.getByRole('checkbox', { name: 'Missing images only' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Select Box 13' })).toBeChecked();
      expect(screen.getByRole('columnheader', { name: 'Game' })).toHaveAttribute('aria-sort', 'descending');
      fireEvent.click(screen.getByRole('radio', { name: 'Boxes' }));
      expect(await screen.findByText(filter === 'unboxed' ? '12 boxes' : '13 boxes')).toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: 'Missing images only' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'filter' })).not.toBeInTheDocument();
      expect(screen.getByRole('row', { name: 'Box 12: Physical box' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('radio', { name: 'All games' }));
      expect(await screen.findByText('1 game')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Missing images only' })).toBeChecked();
      expect(new URLSearchParams(window.location.hash.split('?')[1]).get('from')).toBe('bookmark');
      expect(service.getLibrary).toHaveBeenCalledTimes(1);
      expect(service.saveLibrary).not.toHaveBeenCalled();
    },
  );

  it('uses history rather than route indexes when going back through shelf, box and game details', async () => {
    await navigate('/games/1?from=details');
    await screen.findByLabelText('Image URL');
    fireEvent.click(screen.getByRole('link', { name: 'Test Game' }));
    await waitFor(() => expect(window.location.hash).toBe('#/boxes/1'));
    fireEvent.click(screen.getByRole('link', { name: 'View all boxes in this location' }));
    await screen.findByRole('heading', { name: 'East Wall Left Cabinet 0' });
    fireEvent.click(screen.getByRole('link', { name: 'Back' }));
    await waitFor(() => expect(window.location.hash).toBe('#/boxes/1'));
    await screen.findByLabelText('Image URL');
    fireEvent.click(screen.getByRole('link', { name: 'Back' }));
    await waitFor(() => expect(window.location.hash).toBe('#/games/1?from=details'));
    await screen.findByLabelText('Image URL');
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
    expect(service.saveLibrary).not.toHaveBeenCalled();
  });

  it.each([
    ['/games/1', '/'],
    ['/boxes/1', '/'],
    ['/shelves/ew-cl-0', '/shelves'],
    ['/missing-page', '/'],
  ])('provides a safe Back fallback when directly opening %s', async (path, fallback) => {
    window.history.replaceState(null, '', `#${path}`);
    await navigate(path);
    const back = await screen.findByRole(path === '/missing-page' ? 'button' : 'link', { name: 'Back' });
    fireEvent.click(back);
    await waitFor(() => expect(window.location.hash).toBe(`#${fallback}`));
    expect(
      await screen.findByRole('heading', { name: fallback === '/shelves' ? 'Shelves' : 'Find Game' }),
    ).toBeInTheDocument();
    expect(service.saveLibrary).not.toHaveBeenCalled();
  });

  it.each(['browser', 'link'])(
    'restores every Find Game table setting using %s Back navigation',
    async (method) => {
      const base = tableLibrary(35);
      base.games['36'] = { ...base.games['1'], id: '36', name: 'Included expansion', type: 'expansion' };
      base.boxes['5'] = { ...base.boxes['5'], contains: ['5', '36'] };
      delete base.boxes['35'];
      service.getLibrary.mockResolvedValue(base);
      await navigate('/?pageSize=25&from=bookmark');
      await screen.findByRole('table');
      fireEvent.click(screen.getByRole('radio', { name: 'Boxes' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Search games' }), { target: { value: 'Box' } });
      fireEvent.click(screen.getByRole('columnheader', { name: 'Game' }));
      fireEvent.keyDown(within(screen.getByTitle('2')).getByRole('button'), { key: 'Enter', keyCode: 13 });
      const mainRow = screen.getByRole('row', { name: 'Box 05: Physical box' });
      fireEvent.click(within(mainRow).getByRole('button', { name: 'Collapse row' }));
      fireEvent.click(within(mainRow).getByRole('button', { name: 'Expand row' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Select Box 05' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Select Included expansion' }));
      const address = window.location.hash;
      const dataRows = () =>
        screen
          .getAllByRole('row')
          .map((row) => row.getAttribute('aria-label'))
          .filter(Boolean);
      const before = dataRows();
      expect(before).toHaveLength(10);
      const query = new URLSearchParams(address.split('?')[1]);
      expect(query.get('view')).toBe('boxes');
      expect(query.get('page')).toBe('2');
      expect(query.get('pageSize')).toBe('25');
      expect(query.get('sort')).toBe('name');
      expect(query.get('order')).toBe('descend');
      expect(query.getAll('expanded')).toEqual(['5']);
      expect(query.getAll('selected')).toEqual(['5', '36']);
      expect(query.get('from')).toBe('bookmark');
      fireEvent.click(within(mainRow).getByRole('link', { name: 'Box 05' }));
      await screen.findByRole('heading', { name: 'Original box' });
      if (method === 'link') fireEvent.click(screen.getByRole('link', { name: 'Back' }));
      else await act(async () => window.history.back());
      await waitFor(() => expect(window.location.hash).toBe(address));
      await screen.findByRole('table');
      expect(dataRows()).toEqual(before);
      expect(screen.getByRole('radio', { name: 'Boxes' })).toBeChecked();
      expect(screen.getByRole('textbox', { name: 'Search games' })).toHaveValue('Box');
      expect(screen.getByRole('columnheader', { name: 'Game' })).toHaveAttribute('aria-sort', 'descending');
      expect(screen.getByTitle('2')).toHaveClass('ant-pagination-item-active');
      expect(screen.getByRole('checkbox', { name: 'Select Box 05' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Select Included expansion' })).toBeChecked();
      expect(screen.getByText('2 selected')).toBeInTheDocument();
      expect(service.getLibrary).toHaveBeenCalledTimes(1);
      expect(service.saveLibrary).not.toHaveBeenCalled();
    },
  );

  it('rehydrates explicitly collapsed boxes and cleared sorting while ignoring invalid selection IDs', async () => {
    const base = treeLibrary();
    service.getLibrary.mockResolvedValue(base);
    await navigate(
      '/?view=boxes&search=Hidden&expanded=&sort=none&selected=2&selected=missing&selected=promos',
    );
    const main = await screen.findByRole('row', { name: `${base.games['1'].name}: Physical box` });
    expect(within(main).getByRole('button', { name: 'Expand row' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Select Hidden expansion' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Game' })).not.toHaveAttribute('aria-sort');
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    const address = window.location.hash;
    fireEvent.click(within(main).getByRole('link', { name: base.games['1'].name }));
    await screen.findByRole('heading', { name: 'Original box' });
    await act(async () => window.history.back());
    await waitFor(() => expect(window.location.hash).toBe(address));
    await screen.findByRole('table');
    expect(screen.queryByRole('checkbox', { name: 'Select Hidden expansion' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Game' })).not.toHaveAttribute('aria-sort');
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
    expect(service.saveLibrary).not.toHaveBeenCalled();
  });

  it('shows box item counts, truncated names with tooltips and expandable rows for all physical boxes', async () => {
    const base = treeLibrary();
    service.getLibrary.mockResolvedValue(base);
    await navigate('/');
    await screen.findByRole('columnheader', { name: 'Items' });
    const mainRow = screen.getByRole('row', { name: `${base.games['1'].name}: Physical box` });
    expect(mainRow).toHaveClass('game-row-box');
    expect(within(mainRow).getByText('2')).toBeInTheDocument();
    const contained = screen.getByRole('row', { name: 'Hidden expansion: Inside another box' });
    expect(contained).toHaveClass('game-row-contained');
    expect(within(contained).getByText('-')).toBeInTheDocument();
    expect(screen.getByRole('row', { name: 'Box 03: Unassigned' })).toHaveClass('game-row-unassigned');
    const boxLink = within(mainRow).getByRole('link', { name: `Box: ${base.games['1'].name}` });
    expect(Array.from(boxLink.textContent ?? '')).toHaveLength(15);
    expect(boxLink.textContent).toBe('An exceptional\u2026');
    fireEvent.mouseEnter(boxLink);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(base.games['1'].name);
    fireEvent.mouseLeave(boxLink);
    fireEvent.focus(boxLink);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(base.games['1'].name);
    fireEvent.blur(boxLink);
    const promo = screen.getByRole('row', { name: 'Box 04: Inside another box' });
    expect(within(promo).getByRole('link', { name: 'Box: Promos shoe box' })).toHaveTextContent(
      'Promos shoe box',
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Boxes' }));
    expect(screen.getByText('4 boxes')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Box 03' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Hidden expansion' })).not.toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole('row', { name: `${base.games['1'].name}: Physical box` })).getByRole('button', {
        name: 'Expand row',
      }),
    );
    expect(
      await screen.findByRole('row', { name: 'Hidden expansion: Inside another box' }),
    ).toBeInTheDocument();
    const container = screen.getByRole('row', { name: 'Promos shoe box: Physical box' });
    expect(within(container).getByRole('link', { name: 'Promos shoe box' })).toHaveAttribute(
      'href',
      '#/boxes/promos',
    );
    expect(within(container).getByRole('checkbox', { name: 'Select Promos shoe box' })).toBeDisabled();
    expect(within(container).queryByRole('link', { name: /BoardGameGeek/ })).not.toBeInTheDocument();
    fireEvent.click(within(container).getByRole('button', { name: 'Expand row' }));
    expect(await screen.findByRole('row', { name: 'Box 04: Inside another box' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('row', { name: 'Spare container: Physical box' })).getByText('0'),
    ).toBeInTheDocument();
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
    expect(service.saveLibrary).not.toHaveBeenCalled();
  });

  it('finds contained games in Boxes view and groups selected contents across views without selecting their containers', async () => {
    const base = treeLibrary();
    service.getLibrary.mockResolvedValue(base);
    await navigate('/');
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Select Hidden expansion' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Boxes' }));
    const search = screen.getByRole('textbox', { name: 'Search games' });
    fireEvent.change(search, { target: { value: 'Hidden' } });
    expect(await screen.findByRole('checkbox', { name: 'Select Hidden expansion' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: `Select ${base.games['1'].name}` })).not.toBeChecked();
    expect(screen.getByText('1 box')).toBeInTheDocument();
    fireEvent.change(search, { target: { value: '' } });
    fireEvent.click(
      within(screen.getByRole('row', { name: 'Promos shoe box: Physical box' })).getByRole('button', {
        name: 'Expand row',
      }),
    );
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Select Box 04' }));
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Group in a box' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: 'Main game' }));
    fireEvent.click(await screen.findByTitle('Box 04'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Group games' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const next = service.saveLibrary.mock.lastCall?.[1];
    expect(next?.boxes['1'].contains).toEqual(['1']);
    expect(next?.boxes.promos.contains).toEqual([]);
    expect(next?.boxes['4']).toMatchObject({ contains: ['4', '2'], shelfId: 'unshelved' });
    expect(next?.games).toEqual(base.games);
    expect(screen.getByRole('radio', { name: 'Boxes' })).toBeChecked();
    expect(await screen.findByText('0 selected')).toBeInTheDocument();
    expect(new URLSearchParams(window.location.hash.split('?')[1]).has('selected')).toBe(false);
    const newBox = screen.getByRole('row', { name: 'Box 04: Physical box' });
    expect(within(newBox).getByText('2')).toBeInTheDocument();
    fireEvent.click(within(newBox).getByRole('button', { name: 'Expand row' }));
    expect(
      within(await screen.findByRole('row', { name: 'Hidden expansion: Inside another box' })).getByRole(
        'link',
        { name: 'Box: Box 04' },
      ),
    ).toBeInTheDocument();
    expect(service.saveLibrary).toHaveBeenCalledTimes(1);
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
  });

  it('lists every game, retains selection across pages/search and creates an unshelved leader box', async () => {
    const base = tableLibrary(13);
    base.games['14'] = { ...base.games['1'], id: '14', name: 'Carried Expansion', type: 'expansion' };
    base.boxes['1'] = { ...base.boxes['1'], contains: ['1', '14'] };
    delete base.boxes['13'];
    service.getLibrary.mockResolvedValue(base);
    await navigate('/');
    await screen.findByRole('table');
    expect(screen.getByText('14 games')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Board game shelves' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Type/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Shelf location/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Box 01' })).toHaveAttribute('src', base.games['1'].thumbnail);
    expect(screen.getByRole('link', { name: 'View Box 01 on BoardGameGeek' })).toHaveAttribute(
      'href',
      'https://boardgamegeek.com/boardgame/1',
    );
    const firstRow = screen.getByRole('link', { name: 'Box 01' }).closest('tr');
    if (!firstRow) throw new Error('The game table row is missing.');
    expect(within(firstRow).getByText('base')).toBeInTheDocument();
    expect(within(firstRow).getByRole('link', { name: 'East shelf' })).toHaveAttribute(
      'href',
      '#/shelves?view=table&storage=east',
    );
    expect(within(firstRow).getByRole('link', { name: 'Left Cabinet 0' })).toHaveAttribute(
      'href',
      '#/shelves/ew-cl-0',
    );
    const group = screen.getByRole('button', { name: 'Group in a box' });
    expect(group).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Box 01' }));
    expect(group).toBeDisabled();
    fireEvent.keyDown(within(screen.getByTitle('2')).getByRole('button'), { key: 'Enter', keyCode: 13 });
    expect(
      within(screen.getByRole('row', { name: 'Box 13: Unassigned' })).getAllByText('Unassigned'),
    ).toHaveLength(2);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Box 13' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Search games' }), { target: { value: 'Box 01' } });
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    fireEvent.click(group);
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(service.saveLibrary).not.toHaveBeenCalled();
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    fireEvent.click(group);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Group games' })).toBeDisabled();
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: 'Main game' }));
    fireEvent.click(await screen.findByTitle('Box 13'));
    const preview = within(dialog).getByRole('region', { name: 'Grouping preview' });
    expect(within(preview).getByText('Create new box: Box 13')).toBeInTheDocument();
    expect(within(preview).getByText('Carried Expansion')).toBeInTheDocument();
    expect(within(preview).getByText('Location: Yet to be shelved')).toBeInTheDocument();
    expect(service.saveLibrary).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Group games' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const next = service.saveLibrary.mock.lastCall?.[1];
    expect(next?.games).toEqual(base.games);
    expect(next?.boxes['13']).toEqual({
      id: '13',
      contains: ['13', '1', '14'],
      size: 'unknown',
      shelfId: 'unshelved',
      updatedAt: expect.any(Number),
    });
    expect(next?.boxes).not.toHaveProperty('1');
    expect(next?.boxes['3']).toEqual(base.boxes['3']);
    expect(await screen.findByText('0 selected')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Box: Box 13' })).toHaveAttribute('href', '#/boxes/13');
    expect(screen.getByRole('link', { name: 'Unshelved' })).toHaveAttribute(
      'href',
      '#/shelves?view=table&storage=unshelved',
    );
    expect(screen.getByRole('link', { name: 'Yet to be shelved' })).toHaveAttribute(
      'href',
      '#/shelves/unshelved',
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Search games' }), {
      target: { value: 'Box 13' },
    });
    expect(screen.getAllByRole('link', { name: 'Box: Box 13' })).toHaveLength(3);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search games' }), {
      target: { value: 'Carried Expansion' },
    });
    expect(screen.getByRole('link', { name: 'Carried Expansion' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Box: Box 13' })).toBeInTheDocument();
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
    expect(base.boxes['1'].contains).toEqual(['1', '14']);
  });

  it('previews carried contents, preserves an existing leader and retries grouping without allowing pending edits', async () => {
    const base = tableLibrary(5);
    base.boxes['1'] = {
      ...base.boxes['1'],
      contains: ['1', '2'],
      dimensions: { width: 300, height: 80, depth: 200 },
    };
    base.boxes['3'] = { ...base.boxes['3'], contains: ['3', '4'] };
    delete base.boxes['2'];
    delete base.boxes['4'];
    service.getLibrary.mockResolvedValue(base);
    await navigate('/');
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Select Box 01' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Box 03' }));
    fireEvent.click(screen.getByRole('button', { name: 'Group in a box' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: 'Main game' }));
    fireEvent.click(await screen.findByTitle('Box 01'));
    const preview = within(dialog).getByRole('region', { name: 'Grouping preview' });
    expect(within(preview).getByText('Use existing box: Box 01')).toBeInTheDocument();
    expect(within(preview).getByText('Box 02')).toBeInTheDocument();
    expect(within(preview).getByText('Box 04')).toBeInTheDocument();
    service.saveLibrary.mockRejectedValueOnce(new Error('Grouping write failed'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Group games' }));
    expect(await within(dialog).findByText('Grouping write failed')).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'Main game' })).toBeEnabled();
    expect(screen.getAllByRole('link', { name: 'Box: Box 03' })).toHaveLength(2);
    let finish!: () => void;
    service.saveLibrary.mockImplementationOnce(
      (_base, next) =>
        new Promise((resolve) => {
          finish = () => resolve({ ...next, revision: 'grouped' });
        }),
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Group games' }));
    await waitFor(() => expect(service.saveLibrary).toHaveBeenCalledTimes(2));
    expect(within(dialog).getByRole('combobox', { name: 'Main game' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear selection' })).toBeDisabled();
    fireEvent.keyDown(dialog, { key: 'Escape', keyCode: 27 });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await act(async () => finish());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(service.saveLibrary.mock.lastCall?.[1]).toEqual({
      games: base.games,
      boxes: {
        '1': { ...base.boxes['1'], contains: ['1', '2', '3', '4'], updatedAt: expect.any(Number) },
        '5': base.boxes['5'],
      },
    });
    expect(screen.queryByRole('link', { name: 'Box: Box 03' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Box: Box 01' })).toHaveLength(4);
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
  });

  it('keeps legacy games searchable but disables grouping until migration', async () => {
    service.getLibrary.mockResolvedValue({
      revision: null,
      games: {},
      boxes: {},
      legacy: { shelves: { '1': shelfEntry }, images: {} },
    });
    await navigate('/');
    expect(await screen.findByRole('link', { name: 'Test Game' })).toHaveAttribute('href', '#/games/1');
    expect(screen.getByRole('link', { name: 'Box: Test Game' })).toHaveAttribute('href', '#/boxes/1');
    expect(screen.getByRole('checkbox', { name: 'Select Test Game' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Group in a box' })).toBeDisabled();
    expect(service.saveLibrary).not.toHaveBeenCalled();
  });

  it('uses the legacy image cache when filtering games without covers', async () => {
    service.getLibrary.mockResolvedValue({
      revision: null,
      games: {},
      boxes: {},
      legacy: {
        shelves: {
          '1': {
            ...shelfEntry,
            contains: [...shelfEntry.contains, { id: '2', name: 'Missing legacy cover', type: 'expansion' }],
          },
        },
        images: { '1': { thumbnail: 'https://example.com/legacy.jpg' } },
      },
    });
    await navigate('/');
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Missing images only' }));
    expect(await screen.findByText('1 game')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Missing legacy cover' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Test Game' })).not.toBeInTheDocument();
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
    expect(service.saveLibrary).not.toHaveBeenCalled();
  });

  it('restores table pagination, sorting, filters, search and view after browser Back', async () => {
    service.getLibrary.mockResolvedValue(tableLibrary(60));
    await navigate('/shelves?view=table&pageSize=25');
    await screen.findByRole('table');
    fireEvent.change(screen.getByRole('textbox', { name: 'Search boxes' }), { target: { value: 'Box' } });
    const storage = screen.getByRole('columnheader', { name: /^Storage/ });
    fireEvent.click(within(storage).getByRole('button', { name: 'filter' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'East shelf' }));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    fireEvent.click(screen.getByRole('columnheader', { name: 'Box' }));
    fireEvent.keyDown(within(screen.getByTitle('2')).getByRole('button'), { key: 'Enter', keyCode: 13 });
    const boxLinks = () =>
      screen.getAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('#/boxes/'));
    const before = boxLinks().map((link) => link.textContent);
    const address = window.location.hash;
    expect(before).toHaveLength(15);
    fireEvent.click(boxLinks()[0]);
    await screen.findByRole('heading', { name: 'Original box' });
    await act(async () => {
      window.history.back();
    });
    await waitFor(() => expect(window.location.hash).toBe(address));
    await screen.findByRole('table');
    expect(boxLinks().map((link) => link.textContent)).toEqual(before);
    expect(screen.getByRole('textbox', { name: 'Search boxes' })).toHaveValue('Box');
    expect(screen.getByRole('columnheader', { name: 'Box' })).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByTitle('2')).toHaveClass('ant-pagination-item-active');
    fireEvent.click(screen.getByRole('radio', { name: 'Illustrations' }));
    expect(await screen.findByRole('group', { name: 'East shelf' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Table' }));
    expect(boxLinks().map((link) => link.textContent)).toEqual(before);
    expect(service.getLibrary).toHaveBeenCalledTimes(1);
  });

  it.each([
    { data: library, id: '1', name: 'Test Game' },
    { data: promosLibrary, id: 'promos', name: 'Promos shoe box' },
  ])(
    'confirms deletion of $name, preserves catalog games and allows retry after failure',
    async ({ data, id, name }) => {
      service.getLibrary.mockResolvedValue(data);
      await navigate('/shelves?view=table');
      fireEvent.click(await screen.findByRole('button', { name: `Delete box ${name}` }));
      expect(service.saveLibrary).not.toHaveBeenCalled();
      fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
      expect(service.saveLibrary).not.toHaveBeenCalled();
      service.saveLibrary.mockRejectedValueOnce(new Error('Box deletion failed'));
      fireEvent.click(screen.getByRole('button', { name: `Delete box ${name}` }));
      fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
      expect(await screen.findByText('Box deletion failed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: `Delete box ${name}` })).toBeEnabled();
      expect(data.boxes[id]).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: `Delete box ${name}` }));
      fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: `Delete box ${name}` })).not.toBeInTheDocument(),
      );
      expect(service.saveLibrary.mock.lastCall?.[1]).toEqual({ games: data.games, boxes: {} });
      act(() => {
        window.location.hash = '/games/1';
      });
      expect(await screen.findByText('Not assigned to a box.')).toBeInTheDocument();
      expect(service.getLibrary).toHaveBeenCalledTimes(1);
    },
  );

  it('returns to the previous table page when deleting the last box on the last page', async () => {
    service.getLibrary.mockResolvedValue(tableLibrary(11));
    await navigate('/shelves?view=table&page=2');
    fireEvent.click(await screen.findByRole('button', { name: 'Delete box Box 11' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await screen.findByRole('button', { name: 'Edit location for Box 01' });
    await waitFor(() => expect(window.location.hash).toBe('#/shelves?view=table'));
    expect(service.saveLibrary.mock.lastCall?.[1].games).toHaveProperty('11');
    expect(service.saveLibrary.mock.lastCall?.[1].boxes).not.toHaveProperty('11');
  });

  it('keeps overview furniture colors neutral and highlights only a selected shelf location', async () => {
    await navigate('/shelves');
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
    const search = await screen.findByRole('textbox', { name: 'Search games' });
    fireEvent.change(search, { target: { value: 'Test' } });
    fireEvent.click(await screen.findByRole('link', { name: 'Test Game' }));
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
    fireEvent.click(screen.getByRole('link', { name: 'Back' }));
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
      await navigate('/shelves?view=table');
      fireEvent.click(await screen.findByRole('button', { name: 'Edit location for Test Game' }));
      const dialog = await screen.findByRole('dialog');
      fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: 'Storage' }));
      fireEvent.click(await screen.findByText(svgName));
      expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();
      expect(within(dialog).getAllByRole('group')).toHaveLength(1);
      fireEvent.click(within(dialog).getByRole('button', { name: `Select shelf ${shelfId}` }));
      expect(service.saveLibrary).not.toHaveBeenCalled();
      expect(within(dialog).getByText(`Selected shelf: ${locationName}`)).toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
      await waitFor(() =>
        expect(service.saveLibrary).toHaveBeenCalledWith(library, {
          games: library.games,
          boxes: { '1': { ...library.boxes['1'], shelfId, updatedAt: expect.any(Number) } },
        }),
      );
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      fireEvent.click(screen.getByRole('link', { name: 'Find Game' }));
      const search = await screen.findByRole('textbox', { name: 'Search games' });
      fireEvent.change(search, { target: { value: 'Test' } });
      fireEvent.click(await screen.findByRole('link', { name: 'Test Game' }));
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

  it('clears a draft when switching storage and prevents edits or dismissal during a pending save', async () => {
    let finish: ((saved: Library) => void) | undefined;
    service.saveLibrary.mockImplementationOnce(
      () =>
        new Promise<Library>((resolve) => {
          finish = resolve;
        }),
    );
    await navigate('/shelves?view=table');
    fireEvent.click(await screen.findByRole('button', { name: 'Edit location for Test Game' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Select shelf ew-cl-1' }));
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeEnabled();
    fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: 'Storage' }));
    fireEvent.click(await screen.findByText('TV shelf'));
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(within(dialog).queryByRole('button', { name: 'Select shelf ew-cl-1' })).not.toBeInTheDocument();
    fireEvent.keyDown(within(dialog).getByRole('button', { name: 'Select shelf tv-cr-1' }), { key: 'Enter' });
    expect(service.saveLibrary).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled());
    expect(within(dialog).getByRole('combobox', { name: 'Storage' })).toBeDisabled();
    expect(within(dialog).queryByRole('button', { name: 'Select shelf tv-cl-0' })).not.toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape', keyCode: 27 });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const next = service.saveLibrary.mock.lastCall?.[1];
    if (!finish || !next) throw new Error('Expected a pending placement save.');
    await act(async () => finish?.({ ...next, revision: 'saved-placement' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Lower Right' })).toBeInTheDocument();
  });

  it('cancels draft placement and preserves placement on a failed Edit save before retry', async () => {
    await navigate('/shelves');
    fireEvent.click(await screen.findByRole('radio', { name: 'Table' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/shelves?view=table');
    expect(screen.queryByRole('group', { name: 'East shelf' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Test Game' })[0]).toHaveAttribute('href', '#/boxes/1');
    async function selectUnshelved() {
      fireEvent.click(screen.getByRole('button', { name: 'Edit location for Test Game' }));
      const dialog = await screen.findByRole('dialog');
      fireEvent.mouseDown(within(dialog).getByRole('combobox', { name: 'Storage' }));
      fireEvent.click(await screen.findByText('Unshelved'));
      fireEvent.click(within(dialog).getByRole('button', { name: 'Select shelf unshelved' }));
    }
    await selectUnshelved();
    expect(service.saveLibrary).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(service.saveLibrary).not.toHaveBeenCalled();
    await selectUnshelved();
    service.saveLibrary.mockRejectedValueOnce(new Error('Placement save failed'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Placement save failed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Left Cabinet 0' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
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
    const search = await screen.findByRole('textbox', { name: 'Search games' });
    fireEvent.change(search, { target: { value: 'Test' } });
    fireEvent.click(await screen.findByRole('link', { name: 'Test Game' }));
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
    const search = await screen.findByRole('textbox', { name: 'Search games' });
    fireEvent.change(search, { target: { value: 'Imported' } });
    fireEvent.click(await screen.findByRole('link', { name: 'Imported Game' }));
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
