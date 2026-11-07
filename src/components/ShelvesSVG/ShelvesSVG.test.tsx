import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { shelfEntry } from '../../test/fixtures';
import { ShelvesSVG } from './ShelvesSVG';
import { shelfRegions } from './shelfRegions';

describe('independent shelf illustrations', () => {
  it('renders four named SVGs and keeps the window inside the West illustration', () => {
    const { container } = render(<ShelvesSVG />);
    expect(screen.getAllByRole('img').map((svg) => svg.getAttribute('aria-label'))).toEqual([
      'East shelf',
      'West shelf',
      'TV shelf',
      'Unshelved games',
    ]);
    expect(container.querySelector('#window')?.closest('svg')).toBe(
      screen.getByRole('img', { name: 'West shelf' }),
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('owns each hit target exactly once, shares its highlight geometry and handles keyboard selection', () => {
    const onSelect = vi.fn();
    const active = ['ew-cl-0', 'ww-cl-0', 'tv-cl-0', 'unshelved'];
    const { container } = render(<ShelvesSVG active={active} onSelectShelf={onSelect} />);
    const buttons = screen.getAllByRole('button');
    const ids = buttons.map((button) => button.getAttribute('data-shelf-id'));
    expect(new Set(ids).size).toBe(buttons.length);
    for (const id of active) {
      const target = screen.getByRole('button', { name: `Select shelf ${id}` });
      const highlight = container.querySelector(`[data-active-shelf="${id}"]`);
      expect(target).toHaveAttribute('d', highlight?.getAttribute('d'));
      expect(target.closest('svg')).toBe(highlight?.closest('svg'));
      expect(target).toHaveAttribute('aria-pressed', 'true');
    }
    const tv = screen.getByRole('group', { name: 'TV shelf' });
    expect(within(tv).getAllByRole('button')).toHaveLength(4);
    fireEvent.click(within(tv).getByRole('button', { name: 'Select shelf tv-cl-0' }));
    fireEvent.keyDown(screen.getByRole('button', { name: 'Select shelf ww-cl-0' }), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Select shelf unshelved' }), { key: ' ' });
    expect(onSelect.mock.calls).toEqual([['tv-cl-0'], ['ww-cl-0'], ['unshelved']]);
  });

  it('draws contents in every furniture section and bounds large collections to their compartment', () => {
    const boxes = Array.from({ length: 40 }, (_, index) => ({ ...shelfEntry, id: String(index) }));
    const { container } = render(
      <ShelvesSVG
        perShelf={{
          'ew-cl-0': boxes,
          'ww-cl-0': [shelfEntry],
          'tv-cl-0': [shelfEntry],
        }}
      />,
    );
    for (const [section, id] of [
      ['east', 'ew-cl-0'],
      ['west', 'ww-cl-0'],
      ['tv', 'tv-cl-0'],
    ]) {
      const content = container.querySelector(`[data-content-shelf="${id}"]`);
      expect(content?.closest('figure')).toHaveAttribute('data-shelf-section', section);
      expect(content?.querySelectorAll('rect').length).toBeGreaterThan(0);
    }
    const content = container.querySelector('[data-content-shelf="ew-cl-0"]');
    expect(content).toHaveAttribute('data-box-count', '40');
    expect(content?.querySelectorAll('rect').length).toBeLessThan(boxes.length);
    const region = shelfRegions.east.find((region) => region.id === 'ew-cl-0');
    if (!region) throw new Error('Missing East cabinet region.');
    const { bounds } = region;
    for (const rect of content?.querySelectorAll('rect') ?? []) {
      const x = Number(rect.getAttribute('x'));
      const y = Number(rect.getAttribute('y'));
      expect(x).toBeGreaterThanOrEqual(bounds.x);
      expect(y).toBeGreaterThanOrEqual(bounds.y);
      expect(x + Number(rect.getAttribute('width'))).toBeLessThanOrEqual(bounds.x + bounds.width);
      expect(y + Number(rect.getAttribute('height'))).toBeLessThanOrEqual(bounds.y + bounds.height);
    }
  });

  it('keeps an empty pile selectable and counts physical boxes rather than their contained games', () => {
    const onSelect = vi.fn();
    const view = render(<ShelvesSVG onSelectShelf={onSelect} />);
    expect(screen.getByText('Unshelved games (0 boxes)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select shelf unshelved' }));
    expect(onSelect).toHaveBeenCalledWith('unshelved');
    view.rerender(
      <ShelvesSVG
        perShelf={{
          unshelved: [
            {
              ...shelfEntry,
              id: 'promos',
              contains: [...shelfEntry.contains, { id: '2', name: 'Other promo', type: 'promo' }],
            },
            { ...shelfEntry, id: '3', box: 'none' },
          ],
        }}
      />,
    );
    expect(screen.getByText('Unshelved games (1 box)')).toBeInTheDocument();
    expect(view.container.querySelector('[data-content-shelf="unshelved"]')).toHaveAttribute(
      'data-box-count',
      '1',
    );
  });
});
