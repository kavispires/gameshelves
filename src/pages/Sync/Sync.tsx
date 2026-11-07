import { UploadOutlined } from '@ant-design/icons';
import { Alert, Button, Checkbox, Layout, Modal, Typography, Upload, type UploadFile } from 'antd';
import { useLibrary, useSaveLibrary } from 'hooks/useLibrary';
import { useState } from 'react';
import { getLegacyGames } from 'services/firebase';
import { prepareImport } from 'utils/library';
import type { ImportPreview } from '../../types/library';
import { parseCollectionCsv } from './importCsv';

export function Sync() {
  const query = useLibrary();
  const save = useSaveLibrary();
  const [preview, setPreview] = useState<ImportPreview>();
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [deletions, setDeletions] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [files, setFiles] = useState<UploadFile<unknown>[]>([]);
  const busy = reading || save.isPending || query.isFetching;

  async function importFile(file: File | undefined) {
    setPreview(undefined);
    setError('');
    setSuccess(false);
    setComplete(false);
    setDeletions(false);
    save.reset();
    if (!file || !query.data) return;
    setReading(true);
    try {
      const imported = parseCollectionCsv(await file.text());
      // Check organization before spending the one-time reads to recover archived covers.
      const initial = prepareImport(query.data, imported);
      setPreview(query.data.legacy ? prepareImport(query.data, imported, await getLegacyGames()) : initial);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to read the CSV file.');
    } finally {
      setReading(false);
    }
  }

  async function confirmImport() {
    if (!preview || !complete || (preview.removed.length > 0 && !deletions)) return;
    try {
      await save.mutateAsync({ base: preview.base, next: preview.next });
      setPreview(undefined);
      setFiles([]);
      setConfirming(false);
      setSuccess(true);
    } catch {
      // The mutation error remains visible; keep the approved preview available for retries.
      setConfirming(false);
    }
  }

  return (
    <Layout.Content className="mx-auto w-full max-w-4xl p-4">
      <Typography.Title level={1}>Settings</Typography.Title>
      <section aria-label="Saved library" className="mb-8">
        <Typography.Title level={2}>Saved library</Typography.Title>
        <p>
          Reload data already saved in Firestore, for example after changes on another device. This does not
          import a CSV and clears any unsaved import preview.
        </p>
        <Button
          disabled={busy}
          onClick={() => {
            setFiles([]);
            void importFile(undefined);
            void query.refetch();
          }}
        >
          Reload saved library
        </Button>
      </section>
      <Typography.Title level={2}>Import BGG collection</Typography.Title>
      <p>
        Upload your complete BGG collection CSV. Owned and preordered games are imported; new games start
        without a box assignment.
      </p>
      <p>
        Imports preserve your existing box contents, classification, dimensions, shelf locations and known
        covers. CSV files do not contain cover URLs.
      </p>
      {query.data?.legacy && (
        <Alert
          type="warning"
          title="First import migrates your library"
          description="Review the complete collection carefully. Existing organization will be migrated, and legacy Firestore records will remain untouched as backups. Ambiguous entries block migration until resolved."
          className="my-4"
        />
      )}
      <div className="my-4 max-w-full">
        <label htmlFor="bgg-collection-csv" className="mb-2 block font-medium">
          BGG collection CSV
        </label>
        <Upload<unknown>
          id="bgg-collection-csv"
          accept=".csv,text/csv"
          maxCount={1}
          fileList={files}
          disabled={busy}
          className="block max-w-full"
          showUploadList={{ showRemoveIcon: !busy }}
          beforeUpload={(file) => {
            setFiles([file]);
            void importFile(file);
            return false;
          }}
          onRemove={() => {
            setFiles([]);
            void importFile(undefined);
          }}
        >
          <Button icon={<UploadOutlined aria-hidden />} disabled={busy}>
            Choose CSV file
          </Button>
        </Upload>
        <p>The file is parsed in your browser. Nothing is saved until you review and confirm the import.</p>
      </div>
      {reading && <p role="status">Reading CSV…</p>}
      {(error || save.isError) && (
        <Alert
          type="error"
          title="Import not saved"
          description={error || save.error?.message}
          className="my-4"
        />
      )}
      {success && (
        <Alert
          type="success"
          title="Collection imported successfully"
          description="Your local library is up to date. Organize new games from Find Game."
          className="my-4"
        />
      )}
      {preview && (
        <section aria-label="Import preview" className="space-y-4">
          <Typography.Title level={3}>Import preview</Typography.Title>
          <p>
            {Object.keys(preview.next.games).length} games · {preview.added.length} additions ·{' '}
            {preview.changed.length} updates · {preview.removed.length} removals
          </p>
          <GameList title="Additions" games={preview.added.map((id) => preview.next.games[id])} />
          <GameList title="Updates" games={preview.changed.map((id) => preview.next.games[id])} />
          <GameList title="Removals" games={preview.removed} />
          {preview.released.length > 0 && (
            <Alert
              type="warning"
              title="Some kept games will lose their box assignment"
              description={preview.released.map((id) => preview.next.games[id].name).join(', ')}
            />
          )}
          <Checkbox
            checked={complete}
            disabled={busy}
            onChange={(event) => setComplete(event.target.checked)}
          >
            This CSV is my complete collection, not a filtered or partial export.
          </Checkbox>
          {preview.removed.length > 0 && (
            <div>
              <Checkbox
                checked={deletions}
                disabled={busy}
                onChange={(event) => setDeletions(event.target.checked)}
              >
                I confirm deleting the {preview.removed.length} listed games and their boxes from the active
                library.
              </Checkbox>
            </div>
          )}
          <div>
            <Button
              type="primary"
              disabled={busy || !complete || (preview.removed.length > 0 && !deletions)}
              onClick={() => setConfirming(true)}
            >
              Review and save import
            </Button>
          </div>
        </section>
      )}
      <Modal
        title={preview?.base.legacy ? 'Confirm library migration' : 'Confirm collection import'}
        open={confirming}
        onCancel={() => {
          if (!save.isPending) setConfirming(false);
        }}
        onOk={() => void confirmImport()}
        confirmLoading={save.isPending}
        cancelButtonProps={{ disabled: save.isPending }}
        okText="Confirm import"
        okButtonProps={{ danger: Boolean(preview?.removed.length) }}
        closable={!save.isPending}
        mask={{ closable: !save.isPending }}
      >
        <p>Save the reviewed catalog and box changes together?</p>
        {Boolean(preview?.removed.length) && (
          <p>
            The {preview?.removed.length} listed removals will be deleted from the active library. Surviving
            games in removed boxes will become unassigned.
          </p>
        )}
        {preview?.base.legacy && <p>Legacy records will not be deleted or modified.</p>}
      </Modal>
    </Layout.Content>
  );
}

function GameList({ title, games }: { title: string; games: { id: string; name: string }[] }) {
  return (
    <details>
      <summary className="cursor-pointer">
        {title} ({games.length})
      </summary>
      <ul className="max-h-60 overflow-auto break-words pl-6">
        {games.map((game) => (
          <li key={game.id}>
            {game.name} (BGG {game.id})
          </li>
        ))}
      </ul>
    </details>
  );
}
