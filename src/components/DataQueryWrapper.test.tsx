import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { library } from '../test/fixtures';
import type { Library } from '../types/library';
import { DataQueryWrapper } from './DataQueryWrapper';

const service = vi.hoisted(() => ({
  getLibrary: vi.fn<() => Promise<Library>>(),
}));
vi.mock('services/firebase', () => service);

beforeEach(() => {
  vi.resetAllMocks();
  service.getLibrary.mockResolvedValue(library);
});

function renderWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DataQueryWrapper>Loaded content</DataQueryWrapper>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('query loading and error presentation', () => {
  it('waits for both documents before rendering content', async () => {
    renderWrapper();
    expect(screen.getByRole('status', { name: 'Loading data' })).toBeInTheDocument();
    expect(screen.queryByText('Loaded content')).not.toBeInTheDocument();
    expect(await screen.findByText('Loaded content')).toBeInTheDocument();
  });

  it('shows readable library failures instead of empty data', async () => {
    service.getLibrary.mockRejectedValue(new Error('permission-denied'));
    renderWrapper();
    expect(await screen.findByText('permission-denied')).toBeInTheDocument();
    expect(screen.queryByText('Loaded content')).not.toBeInTheDocument();
  });
});
