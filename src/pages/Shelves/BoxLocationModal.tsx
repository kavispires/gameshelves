import { Alert, Modal, Select } from 'antd';
import { ShelvesSVG } from 'components';
import { saveIcon } from 'components/icons';
import { Package } from 'lucide-react';
import { useState } from 'react';
import { SHELVES_IDS } from 'utils/constants';
import { STORAGES, type StorageId, storageForShelf } from 'utils/storage';

type BoxLocationModalProps = {
  box: ShelfEntry;
  perShelf: Record<ShelfId, ShelfEntry[]>;
  saving: boolean;
  error?: string;
  onSave: (shelfId: ShelfId) => void;
  onCancel: () => void;
};

export function BoxLocationModal({ box, perShelf, saving, error, onSave, onCancel }: BoxLocationModalProps) {
  const [storageId, setStorageId] = useState<StorageId>(storageForShelf(box.shelfId).id);
  const [selected, setSelected] = useState<ShelfId | undefined>(box.shelfId);
  const storage = STORAGES.find((storage) => storage.id === storageId);
  if (!storage) throw new Error('Choose a valid storage.');

  return (
    <Modal
      title={`Edit location: ${box.name}`}
      open
      width={720}
      okText="Save"
      confirmLoading={saving}
      okButtonProps={{ disabled: saving || !selected || selected === box.shelfId, icon: saveIcon }}
      cancelButtonProps={{ disabled: saving }}
      closable={!saving}
      mask={{ closable: !saving }}
      onCancel={onCancel}
      onOk={() => {
        if (selected) onSave(selected);
      }}
    >
      {error && (
        <Alert showIcon type="error" className="mb-4" title="Shelf placement not saved" description={error} />
      )}
      <label htmlFor="box-storage" className="mb-2 block font-medium">
        <span className="icon-label">
          <Package />
          Storage
        </span>
      </label>
      <Select<StorageId>
        id="box-storage"
        className="w-full"
        value={storageId}
        disabled={saving}
        onChange={(id) => {
          setStorageId(id);
          setSelected(undefined);
        }}
        options={STORAGES.map((storage) => ({ value: storage.id, label: storage.name }))}
      />
      <p>Click a shelf in this storage, then save. Your box and its contents will stay together.</p>
      <ShelvesSVG
        shelfId={storage.shelves[0].id}
        active={selected ? [selected] : []}
        perShelf={perShelf}
        onSelectShelf={saving ? undefined : setSelected}
      />
      <p aria-live="polite">
        {selected ? `Selected shelf: ${SHELVES_IDS[selected].description}` : 'Select a shelf to continue.'}
      </p>
    </Modal>
  );
}
