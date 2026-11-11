import { Alert, Collapse, Form, Input, Modal, Segmented } from 'antd';
import { AvatarPicker } from 'components/FriendAvatar';
import { saveIcon } from 'components/icons';
import { INTEREST_GROUPS } from 'utils/friends';
import type { Friend } from '../../types/friends';

type Props = {
  friend: Friend;
  creating: boolean;
  saving: boolean;
  error?: string;
  onSave: (friend: Friend) => void;
  onCancel: () => void;
  unavailableAvatarIds: ReadonlySet<string>;
};

export function FriendModal({
  friend,
  creating,
  saving,
  error,
  onSave,
  onCancel,
  unavailableAvatarIds,
}: Props) {
  const [form] = Form.useForm<Friend>();
  return (
    <Modal
      open
      title={creating ? 'Add friend' : 'Edit friend'}
      width={800}
      style={{ top: 16, maxWidth: 'calc(100vw - 32px)' }}
      styles={{ body: { maxHeight: 'calc(100dvh - 200px)', overflowY: 'auto', paddingInline: 4 } }}
      okText="Save friend"
      onOk={() => form.submit()}
      onCancel={onCancel}
      confirmLoading={saving}
      okButtonProps={{ disabled: saving, icon: saveIcon }}
      cancelButtonProps={{ disabled: saving }}
      closable={!saving}
      keyboard={!saving}
      mask={{ closable: !saving }}
    >
      {error && <Alert showIcon type="error" title={error} className="mb-4" />}
      <Form<Friend>
        form={form}
        layout="vertical"
        initialValues={friend}
        disabled={saving}
        onFinish={(values) =>
          onSave({
            ...friend,
            name: values.name.trim(),
            avatarId: values.avatarId,
            interests: values.interests,
          })
        }
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, whitespace: true, message: 'Enter a name.' }]}
        >
          <Input autoFocus autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="avatarId"
          label="Avatar"
          rules={[
            { required: true, message: 'Choose an avatar.' },
            {
              validator: (_, value: unknown) =>
                typeof value === 'string' && unavailableAvatarIds.has(value)
                  ? Promise.reject(new Error('Choose an avatar not used by another friend.'))
                  : Promise.resolve(),
            },
          ]}
        >
          <AvatarPicker unavailableAvatarIds={unavailableAvatarIds} />
        </Form.Item>
        <p>Preferences are optional. Not rated is different from No.</p>
        <Collapse
          items={INTEREST_GROUPS.map((group) => ({
            key: group.label,
            label: group.label,
            forceRender: true,
            children: (
              <div className="grid gap-x-4 sm:grid-cols-2 md:grid-cols-3">
                {group.fields.map((field) => (
                  <Form.Item
                    key={field.key}
                    name={['interests', field.key]}
                    label={field.label}
                    tooltip={field.description}
                    getValueProps={(value: boolean | null) => ({
                      value: value === null ? 'unrated' : value ? 'yes' : 'no',
                    })}
                    normalize={(value: string) => (value === 'yes' ? true : value === 'no' ? false : null)}
                  >
                    <Segmented
                      block
                      name={`${friend.id}-${field.key}`}
                      aria-label={field.label}
                      options={[
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' },
                        {
                          label: <span className="sr-only">Not rated</span>,
                          value: 'unrated',
                          title: 'Not rated',
                        },
                      ]}
                    />
                  </Form.Item>
                ))}
              </div>
            ),
          }))}
        />
      </Form>
    </Modal>
  );
}
