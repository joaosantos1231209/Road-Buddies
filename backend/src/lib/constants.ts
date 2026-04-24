export const TripType = {
  PROVIDER: 'PROVIDER',
  NEEDRIDE: 'NEEDRIDE',
} as const;
export type TripType = typeof TripType[keyof typeof TripType];

export const TripStatus = {
  ACTIVE: 'ACTIVE',
  MATCHED: 'MATCHED',
  CANCELLED: 'CANCELLED',
} as const;
export type TripStatus = typeof TripStatus[keyof typeof TripStatus];

export const MatchStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
} as const;
export type MatchStatus = typeof MatchStatus[keyof typeof MatchStatus];
