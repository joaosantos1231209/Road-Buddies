import { 
  users, type User, type InsertUser,
  trips, type Trip, type InsertTrip,
  messages, type Message, type InsertMessage,
  matches, type Match, type InsertMatch,
  tripParticipants, type TripParticipant, type InsertTripParticipant,
  cities, type City, type InsertCity
} from "@shared/schema";
import { eq, and, or, ne, inArray } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseId(firebaseId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  
  // Trip methods
  getTrip(id: number): Promise<Trip | undefined>;
  getTrips(): Promise<Trip[]>;
  getTripsByUser(userId: number): Promise<Trip[]>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<Trip>): Promise<Trip>;
  deleteTrip(id: number): Promise<boolean>;
  
  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByUser(userId: number): Promise<Message[]>;
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<boolean>;
  
  // Match methods
  getMatch(id: number): Promise<Match | undefined>;
  getMatchesByTrip(tripId: number): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  deleteMatch(id: number): Promise<boolean>;
  
  // Matchmaking
  findMatchingTrips(tripId: number): Promise<Trip[]>;
  checkTripsMatch(tripId1: number, tripId2: number): Promise<boolean>; // Novo método para verificar compatibilidade
  
  // Trip Participants methods
  getTripParticipants(tripId: number): Promise<TripParticipant[]>;
  getUserTripsAsParticipant(userId: number): Promise<Trip[]>;
  addTripParticipant(participant: InsertTripParticipant): Promise<TripParticipant>;
  removeTripParticipant(tripId: number, userId: number): Promise<boolean>;
  isUserTripParticipant(tripId: number, userId: number): Promise<boolean>;
  findTripParticipant(tripId: number, userId: number): Promise<TripParticipant | undefined>;
  
  // City methods
  getCity(id: number): Promise<City | undefined>;
  getCities(): Promise<City[]>;
  createCity(city: InsertCity): Promise<City>;
  updateCity(id: number, city: Partial<City>): Promise<City>;
  deleteCity(id: number): Promise<boolean>;
  seedCities(): Promise<number>; // Returns the number of cities seeded
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private trips: Map<number, Trip>;
  private messages: Map<number, Message>;
  private matches: Map<number, Match>;
  private cities: Map<number, City>;
  
  private userId: number;
  private tripId: number;
  private messageId: number;
  private matchId: number;
  private cityId: number;

  constructor() {
    this.users = new Map();
    this.trips = new Map();
    this.messages = new Map();
    this.matches = new Map();
    this.cities = new Map();
    
    this.userId = 1;
    this.tripId = 1;
    this.messageId = 1;
    this.matchId = 1;
    this.cityId = 1;
    
    // Add some demo users
    this.seedDemoData();
  }
  
  private seedDemoData() {
    // Add demo user
    const demoUser: InsertUser = {
      username: "demo",
      password: "password",
      name: "Demo User",
      email: "demo@example.com",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    };
    this.createUser(demoUser);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseId === firebaseId,
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    // Make sure avatar and firebaseId are null if undefined
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      avatar: insertUser.avatar || null,
      firebaseId: insertUser.firebaseId || null
    };
    this.users.set(id, user);
    return user;
  }
  
  // Trip methods
  async getTrip(id: number): Promise<Trip | undefined> {
    return this.trips.get(id);
  }
  
  async getTrips(): Promise<Trip[]> {
    return Array.from(this.trips.values());
  }
  
  async getTripsByUser(userId: number): Promise<Trip[]> {
    return Array.from(this.trips.values()).filter(
      (trip) => trip.userId === userId
    );
  }
  
  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const id = this.tripId++;
    const now = new Date();
    // Make sure all optional fields are null if undefined
    const trip: Trip = { 
      ...insertTrip, 
      id, 
      createdAt: now,
      endDate: insertTrip.endDate || null,
      notes: insertTrip.notes || null,
      availableSeats: insertTrip.availableSeats || null,
      price: insertTrip.price || null,
      maxPrice: insertTrip.maxPrice || null
    };
    this.trips.set(id, trip);
    return trip;
  }
  
  async updateTrip(id: number, tripUpdate: Partial<Trip>): Promise<Trip> {
    const trip = this.trips.get(id);
    if (!trip) {
      throw new Error(`Trip with id ${id} not found`);
    }
    
    const updatedTrip = { ...trip, ...tripUpdate };
    this.trips.set(id, updatedTrip);
    return updatedTrip;
  }
  
  async deleteTrip(id: number): Promise<boolean> {
    return this.trips.delete(id);
  }
  
  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async getMessagesByUser(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.senderId === userId || message.receiverId === userId
    );
  }
  
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => 
        (message.senderId === userId1 && message.receiverId === userId2) ||
        (message.senderId === userId2 && message.receiverId === userId1)
    ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const now = new Date();
    // Make sure tripId is null if undefined
    const message: Message = { 
      ...insertMessage, 
      id, 
      read: false, 
      createdAt: now,
      tripId: insertMessage.tripId || null 
    };
    this.messages.set(id, message);
    return message;
  }
  
  async markMessageAsRead(id: number): Promise<boolean> {
    const message = this.messages.get(id);
    if (!message) {
      return false;
    }
    
    message.read = true;
    this.messages.set(id, message);
    return true;
  }
  
  // Match methods
  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }
  
  async getMatchesByTrip(tripId: number): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(
      (match) => match.tripId1 === tripId || match.tripId2 === tripId
    );
  }
  
  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.matchId++;
    const now = new Date();
    const match: Match = { ...insertMatch, id, createdAt: now };
    this.matches.set(id, match);
    return match;
  }
  
  async deleteMatch(id: number): Promise<boolean> {
    return this.matches.delete(id);
  }
  
  // Matchmaking algorithm
  async findMatchingTrips(tripId: number): Promise<Trip[]> {
    const sourceTrip = this.trips.get(tripId);
    if (!sourceTrip) {
      throw new Error(`Trip with id ${tripId} not found`);
    }
    
    const allTrips = Array.from(this.trips.values()).filter(trip => trip.id !== tripId);
    
    // Filter trips based on matching criteria:
    // 1. Origins and destinations are within acceptable radius
    // 2. Dates overlap
    // 3. Vehicle status is compatible
    const matchingTrips = allTrips.filter(trip => {
      // Check if dates overlap
      const datesMatch = this.datesOverlap(sourceTrip, trip);
      
      // Check if locations match (using a simplified check here)
      const locationsMatch = this.locationsMatch(sourceTrip, trip);
      
      // Check if vehicle status is compatible
      const statusesMatch = this.vehicleStatusesMatch(sourceTrip, trip);
      
      return datesMatch && locationsMatch && statusesMatch;
    });
    
    return matchingTrips;
  }
  
  async checkTripsMatch(tripId1: number, tripId2: number): Promise<boolean> {
    // Buscar as viagens pelo ID
    const trip1 = this.trips.get(tripId1);
    const trip2 = this.trips.get(tripId2);
    
    // Se alguma viagem não existir, retornar falso
    if (!trip1 || !trip2) {
      return false;
    }
    
    // Verificar se os status são compatíveis (NEEDRIDE com PROVIDER)
    const statusesMatch = this.vehicleStatusesMatch(trip1, trip2);
    
    if (!statusesMatch) {
      return false;
    }
    
    // Verificar se as datas são compatíveis
    const datesMatch = this.datesOverlap(trip1, trip2);
    
    if (!datesMatch) {
      return false;
    }
    
    // Verificar se os locais são compatíveis
    const locationsMatch = this.locationsMatch(trip1, trip2);
    
    // Retornar verdadeiro se todas as condições forem atendidas
    return statusesMatch && datesMatch && locationsMatch;
  }
  
  private datesOverlap(trip1: Trip, trip2: Trip): boolean {
    const trip1End = trip1.endDate || trip1.startDate;
    const trip2End = trip2.endDate || trip2.startDate;
    
    // Check if trip1 starts before trip2 ends AND trip2 starts before trip1 ends
    return trip1.startDate <= trip2End && trip2.startDate <= trip1End;
  }
  
  private locationsMatch(trip1: Trip, trip2: Trip): boolean {
    // In a real implementation, we would use a distance calculation based on lat/lng
    // This is simplified for the in-memory implementation
    
    // If origin of trip1 is close to origin of trip2 AND
    // destination of trip1 is close to destination of trip2
    const originNameMatches = trip1.originName.toLowerCase().includes(trip2.originName.toLowerCase()) || 
                              trip2.originName.toLowerCase().includes(trip1.originName.toLowerCase());
                              
    const destNameMatches = trip1.destinationName.toLowerCase().includes(trip2.destinationName.toLowerCase()) || 
                            trip2.destinationName.toLowerCase().includes(trip1.destinationName.toLowerCase());
    
    return originNameMatches && destNameMatches;
  }
  
  private vehicleStatusesMatch(trip1: Trip, trip2: Trip): boolean {
    // PROVIDER (definitely providing) can match with NEEDRIDE (need a ride)
    // NEEDRIDE (need a ride) can match with PROVIDER
    
    // PROVIDER and NEEDRIDE can match (ride provider and someone needing a ride)
    if (trip1.status === "PROVIDER" && trip2.status === "NEEDRIDE") return true;
    if (trip1.status === "NEEDRIDE" && trip2.status === "PROVIDER") return true;
    
    // FLEXIBLE status temporarily removed
    /* 
    // FLEXIBLE and NEEDRIDE can match (flexible provider and someone needing a ride)
    if (trip1.status === "FLEXIBLE" && trip2.status === "NEEDRIDE") return true;
    if (trip1.status === "NEEDRIDE" && trip2.status === "FLEXIBLE") return true;
    
    // FLEXIBLE and FLEXIBLE can match (two flexible providers can coordinate)
    if (trip1.status === "FLEXIBLE" && trip2.status === "FLEXIBLE") return true;
    
    // NEW: PROVIDER and FLEXIBLE can match (provider and flexible user)
    if (trip1.status === "PROVIDER" && trip2.status === "FLEXIBLE") return true;
    if (trip1.status === "FLEXIBLE" && trip2.status === "PROVIDER") return true;
    */
    
    return false;
  }
  
  // Trip Participants methods
  async getTripParticipants(tripId: number): Promise<TripParticipant[]> {
    // In the in-memory implementation, we don't have a separate collection for participants
    // So we'll just return an empty array
    return [];
  }
  
  async getUserTripsAsParticipant(userId: number): Promise<Trip[]> {
    // In the in-memory implementation, we don't have a separate collection for participants
    // So we'll just return an empty array
    return [];
  }
  
  async addTripParticipant(participant: InsertTripParticipant): Promise<TripParticipant> {
    // Mock implementation
    return {
      id: 1,
      tripId: participant.tripId,
      userId: participant.userId,
      status: "JOINED",
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  async removeTripParticipant(tripId: number, userId: number): Promise<boolean> {
    // Mock implementation
    return true;
  }
  
  async isUserTripParticipant(tripId: number, userId: number): Promise<boolean> {
    // Mock implementation
    return false;
  }
  
  async findTripParticipant(tripId: number, userId: number): Promise<TripParticipant | undefined> {
    // Mock implementation for in-memory storage
    return {
      id: 1,
      tripId,
      userId,
      status: "JOINED",
      userNeedRideTripId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // City methods
  async getCity(id: number): Promise<City | undefined> {
    return this.cities.get(id);
  }

  async getCities(): Promise<City[]> {
    return Array.from(this.cities.values());
  }

  async createCity(insertCity: InsertCity): Promise<City> {
    const id = this.cityId++;
    const now = new Date();
    const city: City = { 
      ...insertCity, 
      id, 
      createdAt: now,
      updatedAt: now,
      isActive: insertCity.isActive ?? true
    };
    this.cities.set(id, city);
    return city;
  }

  async updateCity(id: number, cityUpdate: Partial<City>): Promise<City> {
    const city = this.cities.get(id);
    if (!city) {
      throw new Error(`City with id ${id} not found`);
    }
    
    const updatedCity = { 
      ...city, 
      ...cityUpdate,
      updatedAt: new Date()
    };
    this.cities.set(id, updatedCity);
    return updatedCity;
  }

  async deleteCity(id: number): Promise<boolean> {
    return this.cities.delete(id);
  }

  async seedCities(): Promise<number> {
    // List of major Portugal cities
    const portugalCities = [
      { name: "Lisboa", lat: "38.7223", lng: "-9.1393", isActive: true },
      { name: "Porto", lat: "41.1579", lng: "-8.6291", isActive: true },
      { name: "Braga", lat: "41.5454", lng: "-8.4265", isActive: true },
      { name: "Coimbra", lat: "40.2033", lng: "-8.4103", isActive: true },
      { name: "Faro", lat: "37.0193", lng: "-7.9304", isActive: true },
      { name: "Aveiro", lat: "40.6405", lng: "-8.6538", isActive: true },
      { name: "Évora", lat: "38.5740", lng: "-7.9104", isActive: true },
      { name: "Setúbal", lat: "38.5244", lng: "-8.8936", isActive: true },
      { name: "Viseu", lat: "40.6566", lng: "-7.9143", isActive: true },
      { name: "Viana do Castelo", lat: "41.6918", lng: "-8.8344", isActive: true },
      { name: "Bragança", lat: "41.8072", lng: "-6.7596", isActive: true },
      { name: "Vila Real", lat: "41.3010", lng: "-7.7422", isActive: true },
      { name: "Guarda", lat: "40.5364", lng: "-7.2683", isActive: true },
      { name: "Castelo Branco", lat: "39.8231", lng: "-7.4931", isActive: true },
      { name: "Leiria", lat: "39.7444", lng: "-8.8072", isActive: true },
      { name: "Santarém", lat: "39.2369", lng: "-8.6850", isActive: true },
      { name: "Beja", lat: "38.0156", lng: "-7.8645", isActive: true },
      { name: "Portalegre", lat: "39.2969", lng: "-7.4305", isActive: true }
    ];
    
    // Check if we already have cities
    if (this.cities.size > 0) {
      return this.cities.size;
    }
    
    // Insert all cities
    for (const cityData of portugalCities) {
      await this.createCity(cityData);
    }
    
    return portugalCities.length;
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseId, firebaseId));
    return user || undefined;
  }
  
  async getAllUsers(): Promise<User[]> {
    const usersList = await db.select().from(users);
    return usersList;
  }
  
  async updateUser(id: number, userUpdate: Partial<User>): Promise<User> {
    // Ensure all optional fields are null if undefined
    const updateData = {
      ...userUpdate,
      avatar: userUpdate.avatar ?? undefined,
      phone: userUpdate.phone ?? undefined,
      location: userUpdate.location ?? undefined,
      about: userUpdate.about ?? undefined,
      vehicle: userUpdate.vehicle ?? undefined,
      vehicleSeats: userUpdate.vehicleSeats ?? undefined,
      departureTime: userUpdate.departureTime ?? undefined,
      returnTime: userUpdate.returnTime ?? undefined,
      travelPreferences: userUpdate.travelPreferences ?? undefined,
      travelRules: userUpdate.travelRules ?? undefined
    };
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return updatedUser;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Make sure all optional fields are null if undefined
    const userToInsert = {
      ...insertUser,
      avatar: insertUser.avatar || null,
      firebaseId: insertUser.firebaseId || null,
      phone: insertUser.phone || null,
      location: insertUser.location || null,
      about: insertUser.about || null,
      vehicle: insertUser.vehicle || null,
      vehicleSeats: insertUser.vehicleSeats || null,
      departureTime: insertUser.departureTime || null,
      returnTime: insertUser.returnTime || null,
      travelPreferences: insertUser.travelPreferences || null,
      travelRules: insertUser.travelRules || null
    };
    
    const [user] = await db
      .insert(users)
      .values(userToInsert)
      .returning();
    return user;
  }
  
  // Trip methods
  async getTrip(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip || undefined;
  }
  
  async getTrips(): Promise<Trip[]> {
    // Only return non-hidden trips by default
    return db.select().from(trips).where(eq(trips.hidden, false));
  }
  
  async getTripsByUser(userId: number): Promise<Trip[]> {
    // Only return non-hidden trips by default
    return db
      .select()
      .from(trips)
      .where(
        and(
          eq(trips.userId, userId),
          eq(trips.hidden, false)
        )
      );
  }
  
  // Get all trips by user including hidden ones (for administrative purposes)
  async getAllTripsByUser(userId: number): Promise<Trip[]> {
    return db.select().from(trips).where(eq(trips.userId, userId));
  }
  
  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    // Make sure all optional fields are null if undefined
    const tripToInsert = {
      ...insertTrip,
      endDate: insertTrip.endDate || null,
      notes: insertTrip.notes || null,
      availableSeats: insertTrip.availableSeats || null,
      price: insertTrip.price || null,
      maxPrice: insertTrip.maxPrice || null
    };
    
    const [trip] = await db
      .insert(trips)
      .values(tripToInsert)
      .returning();
    return trip;
  }
  
  async updateTrip(id: number, tripUpdate: Partial<Trip>): Promise<Trip> {
    // Create a clean version of the update with properly formatted dates
    const cleanUpdate: Partial<Trip> = {};
    
    // Copy all regular properties
    Object.keys(tripUpdate).forEach(key => {
      if (key !== 'startDate' && key !== 'endDate') {
        // @ts-ignore - dynamically setting properties
        cleanUpdate[key] = tripUpdate[key];
      }
    });
    
    // Handle dates specifically to ensure they're proper Date objects
    if (tripUpdate.startDate !== undefined) {
      try {
        cleanUpdate.startDate = tripUpdate.startDate instanceof Date 
          ? tripUpdate.startDate 
          : new Date(tripUpdate.startDate);
      } catch (e) {
        console.error("Invalid startDate format:", tripUpdate.startDate);
        throw new Error(`Invalid startDate format: ${tripUpdate.startDate}`);
      }
    }
    
    if (tripUpdate.endDate !== undefined) {
      try {
        // Only set if it's not null (allow clearing endDate)
        if (tripUpdate.endDate !== null) {
          cleanUpdate.endDate = tripUpdate.endDate instanceof Date 
            ? tripUpdate.endDate 
            : new Date(tripUpdate.endDate);
        } else {
          cleanUpdate.endDate = null;
        }
      } catch (e) {
        console.error("Invalid endDate format:", tripUpdate.endDate);
        throw new Error(`Invalid endDate format: ${tripUpdate.endDate}`);
      }
    }
    
    console.log("Clean update for trip:", id, JSON.stringify(cleanUpdate));
    
    // Check for any remaining dates that might not be proper Date objects
    if (cleanUpdate.startDate && typeof cleanUpdate.startDate.getTime !== 'function') {
      console.error("StartDate is still not a proper Date object after conversion attempts");
      throw new Error("Failed to process startDate into a valid Date object");
    }
    
    if (cleanUpdate.endDate && cleanUpdate.endDate !== null && 
        typeof cleanUpdate.endDate.getTime !== 'function') {
      console.error("EndDate is still not a proper Date object after conversion attempts");
      throw new Error("Failed to process endDate into a valid Date object");
    }
    
    const [updatedTrip] = await db
      .update(trips)
      .set(cleanUpdate)
      .where(eq(trips.id, id))
      .returning();
      
    if (!updatedTrip) {
      throw new Error(`Trip with id ${id} not found`);
    }
    
    return updatedTrip;
  }
  
  async deleteTrip(id: number): Promise<boolean> {
    try {
      // Get the trip before we delete it to know its details
      const tripToDelete = await this.getTrip(id);
      if (!tripToDelete) {
        return false;
      }
      
      // Get all participants before we delete them
      const participants = await this.getTripParticipants(id);
      
      // First, remove all participants associated with this trip
      await db
        .delete(tripParticipants)
        .where(eq(tripParticipants.tripId, id));
      
      // Then delete matches related to this trip
      await db
        .delete(matches)
        .where(
          or(
            eq(matches.tripId1, id),
            eq(matches.tripId2, id)
          )
        );
      
      // For each participant, restore any hidden trips they might have
      // that match the trip being deleted
      console.log(`Trip ${id} is being deleted, checking if we need to restore hidden trips for ${participants.length} participants`);
      
      for (const participant of participants) {
        console.log(`Finding hidden trips to restore for user ${participant.userId} due to trip ${id} deletion`);
        
        // Get all hidden trips by this user
        const hiddenTrips = await db
          .select()
          .from(trips)
          .where(
            and(
              eq(trips.userId, participant.userId),
              eq(trips.hidden, true)
            )
          );
        
        console.log(`Found ${hiddenTrips.length} hidden trips to potentially restore for user ${participant.userId}`);
        
        // For each hidden trip, check if it matches the trip being deleted
        for (const hiddenTrip of hiddenTrips) {
          console.log(`Checking if hidden trip ${hiddenTrip.id} (${hiddenTrip.originName} to ${hiddenTrip.destinationName}) should be restored`);
          
          // Check if trip locations match (in either direction)
          if (this.locationsMatch(tripToDelete, hiddenTrip)) {
            console.log(`Locations match! Restoring user trip ${hiddenTrip.id}`);
            // Unhide the user's trip
            await this.updateTrip(hiddenTrip.id, { hidden: false });
            console.log(`Trip ${hiddenTrip.id} is now visible because trip ${id} was deleted`);
          } else {
            console.log(`Locations don't match, keeping trip ${hiddenTrip.id} hidden`);
          }
        }
      }
      
      // Finally, delete the trip itself
      const result = await db
        .delete(trips)
        .where(eq(trips.id, id))
        .returning();
        
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting trip:", error);
      return false;
    }
  }
  
  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }
  
  async getMessagesByUser(userId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      );
  }
  
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId1),
            eq(messages.receiverId, userId2)
          ),
          and(
            eq(messages.senderId, userId2),
            eq(messages.receiverId, userId1)
          )
        )
      )
      .orderBy(messages.createdAt);
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    // Make sure tripId is null if undefined
    const messageToInsert = {
      ...insertMessage,
      tripId: insertMessage.tripId || null,
      read: false
    };
    
    const [message] = await db
      .insert(messages)
      .values(messageToInsert)
      .returning();
    return message;
  }
  
  async markMessageAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, id))
      .returning();
    return result.length > 0;
  }
  
  // Match methods
  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match || undefined;
  }
  
  async getMatchesByTrip(tripId: number): Promise<Match[]> {
    return db
      .select()
      .from(matches)
      .where(
        or(
          eq(matches.tripId1, tripId),
          eq(matches.tripId2, tripId)
        )
      );
  }
  
  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values(insertMatch)
      .returning();
    return match;
  }
  
  async deleteMatch(id: number): Promise<boolean> {
    const result = await db
      .delete(matches)
      .where(eq(matches.id, id))
      .returning();
    return result.length > 0;
  }
  
  // Matchmaking
  async findMatchingTrips(tripId: number): Promise<Trip[]> {
    const sourceTrip = await this.getTrip(tripId);
    if (!sourceTrip) {
      throw new Error(`Trip with id ${tripId} not found`);
    }
    
    console.log(`Finding matches for Trip ${tripId}: ${sourceTrip.originName} to ${sourceTrip.destinationName}, status=${sourceTrip.status}, date=${sourceTrip.startDate}`);
    
    // Get all trips except the source and exclude hidden trips
    const allTrips = await db
      .select()
      .from(trips)
      .where(
        and(
          ne(trips.id, tripId),
          eq(trips.hidden, false)
        )
      );
      
    console.log(`Found ${allTrips.length} other trips to check for matching`);
    
    // Filter for compatible trips
    // This is a simplified version and would be more efficient with a database query
    // but I'm keeping the logic in JS for now for clarity
    const matchingTrips = allTrips.filter(trip => {
      console.log(`\nChecking Trip ${trip.id}: ${trip.originName} to ${trip.destinationName}, status=${trip.status}, date=${trip.startDate}`);
      
      const datesMatch = this.datesOverlap(sourceTrip, trip);
      const locationsMatch = this.locationsMatch(sourceTrip, trip);
      const statusesMatch = this.vehicleStatusesMatch(sourceTrip, trip);
      
      console.log(`  Dates Match: ${datesMatch}`);
      console.log(`  Locations Match: ${locationsMatch}`);
      console.log(`  Statuses Match: ${statusesMatch}`);
      
      return datesMatch && locationsMatch && statusesMatch;
    });
    
    console.log(`Found ${matchingTrips.length} matching trips for Trip ${tripId}`);
    return matchingTrips;
  }
  
  async checkTripsMatch(tripId1: number, tripId2: number): Promise<boolean> {
    // Buscar as viagens pelo ID
    const trip1 = await this.getTrip(tripId1);
    const trip2 = await this.getTrip(tripId2);
    
    // Se alguma viagem não existir, retornar falso
    if (!trip1 || !trip2) {
      return false;
    }
    
    console.log(`Checking match between Trip ${tripId1} and Trip ${tripId2}:`);
    console.log(`  Trip1: ${trip1.originName} to ${trip1.destinationName}, status=${trip1.status}`);
    console.log(`  Trip2: ${trip2.originName} to ${trip2.destinationName}, status=${trip2.status}`);
    
    // Verificar se os status são compatíveis (NEEDRIDE com PROVIDER)
    const statusesMatch = this.vehicleStatusesMatch(trip1, trip2);
    console.log(`  Statuses Match: ${statusesMatch}`);
    
    if (!statusesMatch) {
      return false;
    }
    
    // Verificar se as datas são compatíveis
    const datesMatch = this.datesOverlap(trip1, trip2);
    console.log(`  Dates Match: ${datesMatch}`);
    
    if (!datesMatch) {
      return false;
    }
    
    // Verificar se os locais são compatíveis
    const locationsMatch = this.locationsMatch(trip1, trip2);
    console.log(`  Locations Match: ${locationsMatch}`);
    
    // Retornar verdadeiro se todas as condições forem atendidas
    return statusesMatch && datesMatch && locationsMatch;
  }
  
  // Trip Participants methods
  async getTripParticipants(tripId: number): Promise<TripParticipant[]> {
    return db
      .select()
      .from(tripParticipants)
      .where(eq(tripParticipants.tripId, tripId));
  }
  
  async getUserTripsAsParticipant(userId: number): Promise<Trip[]> {
    // First get all trip IDs where user is a participant
    const userParticipations = await db
      .select()
      .from(tripParticipants)
      .where(eq(tripParticipants.userId, userId));
      
    // Then get all trips based on those IDs
    const tripIds = userParticipations.map(p => p.tripId);
    
    if (tripIds.length === 0) {
      return [];
    }
    
    // Use the inArray operator to directly query trips
    console.log(`Finding trips where user ${userId} is a participant: TripIDs: ${tripIds.join(', ')}`);
    
    const participatingTrips = await db
      .select()
      .from(trips)
      .where(inArray(trips.id, tripIds));
      
    console.log(`Found ${participatingTrips.length} trips where user ${userId} is participating`);
    return participatingTrips;
  }
  
  async addTripParticipant(participant: InsertTripParticipant): Promise<TripParticipant> {
    // First check if the user is already a participant
    const existingParticipation = await db
      .select()
      .from(tripParticipants)
      .where(
        and(
          eq(tripParticipants.tripId, participant.tripId),
          eq(tripParticipants.userId, participant.userId)
        )
      );
      
    if (existingParticipation.length > 0) {
      // User is already a participant, return the existing record
      return existingParticipation[0];
    }
    
    // Add the participant
    const [tripParticipant] = await db
      .insert(tripParticipants)
      .values({
        ...participant,
        status: "JOINED",
        userNeedRideTripId: participant.userNeedRideTripId || null
      })
      .returning();
      
    // If this trip has a driver (PROVIDER or FLEXIBLE) and seats, we need to update available seats
    const trip = await this.getTrip(participant.tripId);
    if (trip && 
        (trip.status === "PROVIDER" || trip.status === "FLEXIBLE") && 
        trip.availableSeats !== null && 
        trip.availableSeats > 0) {
      // Reduce available seats by 1
      await this.updateTrip(trip.id, {
        availableSeats: trip.availableSeats - 1
      });
    }
    
    // If user has their own trips with the same origin/destination, hide them
    // First get the user's trips with NEEDRIDE status (trips looking for a ride)
    console.log(`Finding trips to hide for user ${participant.userId} who joined trip ${participant.tripId}`);
    
    const userTrips = await db
      .select()
      .from(trips)
      .where(
        and(
          eq(trips.userId, participant.userId),
          eq(trips.hidden, false),
          eq(trips.status, "NEEDRIDE")
        )
      );
    
    console.log(`Found ${userTrips.length} candidate trips to potentially hide`);
    
    // If the joined trip is between the same locations as any of the user's trips,
    // hide the user's trips as they're now participating in a matching trip
    if (trip) {
      console.log(`Joined trip details: ${trip.originName} to ${trip.destinationName} (ID: ${trip.id})`);
      
      for (const userTrip of userTrips) {
        console.log(`Checking if user trip ${userTrip.id} (${userTrip.originName} to ${userTrip.destinationName}) should be hidden`);
        
        // Check if trip locations match (in either direction)
        if (this.locationsMatch(trip, userTrip)) {
          console.log(`Locations match! Hiding user trip ${userTrip.id}`);
          // Hide the user's trip
          await this.updateTrip(userTrip.id, { hidden: true });
          console.log(`Trip ${userTrip.id} is now hidden because user ${participant.userId} joined trip ${participant.tripId}`);
        } else {
          console.log(`Locations don't match, keeping trip ${userTrip.id} visible`);
        }
      }
    }
    
    return tripParticipant;
  }
  
  async removeTripParticipant(tripId: number, userId: number): Promise<boolean> {
    // Check if the participant exists
    const existingParticipation = await db
      .select()
      .from(tripParticipants)
      .where(
        and(
          eq(tripParticipants.tripId, tripId),
          eq(tripParticipants.userId, userId)
        )
      );
      
    if (existingParticipation.length === 0) {
      // User is not a participant
      return false;
    }
    
    // First get the trip the user is leaving
    const trip = await this.getTrip(tripId);
    
    // Remove the participant
    const result = await db
      .delete(tripParticipants)
      .where(
        and(
          eq(tripParticipants.tripId, tripId),
          eq(tripParticipants.userId, userId)
        )
      )
      .returning();
      
    // If this trip has a driver (PROVIDER or FLEXIBLE) and seats, we need to update available seats
    if (trip && 
        (trip.status === "PROVIDER" || trip.status === "FLEXIBLE") && 
        trip.availableSeats !== null) {
      // Increase available seats by 1
      await this.updateTrip(trip.id, {
        availableSeats: trip.availableSeats + 1
      });
    }
    
    // Restore any hidden trips the user might have
    if (trip) {
      console.log(`Finding hidden trips to restore for user ${userId} who left trip ${tripId}`);
      
      // Get all hidden trips by this user
      const hiddenTrips = await db
        .select()
        .from(trips)
        .where(
          and(
            eq(trips.userId, userId),
            eq(trips.hidden, true)
          )
        );
      
      console.log(`Found ${hiddenTrips.length} hidden trips to potentially restore`);
      
      // For each hidden trip, check if it matches the trip they're leaving
      for (const hiddenTrip of hiddenTrips) {
        console.log(`Checking if hidden trip ${hiddenTrip.id} (${hiddenTrip.originName} to ${hiddenTrip.destinationName}) should be restored`);
        
        // Check if trip locations match (in either direction)
        if (this.locationsMatch(trip, hiddenTrip)) {
          console.log(`Locations match! Restoring user trip ${hiddenTrip.id}`);
          // Unhide the user's trip
          await this.updateTrip(hiddenTrip.id, { hidden: false });
          console.log(`Trip ${hiddenTrip.id} is now visible because user ${userId} left trip ${tripId}`);
        } else {
          console.log(`Locations don't match, keeping trip ${hiddenTrip.id} hidden`);
        }
      }
    }
    
    return result.length > 0;
  }
  
  async isUserTripParticipant(tripId: number, userId: number): Promise<boolean> {
    const participants = await db
      .select()
      .from(tripParticipants)
      .where(
        and(
          eq(tripParticipants.tripId, tripId),
          eq(tripParticipants.userId, userId)
        )
      );
      
    return participants.length > 0;
  }
  
  async findTripParticipant(tripId: number, userId: number): Promise<TripParticipant | undefined> {
    const [participant] = await db
      .select()
      .from(tripParticipants)
      .where(
        and(
          eq(tripParticipants.tripId, tripId),
          eq(tripParticipants.userId, userId)
        )
      );
      
    return participant || undefined;
  }
  
  private datesOverlap(trip1: Trip, trip2: Trip): boolean {
    // Helper function to compare just dates (ignoring time)
    const isSameDay = (date1: string | Date, date2: string | Date) => {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
    };
    
    // Handle fallback for end dates
    const trip1End = trip1.endDate || trip1.startDate;
    const trip2End = trip2.endDate || trip2.startDate;
    
    // Check for same day (common case for day trips)
    if (isSameDay(trip1.startDate, trip2.startDate)) {
      console.log('  Trips are on the same day!');
      return true;
    }
    
    // For multi-day trips, check for date range overlap
    const overlap = new Date(trip1.startDate) <= new Date(trip2End) && 
                    new Date(trip2.startDate) <= new Date(trip1End);
    
    if (!overlap) {
      console.log(`  Date comparison: trip1.startDate=${new Date(trip1.startDate).toISOString()} <= trip2End=${new Date(trip2End).toISOString()}: ${new Date(trip1.startDate) <= new Date(trip2End)}`);
      console.log(`  Date comparison: trip2.startDate=${new Date(trip2.startDate).toISOString()} <= trip1End=${new Date(trip1End).toISOString()}: ${new Date(trip2.startDate) <= new Date(trip1End)}`);
    }
    
    return overlap;
  }
  
  private locationsMatch(trip1: Trip, trip2: Trip): boolean {
    // This is simplified - would use geographic distance in a real app
    const originNameMatches = trip1.originName.toLowerCase().includes(trip2.originName.toLowerCase()) || 
                            trip2.originName.toLowerCase().includes(trip1.originName.toLowerCase());
                            
    const destNameMatches = trip1.destinationName.toLowerCase().includes(trip2.destinationName.toLowerCase()) || 
                          trip2.destinationName.toLowerCase().includes(trip1.destinationName.toLowerCase());
    
    // Check if the trips connect the same cities (must be in the same direction)
    const sameLocations = originNameMatches && destNameMatches;
    
    console.log(`Location matching for Trip ${trip1.id} and Trip ${trip2.id}:`);
    console.log(`  Trip1: ${trip1.originName} to ${trip1.destinationName}`);
    console.log(`  Trip2: ${trip2.originName} to ${trip2.destinationName}`);
    console.log(`  Origin matches: ${originNameMatches}`);
    console.log(`  Destination matches: ${destNameMatches}`);
    console.log(`  Same cities (same direction only): ${sameLocations}`);
    
    return sameLocations;
  }
  
  private vehicleStatusesMatch(trip1: Trip, trip2: Trip): boolean {
    // PROVIDER and NEEDRIDE can match (ride provider and someone needing a ride)
    if (trip1.status === "PROVIDER" && trip2.status === "NEEDRIDE") return true;
    if (trip1.status === "NEEDRIDE" && trip2.status === "PROVIDER") return true;
    
    // FLEXIBLE status temporarily removed
    /* 
    // FLEXIBLE and NEEDRIDE can match (flexible provider and someone needing a ride)
    if (trip1.status === "FLEXIBLE" && trip2.status === "NEEDRIDE") return true;
    if (trip1.status === "NEEDRIDE" && trip2.status === "FLEXIBLE") return true;
    
    // FLEXIBLE and FLEXIBLE can match (two flexible providers can coordinate)
    if (trip1.status === "FLEXIBLE" && trip2.status === "FLEXIBLE") return true;
    
    // NEW: PROVIDER and FLEXIBLE can match (provider and flexible user)
    if (trip1.status === "PROVIDER" && trip2.status === "FLEXIBLE") return true;
    if (trip1.status === "FLEXIBLE" && trip2.status === "PROVIDER") return true;
    */
    
    return false;
  }

  // City methods
  async getCity(id: number): Promise<City | undefined> {
    const [city] = await db.select().from(cities).where(eq(cities.id, id));
    return city || undefined;
  }

  async getCities(): Promise<City[]> {
    return db.select().from(cities).orderBy(cities.name);
  }

  async createCity(city: InsertCity): Promise<City> {
    const [newCity] = await db.insert(cities).values(city).returning();
    return newCity;
  }

  async updateCity(id: number, cityUpdate: Partial<City>): Promise<City> {
    const [updatedCity] = await db
      .update(cities)
      .set(cityUpdate)
      .where(eq(cities.id, id))
      .returning();
    
    if (!updatedCity) {
      throw new Error(`City with id ${id} not found`);
    }
    
    return updatedCity;
  }

  async deleteCity(id: number): Promise<boolean> {
    const result = await db
      .delete(cities)
      .where(eq(cities.id, id))
      .returning();
    
    return result.length > 0;
  }

  async seedCities(): Promise<number> {
    // List of major Portugal cities
    const portugalCities = [
      { name: "Lisboa", lat: "38.7223", lng: "-9.1393", isActive: true },
      { name: "Porto", lat: "41.1579", lng: "-8.6291", isActive: true },
      { name: "Braga", lat: "41.5454", lng: "-8.4265", isActive: true },
      { name: "Coimbra", lat: "40.2033", lng: "-8.4103", isActive: true },
      { name: "Faro", lat: "37.0193", lng: "-7.9304", isActive: true },
      { name: "Aveiro", lat: "40.6405", lng: "-8.6538", isActive: true },
      { name: "Évora", lat: "38.5740", lng: "-7.9104", isActive: true },
      { name: "Setúbal", lat: "38.5244", lng: "-8.8936", isActive: true },
      { name: "Viseu", lat: "40.6566", lng: "-7.9143", isActive: true },
      { name: "Viana do Castelo", lat: "41.6918", lng: "-8.8344", isActive: true },
      { name: "Bragança", lat: "41.8072", lng: "-6.7596", isActive: true },
      { name: "Vila Real", lat: "41.3010", lng: "-7.7422", isActive: true },
      { name: "Guarda", lat: "40.5364", lng: "-7.2683", isActive: true },
      { name: "Castelo Branco", lat: "39.8231", lng: "-7.4931", isActive: true },
      { name: "Leiria", lat: "39.7444", lng: "-8.8072", isActive: true },
      { name: "Santarém", lat: "39.2369", lng: "-8.6850", isActive: true },
      { name: "Beja", lat: "38.0156", lng: "-7.8645", isActive: true },
      { name: "Portalegre", lat: "39.2969", lng: "-7.4305", isActive: true }
    ];
    
    // Check if we already have cities
    const existingCities = await this.getCities();
    
    // If we have cities, don't seed again
    if (existingCities.length > 0) {
      return existingCities.length;
    }
    
    // Insert all cities
    const result = await db.insert(cities).values(portugalCities).returning();
    
    return result.length;
  }
}

// Use Database storage in production, Memory storage for development if needed
export const storage = new DatabaseStorage();
