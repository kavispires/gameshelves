import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import type { User } from 'firebase/auth';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthUser } from '../test/auth';
import { csvRow, shelfEntry, xmlRow } from '../test/fixtures';
import { App } from './App';

const service = vi.hoisted(() => ({
  auth: {},
  signIn: vi.fn<(email: string, password: string) => Promise<void>>(),
  getShelvedGames: vi.fn<() => Promise<Record<string, ShelfEntry>>>(),
  getImages: vi.fn<() => Promise<Record<string, GameImages>>>(),
  saveShelvedGames: vi.fn<() => Promise<void>>(),
  saveGames: vi.fn<(games: GameEntry[]) => Promise<void>>(),
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
  it('renders Find Game as home and keeps Shelves selected when viewing a game', async () => {
    await navigate('/');
    expect(await screen.findByRole('heading', { name: 'Find Game' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find Game' })).toHaveAttribute('aria-current', 'page');
    const search = await screen.findByRole('combobox');
    fireEvent.change(search, { target: { value: 'Test' } });
    fireEvent.mouseDown(search);
    fireEvent.click(await screen.findByText('Test Game [base] :: BOX'));
    expect(await screen.findByText('This is a boxed game instance.')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/shelves/1');
    expect(screen.getByRole('link', { name: 'Shelves' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Find Game' })).not.toHaveAttribute('aria-current');
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

  it.each(['/not-a-route', '/shelves/missing'])('renders route %s without crashing', async (path) => {
    await navigate(path);
    expect(await screen.findByText('404')).toBeInTheDocument();
  });

  it('completes CSV/XML import, classification, failed save and retry with mocked Firebase', async () => {
    await navigate('/settings');
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

describe('authentication gate', () => {
  it.each([
    '/',
    '/home',
    '/login',
    '/game-night',
    '/shelves',
    '/shelves/1',
    '/friends',
    '/settings',
    '/sync',
    '/not-a-route',
  ])('does not mount navigation or read Firestore before authentication at %s', async (path) => {
    initialUser = undefined;
    await navigate(path);
    expect(screen.getByRole('status', { name: 'Verifying auth...' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(service.getShelvedGames).not.toHaveBeenCalled();
    expect(service.getImages).not.toHaveBeenCalled();

    act(() => updateAuth(null));
    expect(screen.getByText('You are not logged in')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(service.getShelvedGames).not.toHaveBeenCalled();
    expect(service.getImages).not.toHaveBeenCalled();
    expect(window.location.hash).toBe(`#${path}`);
  });

  it('validates credentials, reports failure and resumes the original URL after observed sign-in', async () => {
    initialUser = null;
    await navigate('/shelves/1');
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
    expect(service.getShelvedGames).not.toHaveBeenCalled();

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
    expect(service.getShelvedGames).not.toHaveBeenCalled();

    act(() => updateAuth(createAuthUser()));
    expect(await screen.findByText('This is a boxed game instance.')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/shelves/1');
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
    expect(service.getShelvedGames).not.toHaveBeenCalled();
  });

  it('drops cached data on account changes and sign-out, including late reads', async () => {
    let finishOldRead: (data: Record<string, ShelfEntry>) => void = () => {
      throw new Error('Old read was not started');
    };
    service.getShelvedGames.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishOldRead = resolve;
        }),
    );
    await navigate('/shelves/1');
    await waitFor(() => expect(service.getShelvedGames).toHaveBeenCalledTimes(1));

    const changed = { ...shelfEntry, name: 'Other session game' };
    service.getShelvedGames.mockResolvedValue({ '1': changed });
    act(() => updateAuth(createAuthUser('other-user')));
    expect(await screen.findByText('Other session game')).toBeInTheDocument();
    await act(async () => finishOldRead({ '1': shelfEntry }));
    expect(screen.getByText('Other session game')).toBeInTheDocument();

    act(() => updateAuth(null));
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByText('You are not logged in')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const previousReads = service.getShelvedGames.mock.calls.length;
    service.getShelvedGames.mockResolvedValue({});
    act(() => updateAuth(createAuthUser('other-user')));
    expect(await screen.findByText('404')).toBeInTheDocument();
    expect(service.getShelvedGames.mock.calls.length).toBeGreaterThan(previousReads);
  });
});
