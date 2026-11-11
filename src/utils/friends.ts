import type { BoardGameInterests, Friend, FriendsState } from '../types/friends';
import { isAvatarId } from './avatars';
import { isRecord } from './guards';

type InterestField = { key: keyof BoardGameInterests; label: string; description: string };
export const INTEREST_GROUPS: readonly { label: string; fields: readonly InterestField[] }[] = [
  {
    label: 'Engagement',
    fields: [
      {
        key: 'likesCooperative',
        label: 'Cooperative',
        description: 'Working together against the game system.',
      },
      {
        key: 'likesCompetitive',
        label: 'Competitive',
        description: 'Competing to determine a single winner.',
      },
      {
        key: 'likesHighInteraction',
        label: 'High interaction',
        description: 'Constant talking, trading or negotiation.',
      },
      { key: 'likesTakeThat', label: 'Take-that', description: "Actively disrupting opponents' progress." },
    ],
  },
  {
    label: 'Mechanics & Genres',
    fields: [
      {
        key: 'likesDryEuro',
        label: 'Dry euro',
        description: 'Optimizing resources, tracks and victory points without a strong narrative.',
      },
      {
        key: 'likesBluffing',
        label: 'Bluffing',
        description: 'Hidden roles, lying and deceiving other players.',
      },
      {
        key: 'likesDeduction',
        label: 'Deduction',
        description: 'Gathering clues and solving logical puzzles.',
      },
      { key: 'likesChaos', label: 'Chaos', description: 'Unpredictable swings and wild game states.' },
      {
        key: 'likesDiceRolling',
        label: 'Dice rolling',
        description: 'The tactile thrill and push-your-luck element of rolling dice.',
      },
      { key: 'likesRealTime', label: 'Real time', description: 'Playing under time pressure with timers.' },
      {
        key: 'likesLimitedCommunication',
        label: 'Limited communication',
        description: 'Games restricting what, when or how players can speak.',
      },
      {
        key: 'likesStorytelling',
        label: 'Storytelling',
        description: 'Creating a narrative or creative roleplay.',
      },
      {
        key: 'likesAreaControl',
        label: 'Area control',
        description: 'Fighting for dominance over regions on a map.',
      },
      {
        key: 'likesDexterity',
        label: 'Dexterity',
        description: 'Flicking, stacking, catching or balancing components.',
      },
      {
        key: 'likesDungeonCrawler',
        label: 'Dungeon crawlers',
        description: 'Exploring maps, fighting monsters and leveling up characters.',
      },
      {
        key: 'likesCampaigns',
        label: 'Campaigns',
        description: 'Multiple sessions with a persistent story or legacy elements.',
      },
      {
        key: 'likesWordGames',
        label: 'Word games',
        description: 'Vocabulary, spelling and word-association challenges.',
      },
      {
        key: 'likesSillyPartyGames',
        label: 'Silly party games',
        description: 'Lighthearted games with simple rules and funny situations.',
      },
    ],
  },
  {
    label: 'Theme & Aesthetics',
    fields: [
      {
        key: 'likesCuteCozy',
        label: 'Cute & cozy',
        description: 'Relaxing themes, animals, pastels and cozy vibes.',
      },
      {
        key: 'likesHistoryRealism',
        label: 'History & realism',
        description: 'Historical settings, civilizations and realistic economies.',
      },
      {
        key: 'likesSciFiFantasy',
        label: 'Sci-fi & fantasy',
        description: 'Space exploration, magic and dungeon crawling.',
      },
      {
        key: 'isThemeAgnostic',
        label: 'Theme agnostic',
        description: 'Only cares about mechanical rules, not art or setting.',
      },
    ],
  },
  {
    label: 'Table Vibe',
    fields: [
      {
        key: 'hasAnalysisParalysis',
        label: 'Analysis paralysis',
        description: 'Tends to freeze up or take long turns with many options.',
      },
      {
        key: 'likesTalking',
        label: 'Talking',
        description: 'Vocal and enjoys socializing heavily during gameplay.',
      },
      {
        key: 'prefersVibeOverVictory',
        label: 'Vibe over victory',
        description: 'Values funny moments, company or narrative over winning.',
      },
      {
        key: 'isQuarterback',
        label: 'Quarterback',
        description: "Tends to direct other players' turns in cooperative games.",
      },
    ],
  },
];
export const INTEREST_FIELDS = INTEREST_GROUPS.flatMap((group) => group.fields);

export function emptyInterests(): BoardGameInterests {
  return {
    likesCooperative: null,
    likesCompetitive: null,
    likesHighInteraction: null,
    likesTakeThat: null,
    likesDryEuro: null,
    likesBluffing: null,
    likesDeduction: null,
    likesChaos: null,
    likesDiceRolling: null,
    likesRealTime: null,
    likesLimitedCommunication: null,
    likesStorytelling: null,
    likesAreaControl: null,
    likesDexterity: null,
    likesDungeonCrawler: null,
    likesCampaigns: null,
    likesWordGames: null,
    likesSillyPartyGames: null,
    likesCuteCozy: null,
    likesHistoryRealism: null,
    likesSciFiFantasy: null,
    isThemeAgnostic: null,
    hasAnalysisParalysis: null,
    likesTalking: null,
    prefersVibeOverVictory: null,
    isQuarterback: null,
  };
}

export const ratedCount = (friend: Friend) =>
  INTEREST_FIELDS.filter(({ key }) => friend.interests[key] !== null).length;

export function usedAvatarIds(friends: Record<string, Friend>, exceptId: string): Set<string> {
  return new Set(
    Object.values(friends)
      .filter((friend) => friend.id !== exceptId)
      .map((friend) => friend.avatarId),
  );
}

export function validateFriend(value: unknown): asserts value is Friend {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.id) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    value.name !== value.name.trim() ||
    !isAvatarId(value.avatarId) ||
    !isRecord(value.interests) ||
    !INTEREST_FIELDS.every(
      ({ key }) =>
        value.interests !== null &&
        isRecord(value.interests) &&
        (value.interests[key] === null || typeof value.interests[key] === 'boolean'),
    ) ||
    (value.assignedArchetypeId !== undefined &&
      (typeof value.assignedArchetypeId !== 'string' || !value.assignedArchetypeId.trim()))
  ) {
    throw new Error('Invalid friend profile: check the name, avatar and all preference ratings.');
  }
}

export function readFriends(value: unknown): FriendsState {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    typeof value.revision !== 'string' ||
    !value.revision ||
    !isRecord(value.friends)
  )
    throw new Error('Invalid saved friends document.');
  const friends: Record<string, Friend> = {};
  for (const [id, friend] of Object.entries(value.friends)) {
    validateFriend(friend);
    if (friend.id !== id) throw new Error('Invalid saved friend ID.');
    friends[id] = friend;
  }
  return { revision: value.revision, friends };
}
