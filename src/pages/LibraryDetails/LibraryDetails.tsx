import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Layout,
  Popconfirm,
  Select,
  Tag,
  Typography,
} from 'antd';
import { BackLink, GameCover, ShelvesSVG } from 'components';
import { useSaveLibrary } from 'hooks/useLibrary';
import { useQueryShelvedGames } from 'hooks/useQueryShelvedGames';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BOX_SIZES, GAME_TYPES, SHELVES_IDS } from 'utils/constants';
import { findBox, getBoxName, updateBox, validDimensions } from 'utils/library';
import type { CatalogGame, GameBox, Library, LibraryContent } from '../../types/library';
import { NotFound } from '../NotFound/NotFound';

export function LibraryDetails({ kind }: { kind: 'game' | 'box' }) {
  const { id = '' } = useParams();
  const { data: library, perShelf } = useQueryShelvedGames();
  if (!library) return null;
  if (library.legacy) {
    const entry =
      kind === 'box'
        ? Object.hasOwn(library.legacy.shelves, id)
          ? library.legacy.shelves[id]
          : undefined
        : Object.values(library.legacy.shelves).find((box) => box.contains.some((game) => game.id === id));
    const game = entry?.contains.find((game) => game.id === id);
    if (!entry || (kind === 'game' && !game) || (kind === 'box' && entry.box === 'none')) return <NotFound />;
    return (
      <Layout.Content className="p-4">
        <Typography.Title level={1}>{kind === 'box' ? entry.name : game?.name}</Typography.Title>
        {entry.box === 'none' ? (
          <p>Not assigned to a box.</p>
        ) : (
          <>
            <p>Current location: {SHELVES_IDS[entry.shelfId]?.description ?? entry.shelfId}</p>
            <p>Box: {entry.name}</p>
            <ShelvesSVG shelfId={entry.shelfId} active={[entry.shelfId]} perShelf={perShelf} />
          </>
        )}
      </Layout.Content>
    );
  }
  const box = Object.hasOwn(library.boxes, id) ? library.boxes[id] : undefined;
  if (kind === 'box' && !box) return <NotFound />;
  if (kind === 'box' && box?.mainGameId === null) {
    return (
      <GameDetails
        key={`${kind}:${id}:${library.revision}`}
        library={library}
        customBox={box}
        perShelf={perShelf}
      />
    );
  }
  const game = Object.hasOwn(library.games, id) ? library.games[id] : undefined;
  if (!game) return <NotFound />;
  return (
    <GameDetails
      key={`${kind}:${id}:${library.revision}`}
      library={library}
      game={game}
      perShelf={perShelf}
    />
  );
}

type GameDetailsProps = { library: Library; perShelf: Record<ShelfId, ShelfEntry[]> } & (
  | { game: CatalogGame; customBox?: never }
  | { game?: never; customBox: GameBox }
);

