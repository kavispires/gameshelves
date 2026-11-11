import { Alert, Form, Modal, Select, Typography } from 'antd';
import { Boxes, Package } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SHELVES_IDS } from 'utils/constants';
import { getBoxName, groupGames } from 'utils/library';
import type { Library, LibraryContent } from '../../types/library';

type GroupGamesModalProps = {
  library: Library;
  selected: string[];
  saving: boolean;
  error?: string;
  onSave: (leaderId: string) => void;
  onCancel: () => void;
};

export function GroupGamesModal({
  library,
  selected,
  saving,
  error,
  onSave,
  onCancel,
}: GroupGamesModalProps) {
  const [leaderId, setLeaderId] = useState<string>();
  const preview = useMemo<{ next?: LibraryContent; error?: string }>(() => {
    if (!leaderId) return {};
    try {
      return { next: groupGames(library, selected, leaderId) };
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : 'Unable to preview grouping.' };
    }
  }, [library, selected, leaderId]);
  const destination = leaderId ? preview.next?.boxes[leaderId] : undefined;
  const nextBoxes = preview.next?.boxes;
  const removed = nextBoxes
    ? Object.values(library.boxes).filter((box) => !Object.hasOwn(nextBoxes, box.id))
    : [];
  const failure = preview.error || error;

  return (
    <Modal
      title="Group games in a box"
      open
      okText="Group games"
      confirmLoading={saving}
      okButtonProps={{ disabled: !destination || saving, icon: <Boxes /> }}
      cancelButtonProps={{ disabled: saving }}
      closable={!saving}
      mask={{ closable: !saving }}
      keyboard={!saving}
      onCancel={onCancel}
      onOk={() => {
        if (leaderId && destination) onSave(leaderId);
      }}
    >
      {failure && (
        <Alert showIcon type="error" className="mb-4" title="Games not grouped" description={failure} />
      )}
      <p>
        Choose the main game whose physical box will hold the group. Existing contents stay. Selecting another
        box's main game also moves all its contents.
      </p>
      <Form layout="vertical">
        <Form.Item
          label={
            <span className="icon-label">
              <Package />
              Main game
            </span>
          }
          htmlFor="group-main-game"
        >
          <Select
            id="group-main-game"
            placeholder="Choose a selected game"
            showSearch
            optionFilterProp="label"
            value={leaderId}
            disabled={saving}
            onChange={setLeaderId}
            options={selected
              .map((id) => ({ value: id, label: library.games[id].name }))
              .sort((a, b) => a.label.localeCompare(b.label))}
          />
        </Form.Item>
      </Form>
      {destination && (
        <section aria-label="Grouping preview">
          <Typography.Paragraph>
            <strong>
              {library.boxes[destination.id] ? 'Use existing box' : 'Create new box'}:{' '}
              {getBoxName(destination, library.games)}
            </strong>
            <br />
            Location: {SHELVES_IDS[destination.shelfId].description}
          </Typography.Paragraph>
          <p>
            {destination.contains.length} games will be in this box, including any existing contents and games
            carried over from removed boxes.
          </p>
          <ul className="max-h-56 list-disc overflow-y-auto pl-5">
            {destination.contains.map((id) => (
              <li key={id}>{library.games[id].name}</li>
            ))}
          </ul>
          {removed.length > 0 && (
            <>
              <p>These superseded boxes will be removed:</p>
              <ul className="max-h-32 list-disc overflow-y-auto pl-5">
                {removed.map((box) => (
                  <li key={box.id}>{getBoxName(box, library.games)}</li>
                ))}
              </ul>
            </>
          )}
          <Typography.Paragraph type="secondary" className="!mb-0 mt-4">
            No catalog games will be deleted. Other boxes lose only the games being moved; empty named
            containers are kept. New boxes start unshelved with no measurements.
          </Typography.Paragraph>
        </section>
      )}
    </Modal>
  );
}
