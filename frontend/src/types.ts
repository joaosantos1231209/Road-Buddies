export interface City {
  id: number;
  name: string;
  isActive: boolean;
  isOffice: boolean;
}

export interface UserPublic {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  phone: string | null;
  vehicleInfo: string | null;
  isAdmin: boolean;
  isVerified: boolean;
  fcmToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripParticipant {
  id: number;
  tripId: number;
  userId: string;
  joinedAt: string;
  user?: Pick<UserPublic, 'id' | 'username' | 'avatarUrl'>;
}

export interface Trip {
  id: number;
  userId: string;
  type: 'PROVIDER' | 'NEEDRIDE';
  originId: number;
  destinationId: number;
  departureTime: string;
  availableSeats: number;
  vehicleType: string | null;
  tripVehicleDetails: string | null;
  hidden: boolean;
  status: 'ACTIVE' | 'MATCHED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  creator?: Pick<UserPublic, 'id' | 'username' | 'avatarUrl' | 'email' | 'fcmToken' | 'vehicleInfo'>;
  participants?: TripParticipant[];
}

export interface Match {
  id: number;
  providerTripId: number;
  seekerTripId: number;
  status: 'PENDING' | 'ACCEPTED';
  isRead: boolean;
  createdAt: string;
  providerTrip?: Trip & { creator?: Pick<UserPublic, 'id' | 'username'> };
  seekerTrip?: Trip;
}

export interface Message {
  id: number;
  tripId: number;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: Pick<UserPublic, 'id' | 'username' | 'avatarUrl'>;
}

export interface SpRequest {
  id: number;
  userId: string;
  originId: number | null;
  destinationId: number;
  dateNeeded: string;
  justification: string | null;
  createdAt: string;
  origin?: City | null;
  destination?: City;
}

export interface UnreadChats {
  unreadCount: number;
  unreadByTrip: Record<number, number>;
}