function GameDetails({ library, game, customBox, perShelf }: GameDetailsProps) {
  const containing = customBox ?? (game ? findBox(library.boxes, game.id) : undefined);
  const ownBox = customBox ?? (containing?.id === game?.id ? containing : undefined);
  const name = game ? game.name : getBoxName(customBox, library.games);
  const savedImageUrl = game?.image || game?.thumbnail || '';
  const [draft, setDraft] = useState(ownBox);
  const [type, setType] = useState<GameType>(game?.type ?? 'unknown');
  const [imageUrl, setImageUrl] = useState(savedImageUrl);
  const [dimensions, setDimensions] = useState<Partial<BoxDimensions>>(ownBox?.dimensions ?? {});
  const [targetBox, setTargetBox] = useState<string>();
  const [error, setError] = useState('');
  const save = useSaveLibrary();
  const assigned = new Set(Object.values(library.boxes).flatMap((box) => box.contains));
  const busy = save.isPending;
  const contents = draft?.mainGameId === null ? draft.contains : (draft?.contains.slice(1) ?? []);

  function persist(next: LibraryContent) {
    if (game) {
      const image = imageUrl.trim();
      if (image !== savedImageUrl) {
        if (image) {
          let url: URL;
          try {
            url = new URL(image);
          } catch {
            throw new Error('Enter a complete HTTP or HTTPS image URL, or leave it empty.');
          }
          if (url.protocol !== 'https:' && url.protocol !== 'http:') {
            throw new Error('Enter a complete HTTP or HTTPS image URL, or leave it empty.');
          }
        }
        next = {
          ...next,
          games: { ...next.games, [game.id]: { ...next.games[game.id], image, thumbnail: image } },
        };
      }
    }
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
    <Layout.Content className="mx-auto w-full max-w-2xl px-4 py-6">
      <BackLink fallback="/" className="mb-4 inline-block text-sm" />
      <header className="mb-5 flex items-start gap-4 rounded-2xl border border-info/15 bg-info/5 p-4 sm:gap-6 sm:p-6">
        {game && (
          <div className="w-24 shrink-0 sm:w-32">
            <GameCover
              id={game.id}
              type="image"
              name={game.name}
              width={128}
              rootClassName="!max-w-full"
              className="rounded-lg"
              style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
            />
          </div>
        )}
        <div className="min-w-0 flex-1 break-words">
          <Typography.Title level={1} className="!mt-0 !mb-3 !text-2xl sm:!text-3xl">
            {name}
          </Typography.Title>
          {game ? (
            <>
              <div className="mb-3 flex flex-wrap gap-1">
                <Tag color="cyan">{game.status === 'OWN' ? 'Owned' : 'Preordered'}</Tag>
                <Tag>{game.year || 'Year unknown'}</Tag>
                <Tag>{game.type}</Tag>
              </div>
              <p className="my-2 text-sm">
                {game.minPlayerCount}–{game.maxPlayerCount} players · {game.minPlaytime}–{game.maxPlaytime}{' '}
                minutes
              </p>
              <Typography.Link
                href={`https://boardgamegeek.com/boardgame/${encodeURIComponent(game.id)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on BoardGameGeek
              </Typography.Link>
            </>
          ) : (
            <p>A storage box without a main BGG game.</p>
          )}
          {containing ? (
            <>
              <p className="mt-4 mb-1 text-sm">
                Box:{' '}
                <Link to={`/boxes/${encodeURIComponent(containing.id)}`}>
                  {getBoxName(containing, library.games)}
                </Link>
              </p>
              <p className="my-1 text-sm">
                Current location: {SHELVES_IDS[containing.shelfId]?.description ?? containing.shelfId}
              </p>
            </>
          ) : (
            <p>Not assigned to a box.</p>
          )}
        </div>
      </header>
      {(error || save.isError) && (
        <Alert
          type="error"
          title="Organization not saved"
          description={error || save.error?.message}
          className="my-4"
        />
      )}
      <Form layout="vertical" disabled={busy} className="space-y-5">
        {game && (
          <Card
            title={
              <Typography.Title level={2} className="!m-0 !text-lg">
                Game details
              </Typography.Title>
            }
          >
            <div className="grid gap-x-4 sm:grid-cols-[160px_minmax(0,1fr)]">
              <Form.Item label="Game classification" htmlFor="game-type">
                <Select<GameType>
                  id="game-type"
                  value={type}
                  onChange={setType}
                  options={GAME_TYPES.map((value) => ({ value, label: value }))}
                />
              </Form.Item>
              <Form.Item label="Image URL" htmlFor="game-image-url">
                <Input
                  id="game-image-url"
                  type="url"
                  value={imageUrl}
                  placeholder="https://cf.geekdo-images.com/…"
                  onChange={(event) => setImageUrl(event.target.value)}
                  allowClear
                />
              </Form.Item>
            </div>
            <Typography.Paragraph type="secondary" className="!mb-0 text-sm">
              Open an image on BGG and copy its image address, not the game-page link.
              {draft && ' Cover and classification changes are saved with the box.'}
            </Typography.Paragraph>
            {!draft && (
              <Button
                type="primary"
                className="mt-4"
                loading={busy}
                disabled={busy || (type === game.type && imageUrl.trim() === savedImageUrl)}
                onClick={() => runEdit(() => updateBox(library, game.id, null, { [game.id]: type }))}
              >
                Save game details
              </Button>
            )}
          </Card>
        )}
        {draft && (
          <section aria-label="Box details">
            <Card
              title={
                <Typography.Title level={2} className="!m-0 !text-lg">
                  {draft.mainGameId === null ? 'Storage box' : 'Original box'}
                </Typography.Title>
              }
            >
              <div className="grid gap-x-4 sm:grid-cols-2">
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
                <Form.Item label="Shelf location" htmlFor="box-shelf">
                  <Select
                    id="box-shelf"
                    value={draft.shelfId}
                    onChange={(shelfId) => setDraft({ ...draft, shelfId })}
                    showSearch
                    optionFilterProp="label"
                    options={Object.entries(SHELVES_IDS).map(([id, shelf]) => ({
                      value: id,
                      label: `${shelf.description} (${id})`,
                    }))}
                  />
                </Form.Item>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['width', 'height', 'depth'] as const).map((dimension) => (
                  <Form.Item
                    key={dimension}
                    label={
                      <span className="whitespace-nowrap">
                        {`${dimension[0].toUpperCase()}${dimension.slice(1)} (mm)`}
                      </span>
                    }
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
              <Typography.Paragraph type="secondary" className="text-sm">
                Optional closed-box measurements. Enter all three or leave them empty.
              </Typography.Paragraph>
              {draft.mainGameId !== null && (
                <p className="text-sm">Main game: {library.games[draft.id].name}</p>
              )}
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
              <Typography.Paragraph type="secondary" className="text-sm">
                Removing a game leaves it unassigned, not deleted.
              </Typography.Paragraph>
              {contents.length > 0 && (
                <ul className="mb-5 flex flex-wrap gap-2 break-words">
                  {contents.map((id) => (
                    <li key={id} className="min-w-0 max-w-full">
                      <Link
                        className="inline-block rounded-lg bg-paper px-3 py-2 text-sm"
                        to={`/games/${encodeURIComponent(id)}`}
                      >
                        {library.games[id].name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-3 border-0 border-t border-solid border-paper pt-4">
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
            </Card>
          </section>
        )}
      </Form>
      {game && !draft && !containing && (
        <Card className="!my-5">
          <Typography.Title level={2} className="!mt-0 !text-lg">
            Organize this game
          </Typography.Title>
          <p className="text-sm text-muted">
            Keep it in its original box, or add it to a box you already have.
          </p>
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
          <div className="mt-4 flex flex-wrap gap-3">
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
        </Card>
      )}
      {game && containing && !ownBox && (
        <Popconfirm
          title="Remove this game from its box?"
          description="The game will become unassigned. No games will be deleted."
          okText="Remove"
          okButtonProps={{ danger: true }}
          disabled={busy}
          onConfirm={() =>
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
          <Button danger disabled={busy}>
            Remove from box
          </Button>
        </Popconfirm>
      )}
      {containing && (
        <Card
          className="!mt-5"
          title={
            <Typography.Title level={2} className="!m-0 !text-lg">
              On the shelf
            </Typography.Title>
          }
        >
          <ShelvesSVG shelfId={containing.shelfId} active={[containing.shelfId]} perShelf={perShelf} />
          <Link to={`/shelves/${containing.shelfId}`}>View all boxes in this location</Link>
        </Card>
      )}
    </Layout.Content>
  );
}
