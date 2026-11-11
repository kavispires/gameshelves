import catalog from '../assets/spring-avatars.json';

export const AVATARS: readonly { id: string; name: string; viewBox: string }[] = catalog;
const ids = new Set(AVATARS.map((avatar) => avatar.id));
export const isAvatarId = (value: unknown): value is string => typeof value === 'string' && ids.has(value);
