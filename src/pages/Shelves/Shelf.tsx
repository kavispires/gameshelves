import { Alert, Button, Form, InputNumber, Layout, Popconfirm, Select, Typography } from 'antd';
import { GameCover, ShelvesSVG } from 'components';
import { useLibrary, useSaveLibrary } from 'hooks/useLibrary';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BOX_SIZES, GAME_TYPES, SHELVES_IDS } from 'utils/constants';
import { findBox, getBoxName, updateBox, validDimensions } from 'utils/library';
import type { CatalogGame, GameBox, Library, LibraryContent } from '../../types/library';
import { NotFound } from '../NotFound/NotFound';

export function Shelf() {
  const { id = '' } = useParams();
  const { data: library } = useLibrary();
  if (!library) return null;
  if (library.legacy) {
    const entry = Object.values(library.legacy.shelves).find((box) =>
      box.contains.some((game) => game.id === id),
    );
    const game = entry?.contains.find((game) => game.id === id);
    if (!entry || !game) return <NotFound />;
    return (
      <Layout.Content className="p-4">
        <Typography.Title level={1}>{game.name}</Typography.Title>
        <p>Current location: {SHELVES_IDS[entry.shelfId]?.description ?? entry.shelfId}</p>
        <p>Box: {entry.name}</p>
        <ShelvesSVG active={[entry.shelfId]} />
      </Layout.Content>
    );
  }
  const box = library.boxes[id];
  if (box?.mainGameId === null) {
    return <GameDetails key={`${id}:${library.revision}`} library={library} customBox={box} />;
  }
  const game = library.games[id];
  if (!game) return <NotFound />;
  return <GameDetails key={`${id}:${library.revision}`} library={library} game={game} />;
}

type GameDetailsProps = { library: Library } & (
  | { game: CatalogGame; customBox?: never }
  | { game?: never; customBox: GameBox }
);

