import { pgTable, serial, text, varchar, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: varchar('id', { length: 128 }).primaryKey(), // Firebase UID
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  avatarUrl: text('avatar_url'),
  phone: varchar('phone', { length: 20 }),
  vehicleInfo: text('vehicle_info'),
  isAdmin: boolean('is_admin').default(false).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  verificationCode: varchar('verification_code', { length: 10 }),
  verificationExpiry: timestamp('verification_expiry'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  fcmToken: text('fcm_token'),
});

export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  isActive: boolean('is_active').default(true).notNull(),
  isOffice: boolean('is_office').default(false).notNull(),
});

export const trips = pgTable('trips', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id),
  type: varchar('type', { length: 20 }).notNull(), // 'PROVIDER' or 'NEEDRIDE'
  originId: integer('origin_id').notNull().references(() => cities.id),
  destinationId: integer('destination_id').notNull().references(() => cities.id),
  departureTime: timestamp('departure_time').notNull(),
  availableSeats: integer('available_seats').notNull().default(0),
  vehicleType: text('vehicle_type'),
  tripVehicleDetails: text('trip_vehicle_details'),
  hidden: boolean('hidden').notNull().default(false),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'), // ACTIVE, CANCELLED
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const spRequests = pgTable('sp_requests', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  originId: integer('origin_id').references(() => cities.id),
  destinationId: integer('destination_id').notNull().references(() => cities.id),
  dateNeeded: timestamp('date_needed', { withTimezone: true }).notNull(),
  justification: text('justification'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tripParticipants = pgTable('trip_participants', {
  id: serial('id').primaryKey(),
  tripId: integer('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  providerTripId: integer('provider_trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  seekerTripId: integer('seeker_trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  isRead: boolean('is_read').default(false).notNull(),
});

export const chatReads = pgTable('chat_reads', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  tripId: integer('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  lastReadAt: timestamp('last_read_at', { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  tripId: integer('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  senderId: varchar('sender_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [messages.tripId],
    references: [trips.id],
  }),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  participants: many(tripParticipants),
  creator: one(users, {
    fields: [trips.userId],
    references: [users.id]
  }),
}));

export const tripParticipantsRelations = relations(tripParticipants, ({ one }) => ({
  trip: one(trips, {
    fields: [tripParticipants.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [tripParticipants.userId],
    references: [users.id],
  }),
}));
export const spRequestsRelations = relations(spRequests, ({ one }) => ({
  origin: one(cities, {
    fields: [spRequests.originId],
    references: [cities.id],
    relationName: 'spRequestOrigin',
  }),
  destination: one(cities, {
    fields: [spRequests.destinationId],
    references: [cities.id],
    relationName: 'spRequestDestination',
  }),
}));

export const chatReadsRelations = relations(chatReads, ({ one }) => ({
  user: one(users, {
    fields: [chatReads.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [chatReads.tripId],
    references: [trips.id],
  }),
}));
