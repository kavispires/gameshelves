import { fireEvent, render, screen, within } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { shelfEntry } from '../../test/fixtures';
import { BoxTable } from './BoxTable';

vi.mock('components', () => ({
  GameCover: ({ name }: { name: string }) => <img alt={name} />,
}));

const boxes: ShelfEntry[] = [
  {
    ...shelfEntry,
    name: 'Alpha box',
    dimensions: { width: 300, height: 80, depth: 200 },
    contains: [
      { id: '1', name: 'Base game', type: 'base' },
      { id: '2', name: 'Hidden expansion', type: 'expansion' },
    ],
  },
  {
    ...shelfEntry,
    id: '3',
    name: 'Zulu box',
    box: 'small',
    shelfId: 'tv-cl-0',
    dimensions: { width: 90, height: 150, depth: 60 },
    contains: [{ id: '3', name: 'Another game', type: 'base' }],
  },
];

function mount(data = boxes) {
  const onEdit = vi.fn();
  render(
    <ConfigProvider theme={{ token: { motion: false } }}>
      <MemoryRouter>
        <BoxTable boxes={data} disabled={false} onEdit={onEdit} />
      </MemoryRouter>
    </ConfigProvider>,
  );
  return onEdit;
}

function displayedBoxes() {
  return screen
    .getAllByRole('link')
    .filter((link) => link.getAttribute('href')?.startsWith('/boxes/'))
    .map((link) => link.textContent);
}

describe('physical box inventory table', () => {
  it('separates storage from shelf, filters each independently and opens Edit without moving a box', async () => {
    const onEdit = mount();
    expect(screen.getByRole('link', { name: 'Left Cabinet 0' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Upper Left' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit location for Zulu box' }));
    expect(onEdit).toHaveBeenCalledWith(boxes[1]);
    expect(screen.queryByRole('combobox', { name: /^Move / })).not.toBeInTheDocument();

    const storage = screen.getByRole('columnheader', { name: /Storage/ });
    fireEvent.click(within(storage).getByRole('button', { name: 'filter' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'TV shelf' }));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(displayedBoxes()).toEqual(['Zulu box']);

    const shelf = screen.getByRole('columnheader', { name: /^Shelf/ });
    fireEvent.click(within(shelf).getByRole('button', { name: 'filter' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'TV shelf: Upper Left' }));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(displayedBoxes()).toEqual(['Zulu box']);
  });

  it('searches contained games, sorts measurements numerically in both directions and filters sizes', async () => {
    mount();
    expect(displayedBoxes()).toEqual(['Alpha box', 'Zulu box']);
    fireEvent.click(screen.getByRole('columnheader', { name: /Width/ }));
    expect(displayedBoxes()).toEqual(['Zulu box', 'Alpha box']);
    fireEvent.click(screen.getByRole('columnheader', { name: /Width/ }));
    expect(displayedBoxes()).toEqual(['Alpha box', 'Zulu box']);
    fireEvent.click(screen.getByRole('columnheader', { name: /Games/ }));
    expect(displayedBoxes()).toEqual(['Zulu box', 'Alpha box']);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search boxes' }), {
      target: { value: 'hidden EXPANSION' },
    });
    expect(displayedBoxes()).toEqual(['Alpha box']);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search boxes' }), { target: { value: '' } });
    const size = screen.getByRole('columnheader', { name: /Size/ });
    fireEvent.click(within(size).getByRole('button', { name: 'filter' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'small' }));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(displayedBoxes()).toEqual(['Zulu box']);
  });

  it('resets pagination when searching a collection larger than one page', () => {
    mount(
      Array.from({ length: 12 }, (_, index) => ({
        ...shelfEntry,
        id: String(index + 1),
        name: `Box ${String(index + 1).padStart(2, '0')}`,
      })),
    );
    expect(displayedBoxes()).toHaveLength(10);
    fireEvent.click(within(screen.getByTitle('2')).getByRole('button'));
    expect(displayedBoxes()).toEqual(['Box 11', 'Box 12']);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search boxes' }), { target: { value: 'Box 01' } });
    expect(displayedBoxes()).toEqual(['Box 01']);
  });
});
