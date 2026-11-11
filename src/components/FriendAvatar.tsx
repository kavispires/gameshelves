import { Radio, Tooltip } from 'antd';
import sprite from 'assets/spring-avatars.svg';
import { AVATARS } from 'utils/avatars';

export function FriendAvatar({ avatarId, size = 40 }: { avatarId: string; size?: number }) {
  const avatar = AVATARS.find((item) => item.id === avatarId);
  if (!avatar) throw new Error(`Unknown avatar ID: ${avatarId}`);
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox={avatar.viewBox}>
      <use href={`${sprite}#${avatarId}`} width="100%" height="100%" />
    </svg>
  );
}

export function AvatarPicker({
  value,
  onChange,
  id,
  unavailableAvatarIds,
}: {
  value?: string;
  onChange?: (id: string) => void;
  id?: string;
  unavailableAvatarIds: ReadonlySet<string>;
}) {
  return (
    <Radio.Group
      id={id}
      name={id}
      role="radiogroup"
      aria-label="Avatar"
      value={value}
      className="!grid grid-cols-3 gap-2 sm:grid-cols-8"
    >
      {[...AVATARS]
        .sort((a, b) => Number(unavailableAvatarIds.has(a.id)) - Number(unavailableAvatarIds.has(b.id)))
        .map((avatar) => (
          <Tooltip
            key={avatar.id}
            title={`${avatar.name} (${avatar.id})${unavailableAvatarIds.has(avatar.id) ? ' - Already used' : ''}`}
          >
            <Radio.Button
              value={avatar.id}
              disabled={unavailableAvatarIds.has(avatar.id) || undefined}
              aria-label={`${avatar.name} (${avatar.id})`}
              onChange={() => onChange?.(avatar.id)}
              className={`!flex !h-16 items-center justify-center !rounded !border${unavailableAvatarIds.has(avatar.id) ? ' opacity-40' : ''}`}
            >
              <FriendAvatar avatarId={avatar.id} size={48} />
            </Radio.Button>
          </Tooltip>
        ))}
    </Radio.Group>
  );
}
