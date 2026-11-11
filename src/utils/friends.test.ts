import { describe, expect, it } from 'vitest';
import sprite from '../assets/spring-avatars.svg?raw';
import { AVATARS } from './avatars';
import { emptyInterests, INTEREST_FIELDS, ratedCount, readFriends, validateFriend } from './friends';

const friend = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Test friend',
  avatarId: 'spring-001-rabbit',
  interests: emptyInterests(),
};

describe('friend profiles and sprite', () => {
  it('resolves every avatar to a unique symbol with its original viewBox', () => {
    const document = new DOMParser().parseFromString(sprite, 'image/svg+xml');
    expect(document.querySelector('parsererror')).toBeNull();
    expect(document.querySelectorAll('symbol')).toHaveLength(50);
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const avatar of AVATARS) {
      expect(document.getElementById(avatar.id)?.getAttribute('viewBox')).toBe(avatar.viewBox);
      expect(document.getElementById(avatar.id)?.querySelector('path')).not.toBeNull();
    }
  });

  it('preserves true, false and unrated values and counts either answer as rated', () => {
    expect(Object.keys(friend.interests)).toHaveLength(26);
    expect(new Set(INTEREST_FIELDS.map((field) => field.key)).size).toBe(26);
    const rated = {
      ...friend,
      interests: { ...emptyInterests(), likesCooperative: true, likesCompetitive: false },
    };
    const state = readFriends({ schemaVersion: 1, revision: 'saved', friends: { [friend.id]: rated } });
    expect(state.friends[friend.id]).toEqual(rated);
    expect(ratedCount(rated)).toBe(2);
    expect(ratedCount(friend)).toBe(0);
    expect(() => validateFriend({ ...rated, assignedArchetypeId: 'future-archetype' })).not.toThrow();
  });

  it.each([
    { ...friend, name: ' ' },
    { ...friend, name: ' untrimmed ' },
    { ...friend, id: '__proto__' },
    { ...friend, avatarId: 'missing' },
    { ...friend, interests: {} },
    { ...friend, interests: { ...friend.interests, likesCooperative: 'yes' } },
    { ...friend, assignedArchetypeId: '' },
  ])('rejects malformed profiles rather than defaulting ratings', (value) => {
    expect(() => validateFriend(value)).toThrow('Invalid friend');
  });

  it('rejects malformed saved documents and mismatched friend IDs', () => {
    expect(() => readFriends({ schemaVersion: 2, revision: 'saved', friends: {} })).toThrow();
    expect(() => readFriends({ schemaVersion: 1, revision: 'saved', friends: { other: friend } })).toThrow(
      'ID',
    );
  });
});
