import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatar: text("avatar"),
  firebaseId: text("firebase_id"),
  // Email verification
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  // Profile info
  phone: text("phone"),
  location: text("location"),
  about: text("about"),
  // Travel preferences
  vehicle: text("vehicle"),
  vehicleSeats: integer("vehicle_seats"),
  departureTime: text("departure_time"),
  returnTime: text("return_time"),
  travelPreferences: text("travel_preferences"),
  travelRules: text("travel_rules"),
  // Role
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

// TripStatus enum
export const TripStatusEnum = z.enum([
  "PROVIDER", // Definitely providing vehicle
  // "FLEXIBLE", // Can provide if needed (TEMPORARILY DISABLED)
  "NEEDRIDE", // Need a ride
]);

export type TripStatus = z.infer<typeof TripStatusEnum>;

// Trip schema
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  originName: text("origin_name").notNull(),
  originLat: text("origin_lat").notNull(),
  originLng: text("origin_lng").notNull(),
  originRadius: integer("origin_radius").notNull(), // in kilometers
  destinationName: text("destination_name").notNull(),
  destinationLat: text("destination_lat").notNull(),
  destinationLng: text("destination_lng").notNull(),
  destinationRadius: integer("destination_radius").notNull(), // in kilometers
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"), // Optional for flexible date range
  departureTime: text("departure_time"), // Time of departure (HH:MM)
  status: text("status").notNull(), // PROVIDER, NEEDRIDE (FLEXIBLE temporarily removed)
  availableSeats: integer("available_seats"),
  notes: text("notes"),
  hidden: boolean("hidden").default(false).notNull(), // Flag to hide trip when user joins another trip
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTripSchema = createInsertSchema(trips)
  .omit({
    id: true,
    createdAt: true
  })
  .extend({
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)).nullish(),
    departureTime: z.string().optional(),
  });

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  tripId: integer("trip_id").references(() => trips.id),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  read: true,
  createdAt: true
});

// Match schema - for storing matched trips
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  tripId1: integer("trip_id1").notNull().references(() => trips.id),
  tripId2: integer("trip_id2").notNull().references(() => trips.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true
});

// Trip participants schema - for users who have joined a trip
export const tripParticipants = pgTable("trip_participants", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id),
  userId: integer("user_id").notNull().references(() => users.id),
  userNeedRideTripId: integer("user_need_ride_trip_id").references(() => trips.id), // ID da viagem NEEDRIDE criada automaticamente
  status: text("status").notNull().default("JOINED"), // JOINED, CANCELLED, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTripParticipantSchema = createInsertSchema(tripParticipants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

// City schema
export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  lat: text("lat").notNull(),
  lng: text("lng").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type TripParticipant = typeof tripParticipants.$inferSelect;
export type InsertTripParticipant = z.infer<typeof insertTripParticipantSchema>;

export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;