function GameDetails({ library, game, customBox }: GameDetailsProps) {
  const containing = customBox ?? (game ? findBox(library.boxes, game.id) : undefined);
  const ownBox = customBox ?? (containing?.id === game?.id ? containing : undefined);
  const name = game ? game.name : getBoxName(customBox, library.games);
  const [draft, setDraft] = useState(ownBox);
  const [type, setType] = useState<GameType>(game?.type ?? 'unknown');
  const [dimensions, setDimensions] = useState<Partial<BoxDimensions>>(ownBox?.dimensions ?? {});
  const [targetBox, setTargetBox] = useState<string>();
  const [error, setError] = useState('');
  const save = useSaveLibrary();
  const assigned = new Set(Object.values(library.boxes).flatMap((box) => box.contains));
  const busy = save.isPending;
  const contents = draft?.mainGameId === null ? draft.contains : (draft?.contains.slice(1) ?? []);

  function persist(next: LibraryContent) {
    setError('');
    save.mutate({ base: library, next });
  }

  function saveBox() {
    if (!draft) return;
    const values = [dimensions.width, dimensions.height, dimensions.depth];
    if (values.some((value) => value !== undefined) && !validDimensions(dimensions)) {
      setError('Enter all three positive dimensions in millimeters, or leave all three empty.');
      return;
    }
    const box: GameBox = { ...draft };
    delete box.dimensions;
    if (validDimensions(dimensions)) box.dimensions = dimensions;
    try {
      persist(updateBox(library, box.id, box, game ? { [game.id]: type } : {}));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save box.');
    }
  }

  function runEdit(edit: () => LibraryContent) {
    try {
      persist(edit());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update organization.');
    }
  }

  return (
    <Layout.Content className="mx-auto w-full max-w-4xl p-4">
      <Typography.Title level={1}>{name}</Typography.Title>
      <div className="my-4 flex flex-wrap items-start gap-6">
        {game && <GameCover id={game.id} name={game.name} width={100} />}
        <div>
          {game ? (
            <>
              <p>
                {game.status === 'OWN' ? 'Owned' : 'Preordered'} · {game.year || 'Year unknown'}
              </p>
              <p>
                {game.minPlayerCount}–{game.maxPlayerCount} players · {game.minPlaytime}–{game.maxPlaytime}{' '}
                minutes
              </p>
            </>
          ) : (
            <p>A storage box without a main BGG game.</p>
          )}
          {containing ? (
            <>
              <p>
                Box: <Link to={`/shelves/${containing.id}`}>{getBoxName(containing, library.games)}</Link>
              </p>
              <p>Current location: {SHELVES_IDS[containing.shelfId]?.description ?? containing.shelfId}</p>
            </>
          ) : (
            <p>Not assigned to a box.</p>
          )}
        </div>
      </div>
      {(error || save.isError) && (
        <Alert
          type="error"
          title="Organization not saved"
          description={error || save.error?.message}
          className="my-4"
        />
      )}
      <Form layout="vertical" disabled={busy}>
        {game && (
          <Form.Item label="Game classification" htmlFor="game-type">
            <Select<GameType>
              id="game-type"
              value={type}
              onChange={setType}
              options={GAME_TYPES.map((value) => ({ value, label: value }))}
            />
          </Form.Item>
        )}
        {game && !draft && (
          <Button
            disabled={busy || type === game.type}
            onClick={() => runEdit(() => updateBox(library, game.id, null, { [game.id]: type }))}
          >
            Save classification
          </Button>
        )}
        {draft && (
          <section aria-label="Box details" className="mt-4">
            <Typography.Title level={2}>
              {draft.mainGameId === null ? 'Storage box' : 'Original box'}
            </Typography.Title>
            <Form.Item label="Box size category" htmlFor="box-size">
              <Select<Exclude<BoxSize, 'none'>>
                id="box-size"
                value={draft.size}
                onChange={(size) => setDraft({ ...draft, size })}
                options={BOX_SIZES.filter((value) => value !== 'none').map((value) => ({
                  value,
                  label: value,
                }))}
              />
            </Form.Item>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(['width', 'height', 'depth'] as const).map((dimension) => (
                <Form.Item
                  key={dimension}
                  label={`${dimension[0].toUpperCase()}${dimension.slice(1)} (mm)`}
                  htmlFor={`box-${dimension}`}
                >
                  <InputNumber
                    id={`box-${dimension}`}
                    value={dimensions[dimension] ?? null}
                    className="!w-full"
                    onChange={(value) =>
                      setDimensions((current) => {
                        const next = { ...current };
                        if (value === null) delete next[dimension];
                        else next[dimension] = value;
                        return next;
                      })
                    }
                  />
                </Form.Item>
              ))}
            </div>
            <p>Optional external dimensions of the closed box. Shelving does not require measurements yet.</p>
            <Form.Item label="Shelf location" htmlFor="box-shelf">
              <Select
                id="box-shelf"
                value={draft.shelfId}
                onChange={(shelfId) => setDraft({ ...draft, shelfId })}
                options={Object.entries(SHELVES_IDS).map(([id, shelf]) => ({
                  value: id,
                  label: `${shelf.description} (${id})`,
                }))}
              />
            </Form.Item>
            {draft.mainGameId !== null && <p>Main game: {library.games[draft.id].name}</p>}
            <Form.Item
              label={draft.mainGameId === null ? 'Games in box' : 'Additional games in box'}
              htmlFor="box-contents"
            >
              <Select
                id="box-contents"
                mode="multiple"
                showSearch
                optionFilterProp="label"
                value={contents}
                onChange={(ids: string[]) =>
                  setDraft({ ...draft, contains: draft.mainGameId === null ? ids : [draft.id, ...ids] })
                }
                options={Object.values(library.games)
                  .filter(
                    (entry) =>
                      (draft.mainGameId === null || entry.id !== draft.id) &&
                      (!assigned.has(entry.id) || ownBox?.contains.includes(entry.id)),
                  )
                  .map((entry) => ({ value: entry.id, label: entry.name }))}
              />
            </Form.Item>
            <p>Removing a game from the contents leaves it unassigned; it does not delete the game.</p>
            <div className="my-4 flex flex-wrap gap-3">
              <Button type="primary" loading={busy} onClick={saveBox}>
                Save box
              </Button>
              {ownBox ? (
                <Popconfirm
                  title="Remove this box?"
                  description="All games in this box will become unassigned. No games will be deleted."
                  onConfirm={() => runEdit(() => updateBox(library, ownBox.id, null))}
                >
                  <Button danger disabled={busy}>
                    Remove box
                  </Button>
                </Popconfirm>
              ) : (
                <Button
                  onClick={() => {
                    setDraft(undefined);
                    setDimensions({});
                  }}
                >
                  Cancel box creation
                </Button>
              )}
            </div>
            {contents.length > 0 && (
              <ul className="break-words">
                {contents.map((id) => (
                  <li key={id}>
                    <Link to={`/shelves/${id}`}>{library.games[id].name}</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </Form>
      {game && !draft && !containing && (
        <div className="my-6 space-y-4">
          <Button
            disabled={busy}
            onClick={() =>
              setDraft({
                id: game.id,
                contains: [game.id],
                size: 'unknown',
                shelfId: 'unshelved',
                updatedAt: Date.now(),
              })
            }
          >
            Create original box
          </Button>
          <div className="flex flex-wrap gap-3">
            <Select
              aria-label="Assign to existing box"
              placeholder="Choose an existing box"
              className="w-full sm:max-w-sm"
              value={targetBox}
              onChange={setTargetBox}
              disabled={busy}
              showSearch
              optionFilterProp="label"
              options={Object.values(library.boxes).map((box) => ({
                value: box.id,
                label: getBoxName(box, library.games),
              }))}
            />
            <Button
              disabled={!targetBox || busy}
              onClick={() =>
                runEdit(() => {
                  const box = targetBox ? library.boxes[targetBox] : undefined;
                  if (!box) throw new Error('Choose an existing box.');
                  return updateBox(
                    library,
                    box.id,
                    { ...box, contains: [...box.contains, game.id] },
                    { [game.id]: type },
                  );
                })
              }
            >
              Assign to box
            </Button>
          </div>
        </div>
      )}
      {game && containing && !ownBox && (
        <Button
          disabled={busy}
          onClick={() =>
            runEdit(() =>
              updateBox(
                library,
                containing.id,
                { ...containing, contains: containing.contains.filter((id) => id !== game.id) },
                { [game.id]: type },
              ),
            )
          }
        >
          Remove from box
        </Button>
      )}
      {containing && <ShelvesSVG active={[containing.shelfId]} />}
    </Layout.Content>
  );
}
