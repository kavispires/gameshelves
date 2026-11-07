import { Alert, App, Button, Layout, Modal, Radio, Select, Typography } from 'antd';
import { ShelvesSVG } from 'components';
import { useSaveLibrary } from 'hooks/useLibrary';
import { useQueryShelvedGames } from 'hooks/useQueryShelvedGames';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { SHELVES_IDS } from 'utils/constants';
import { moveBoxes } from 'utils/library';
import { NotFound } from '../NotFound/NotFound';
import { BoxTable } from './BoxTable';

export function Shelves() {
  const { shelfId } = useParams();
  return <ShelfBrowser key={shelfId ?? 'overview'} shelfId={shelfId} />;
}

function ShelfBrowser({ shelfId }: { shelfId?: string }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data: library, boxedGames, perShelf } = useQueryShelvedGames();
  const save = useSaveLibrary();
  const { notification } = App.useApp();
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  if (!library) return null;
  if (shelfId && !Object.hasOwn(SHELVES_IDS, shelfId)) {
    const legacyEntry =
      library.legacy && Object.hasOwn(library.legacy.shelves, shelfId)
        ? library.legacy.shelves[shelfId]
        : undefined;
    if (Object.hasOwn(library.boxes, shelfId) || (legacyEntry && legacyEntry.box !== 'none')) {
      return <Navigate to={`/boxes/${encodeURIComponent(shelfId)}`} replace />;
    }
    if (
      Object.hasOwn(library.games, shelfId) ||
      Object.values(library.legacy?.shelves ?? {}).some((box) =>
        box.contains.some((game) => game.id === shelfId),
      )
    )
      return <Navigate to={`/games/${encodeURIComponent(shelfId)}`} replace />;
    return <NotFound />;
  }
  const tableView = Boolean(shelfId) || params.get('view') === 'table';
  const allBoxes = Object.values(boxedGames);
  const boxes = shelfId ? allBoxes.filter((box) => box.shelfId === shelfId) : allBoxes;
  const disabled = Boolean(library.legacy) || save.isPending;
  const failure = error || save.error?.message;

  function place(ids: string[], destination: string, onSuccess?: () => void) {
    try {
      if (!library) throw new Error('The library is not loaded.');
      const next = moveBoxes(library, ids, destination);
      setError('');
      save.mutate(
        { base: library, next },
        {
          onSuccess: () => {
            notification.success({ title: 'Shelf placement saved' });
            onSuccess?.();
          },
        },
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save shelf placement.');
    }
  }

  return (
    <Layout.Content className="box-border mx-auto w-full min-w-0 max-w-[1600px] p-4 sm:p-6">
      {shelfId && <Link to="/shelves">All shelves</Link>}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <Typography.Title level={1} className="!mb-0 !text-3xl">
          {shelfId ? SHELVES_IDS[shelfId].description : 'Shelves'}
        </Typography.Title>
        {shelfId ? (
          <Button
            type="primary"
            disabled={disabled}
            onClick={() => {
              setSelected([]);
              setAdding(true);
            }}
          >
            Add boxes
          </Button>
        ) : (
          <Radio.Group
            aria-label="Shelf overview view"
            optionType="button"
            value={tableView ? 'table' : 'illustrations'}
            onChange={(event) => setParams(event.target.value === 'table' ? { view: 'table' } : {})}
            options={[
              { label: 'Illustrations', value: 'illustrations' },
              { label: 'Table', value: 'table' },
            ]}
          />
        )}
      </div>
      {library.legacy && (
        <Alert
          type="info"
          className="mb-4"
          title="Import and migrate your library in Settings to edit shelf placements."
        />
      )}
      {failure && !adding && (
        <Alert type="error" className="mb-4" title="Shelf placement not saved" description={failure} />
      )}
      {shelfId && (
        <Select
          aria-label="Browse shelf locations"
          className="mb-4 w-full sm:max-w-sm"
          value={shelfId}
          showSearch
          optionFilterProp="label"
          onChange={(id) => navigate(`/shelves/${id}`)}
          options={Object.entries(SHELVES_IDS).map(([id, shelf]) => ({
            value: id,
            label: shelf.description,
          }))}
        />
      )}
      {(!tableView || shelfId) && (
        <ShelvesSVG
          className={shelfId ? 'shelf-table-location' : undefined}
          shelfId={shelfId}
          active={shelfId ? [shelfId] : []}
          perShelf={perShelf}
          onSelectShelf={shelfId ? undefined : (id) => navigate(`/shelves/${id}`)}
        />
      )}
      {tableView && (
        <BoxTable
          key={shelfId ?? 'all'}
          boxes={boxes}
          disabled={disabled}
          onMove={(id, destination) => place([id], destination)}
        />
      )}
      <Modal
        title="Add boxes to this shelf"
        open={adding}
        okText="Add boxes"
        confirmLoading={save.isPending}
        okButtonProps={{ disabled: disabled || !selected.length }}
        cancelButtonProps={{ disabled: save.isPending }}
        closable={!save.isPending}
        mask={{ closable: !save.isPending }}
        onCancel={() => setAdding(false)}
        onOk={() => {
          if (shelfId) place(selected, shelfId, () => setAdding(false));
        }}
      >
        {failure && (
          <Alert type="error" className="mb-4" title="Shelf placement not saved" description={failure} />
        )}
        <p>These boxes will move from their current location. Their contents will not change.</p>
        <Select
          aria-label="Boxes to add"
          className="w-full"
          mode="multiple"
          optionFilterProp="label"
          showSearch
          value={selected}
          onChange={setSelected}
          disabled={disabled}
          options={allBoxes
            .filter((box) => box.shelfId !== shelfId)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((box) => ({ value: box.id, label: box.name }))}
        />
      </Modal>
    </Layout.Content>
  );
}
