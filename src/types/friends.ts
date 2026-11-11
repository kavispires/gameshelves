export interface BoardGameInterests {
  likesCooperative: boolean | null;
  likesCompetitive: boolean | null;
  likesHighInteraction: boolean | null;
  likesTakeThat: boolean | null;
  likesDryEuro: boolean | null;
  likesBluffing: boolean | null;
  likesDeduction: boolean | null;
  likesChaos: boolean | null;
  likesDiceRolling: boolean | null;
  likesRealTime: boolean | null;
  likesLimitedCommunication: boolean | null;
  likesStorytelling: boolean | null;
  likesAreaControl: boolean | null;
  likesDexterity: boolean | null;
  likesDungeonCrawler: boolean | null;
  likesCampaigns: boolean | null;
  likesWordGames: boolean | null;
  likesSillyPartyGames: boolean | null;
  likesCuteCozy: boolean | null;
  likesHistoryRealism: boolean | null;
  likesSciFiFantasy: boolean | null;
  isThemeAgnostic: boolean | null;
  hasAnalysisParalysis: boolean | null;
  likesTalking: boolean | null;
  prefersVibeOverVictory: boolean | null;
  isQuarterback: boolean | null;
}

export interface Friend {
  id: string;
  name: string;
  avatarId: string;
  interests: BoardGameInterests;
  assignedArchetypeId?: string;
}

export interface FriendsState {
  revision: string | null;
  friends: Record<string, Friend>;
}
