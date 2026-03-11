import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTripSchema, 
  insertMessageSchema, 
  insertUserSchema, 
  insertTripParticipantSchema,
  insertCitySchema
} from "@shared/schema";
import { format } from 'date-fns';
import { 
  sendTripCancellationEmail, 
  sendVerificationEmail,
  generateVerificationToken
} from './utils/email';
import { z } from "zod";

// Extend the Express Request type to include validatedBody
declare global {
  namespace Express {
    interface Request {
      validatedBody: any;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function to validate request body with Zod schema
  function validateBody<T>(schema: z.ZodType<any, any, any>) {
    return (req: any, res: any, next: any) => {
      try {
        req.validatedBody = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Validation error", 
            errors: error.errors 
          });
        }
        next(error);
      }
    };
  }

  // User routes
  app.post("/api/auth/register", validateBody(insertUserSchema), async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.validatedBody.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(req.validatedBody);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user with new data
      const updatedUser = await storage.updateUser(userId, req.body);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  app.get("/api/users/by-firebase-id/:firebaseId", async (req, res) => {
    try {
      const firebaseId = req.params.firebaseId;
      if (!firebaseId) {
        return res.status(400).json({ message: "Firebase ID is required" });
      }
      
      const user = await storage.getUserByFirebaseId(firebaseId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user by Firebase ID:", error);
      res.status(500).json({ message: "Failed to get user by Firebase ID" });
    }
  });
  
  // Email verification routes
  app.get("/api/auth/verify", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }
      
      // Find user with this verification token
      const users = await storage.getAllUsers();
      const user = users.find(u => u.verificationToken === token);
      
      if (!user) {
        return res.status(404).json({ message: "Invalid verification token" });
      }
      
      // Check if token has expired
      if (user.verificationTokenExpiry && new Date(user.verificationTokenExpiry) < new Date()) {
        return res.status(400).json({ message: "Verification token has expired" });
      }
      
      // Mark user as verified
      const updatedUser = await storage.updateUser(user.id, {
        isEmailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      });
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ 
        message: "Email verified successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });
  
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user with this email
      const users = await storage.getAllUsers();
      const user = users.find(u => u.email === email);
      
      if (!user) {
        // Don't leak information about whether the email exists
        return res.status(200).json({ message: "If the account exists, a verification email has been sent" });
      }
      
      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Update user with new token
      await storage.updateUser(user.id, {
        verificationToken,
        verificationTokenExpiry
      });
      
      // Send verification email
      const verificationUrl = `${req.protocol}://${req.get('host')}/email-verification`;
      await sendVerificationEmail({
        recipientEmail: user.email,
        recipientName: user.name,
        verificationToken,
        verificationUrl: `${verificationUrl}?token=${verificationToken}&email=${encodeURIComponent(user.email)}`
      });
      
      res.json({ message: "Verification email sent successfully" });
    } catch (error) {
      console.error("Error resending verification email:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  // Firebase user synchronization
  app.post("/api/users/sync", async (req, res) => {
    try {
      const { firebaseId, email, username, firebaseDisplayName, avatar } = req.body;
      
      if (!firebaseId || !email) {
        return res.status(400).json({ message: "Firebase ID and email are required" });
      }
      
      // Check if user with this Firebase ID exists
      let user = await storage.getUserByFirebaseId(firebaseId);
      let isNewUser = false;
      
      if (user) {
        // Update existing user - only update essential auth fields
        // IMPORTANT: We don't update the name here to prevent overwriting profile changes
        user = await storage.updateUser(user.id, {
          email,
          // Don't update username or name on login - only update these in profile page
          avatar: avatar || user.avatar, // Only update avatar if it doesn't exist already
          firebaseId
        });
      } else {
        // Create new user with a generated username based on email if none provided
        const generatedUsername = username || email.split('@')[0];
        // Use firebaseDisplayName as fallback for new users
        const generatedName = firebaseDisplayName || username || email.split('@')[0];
        
        // Check if username already exists
        const existingUserWithUsername = await storage.getUserByUsername(generatedUsername);
        const finalUsername = existingUserWithUsername 
          ? `${generatedUsername}${Math.floor(Math.random() * 10000)}` // Add random number if username taken
          : generatedUsername;
        
        // Generate verification token and expiry
        const verificationToken = generateVerificationToken();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        user = await storage.createUser({
          email,
          username: finalUsername,
          name: generatedName,
          avatar,
          firebaseId,
          isEmailVerified: false,
          verificationToken,
          verificationTokenExpiry,
          password: Math.random().toString(36).slice(2, 15) // Random password for Firebase users
        });
        
        isNewUser = true;
        
        // Send verification email
        const verificationUrl = `${req.protocol}://${req.get('host')}/email-verification`;
        await sendVerificationEmail({
          recipientEmail: email,
          recipientName: generatedName,
          verificationToken,
          verificationUrl: `${verificationUrl}?token=${verificationToken}&email=${encodeURIComponent(email)}`
        });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      // Include a flag indicating whether email verification is required
      res.status(200).json({
        ...userWithoutPassword,
        isNewUser,
        requiresEmailVerification: isNewUser || !user.isEmailVerified
      });
    } catch (error) {
      console.error("Error syncing user:", error);
      res.status(500).json({ message: "Failed to sync user with Firebase" });
    }
  });

  // Trip routes
  app.get("/api/trips", async (req, res) => {
    try {
      const trips = await storage.getTrips();
      res.json(trips);
    } catch (error) {
      console.error("Error getting trips:", error);
      res.status(500).json({ message: "Failed to get trips" });
    }
  });
  
  app.get("/api/users/:userId/trips", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const trips = await storage.getTripsByUser(userId);
      res.json(trips);
    } catch (error) {
      console.error("Error getting user trips:", error);
      res.status(500).json({ message: "Failed to get user trips" });
    }
  });
  
  // Existing endpoint at line ~284 already handles this functionality


  app.get("/api/trips/:id", async (req, res) => {
    try {
      const trip = await storage.getTrip(parseInt(req.params.id));
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      res.json(trip);
    } catch (error) {
      res.status(500).json({ message: "Failed to get trip" });
    }
  });



  app.post("/api/trips", validateBody(insertTripSchema), async (req, res) => {
    try {
      const newTrip = await storage.createTrip(req.validatedBody);
      
      // Verificar se existem viagens compatíveis e enviar e-mails de notificação
      try {
        // Quando a viagem criada for do tipo PROVIDER, verificar se há viagens NEEDRIDE que combinam com ela
        if (newTrip.status === "PROVIDER") {
          // Precisamos buscar todas as viagens NEEDRIDE e verificar quais combinam com a nova viagem PROVIDER
          // Não podemos usar diretamente findMatchingTrips porque ele busca matches para a viagem especificada
          // Então precisamos pegar todas as viagens NEEDRIDE e verificar individualmente
          const allTrips = await storage.getTrips();
          const needRideTrips = allTrips.filter(trip => 
            trip.status === "NEEDRIDE" && !trip.hidden && trip.id !== newTrip.id
          );
          
          console.log(`Checking ${needRideTrips.length} NEEDRIDE trips for compatibility with new PROVIDER trip ${newTrip.id} (${newTrip.originName} to ${newTrip.destinationName})`);
          
          // Para cada viagem NEEDRIDE, verificar se há compatibilidade com a nova viagem PROVIDER
          for (const needRideTrip of needRideTrips) {
            console.log(`Testing if NEEDRIDE trip ${needRideTrip.id} (${needRideTrip.originName} to ${needRideTrip.destinationName}) matches new PROVIDER trip ${newTrip.id}`);
            
            // Verificar se as duas viagens combinam usando a função existente
            try {
              // Verificamos a compatibilidade tanto direto quanto inverso para garantir
              const compatibleTrips = await storage.findMatchingTrips(needRideTrip.id);
              const isMatch = compatibleTrips.some(t => t.id === newTrip.id);
              
              if (isMatch) {
                console.log(`Match found: New PROVIDER trip ${newTrip.id} is compatible with NEEDRIDE trip ${needRideTrip.id}`);
                
                // Buscar informações do usuário dono da viagem NEEDRIDE
                const needRideUser = await storage.getUser(needRideTrip.userId);
                
                // Se o usuário tem email, enviar notificação
                if (needRideUser && needRideUser.email && process.env.SENDGRID_API_KEY) {
                  const { sendNewMatchEmail } = require('./utils/email');
                  
                  // Enviar email notificando sobre a nova viagem compatível
                  // Ajustar a data para o fuso horário correto (UTC+1 para Portugal)
                  const tripDate = new Date(needRideTrip.startDate);
                  tripDate.setHours(tripDate.getHours() + 1); // Ajuste para o fuso horário de Portugal

                  // URL base da aplicação - obtendo da solicitação atual
                  const appUrl = `${req.protocol}://${req.get('host')}`;

                  await sendNewMatchEmail({
                    recipientEmail: needRideUser.email,
                    recipientName: needRideUser.name || needRideUser.username,
                    tripOrigin: needRideTrip.originName,
                    tripDestination: needRideTrip.destinationName,
                    tripDate: tripDate.toLocaleDateString('pt-PT'),
                    matchCount: 1, // Neste caso, apenas uma nova viagem compatível foi encontrada
                    userTripId: needRideTrip.id, // ID da viagem do usuário NEEDRIDE
                    matchingTripId: newTrip.id, // ID da nova viagem PROVIDER compatível
                    appUrl // URL base da aplicação
                  });
                  
                  console.log(`Sent match notification email for NEEDRIDE trip ${needRideTrip.id} about new PROVIDER trip ${newTrip.id}`);
                }
              } else {
                console.log(`No match: NEEDRIDE trip ${needRideTrip.id} is not compatible with new PROVIDER trip ${newTrip.id}`);
              }
            } catch (matchError) {
              console.error(`Error checking match between trips ${needRideTrip.id} and ${newTrip.id}:`, matchError);
            }
          }
        }
        
        // Quando a viagem criada for do tipo NEEDRIDE, verificar se há viagens PROVIDER compatíveis
        else if (newTrip.status === "NEEDRIDE") {
          // Usar diretamente o método findMatchingTrips que já tem toda a lógica de compatibilidade implementada
          const matchingTrips = await storage.findMatchingTrips(newTrip.id);
          
          console.log(`Found ${matchingTrips.length} matching PROVIDER trips for new NEEDRIDE trip ${newTrip.id} using findMatchingTrips`);
          
          // Para each viagem compatível, registramos o resultado para debug
          for (const providerTrip of matchingTrips) {
            console.log(`Match confirmed: New NEEDRIDE trip ${newTrip.id} is compatible with PROVIDER trip ${providerTrip.id} (${providerTrip.originName} to ${providerTrip.destinationName})`);
          }
          
          // Se encontrou viagens compatíveis, notificar o usuário sobre elas
          if (matchingTrips.length > 0) {
            // Buscar informações do usuário dono da nova viagem NEEDRIDE
            const needRideUser = await storage.getUser(newTrip.userId);
            
            // Se o usuário tem email, enviar notificação
            if (needRideUser && needRideUser.email && process.env.SENDGRID_API_KEY) {
              const { sendNewMatchEmail } = require('./utils/email');
              
              // Enviar email notificando sobre as viagens compatíveis encontradas
              // Ajustar a data para o fuso horário correto (UTC+1 para Portugal)
              const tripDate = new Date(newTrip.startDate);
              tripDate.setHours(tripDate.getHours() + 1); // Ajuste para o fuso horário de Portugal
              
              // URL base da aplicação - obtendo da solicitação atual
              const appUrl = `${req.protocol}://${req.get('host')}`;
              
              await sendNewMatchEmail({
                recipientEmail: needRideUser.email,
                recipientName: needRideUser.name || needRideUser.username,
                tripOrigin: newTrip.originName,
                tripDestination: newTrip.destinationName,
                tripDate: tripDate.toLocaleDateString('pt-PT'),
                matchCount: matchingTrips.length,
                userTripId: newTrip.id, // ID da viagem do usuário NEEDRIDE
                matchingTripId: matchingTrips[0]?.id, // ID da primeira viagem PROVIDER compatível
                appUrl // URL base da aplicação
              });
              
              console.log(`Sent match notification email for new NEEDRIDE trip ${newTrip.id} with ${matchingTrips.length} compatible PROVIDER trips`);
            }
          }
        }
      } catch (emailError) {
        console.error("Error sending match notification emails for new trip:", emailError);
        // Não falha o processo se os e-mails não puderem ser enviados
      }
      
      // Retorna a viagem criada
      res.status(201).json(newTrip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(500).json({ message: "Failed to create trip" });
    }
  });

  // Update trip - support both PUT and PATCH
  app.put("/api/trips/:id", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const existingTrip = await storage.getTrip(tripId);
      
      if (!existingTrip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      const updatedTrip = await storage.updateTrip(tripId, req.body);
      res.json(updatedTrip);
    } catch (error) {
      res.status(500).json({ message: "Failed to update trip" });
    }
  });
  
  // Add PATCH endpoint for updating trips (partial updates)
  app.patch("/api/trips/:id", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const existingTrip = await storage.getTrip(tripId);
      
      if (!existingTrip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Check if this trip has participants (can only edit if no participants)
      const participants = await storage.getTripParticipants(tripId);
      if (participants && participants.length > 0) {
        return res.status(400).json({ 
          message: "Cannot edit a trip with participants. Ask them to leave first." 
        });
      }
      
      // Pre-process dates for PostgreSQL compatibility
      const updateData = { ...req.body };
      
      // Log the update data for debugging
      console.log("Trip update data before processing:", JSON.stringify(updateData));
      
      // Convert date strings to Date objects if they exist
      if (updateData.startDate) {
        if (!(updateData.startDate instanceof Date)) {
          try {
            updateData.startDate = new Date(updateData.startDate);
            console.log("Converted startDate to:", updateData.startDate);
          } catch (e) {
            console.error("Failed to parse startDate:", updateData.startDate, e);
            return res.status(400).json({ message: "Invalid start date format" });
          }
        }
      }
      
      if (updateData.endDate) {
        if (!(updateData.endDate instanceof Date)) {
          try {
            updateData.endDate = new Date(updateData.endDate);
            console.log("Converted endDate to:", updateData.endDate);
          } catch (e) {
            console.error("Failed to parse endDate:", updateData.endDate, e);
            return res.status(400).json({ message: "Invalid end date format" });
          }
        }
      }
      
      console.log("Trip update data after processing:", JSON.stringify(updateData));
      
      const updatedTrip = await storage.updateTrip(tripId, updateData);
      res.json(updatedTrip);
    } catch (error) {
      console.error("Error updating trip:", error);
      // Handle and format error message safely
      let errorMessage = "Failed to update trip";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      
      res.status(500).json({ 
        message: "Failed to update trip", 
        error: errorMessage
      });
    }
  });

  app.delete("/api/trips/:id", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      
      // Get trip details before deletion (for email notifications)
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Get trip owner details
      const tripOwner = await storage.getUser(trip.userId);
      if (!tripOwner) {
        return res.status(404).json({ message: "Trip owner not found" });
      }
      
      // Check if we should send notifications (from query param)
      const sendNotifications = req.query.sendNotifications !== 'false';
      
      // If notifications are enabled AND SendGrid API key is available, get participants and send emails
      if (sendNotifications && process.env.SENDGRID_API_KEY) {
        try {
          // Get all trip participants
          const participants = await storage.getTripParticipants(tripId);
          
          // Format trip date for email
          const tripDateFormatted = trip.startDate ? format(new Date(trip.startDate), 'dd/MM/yyyy') : 'N/A';
          
          // Send notifications to all participants (except the owner)
          const emailPromises = participants
            .filter(participant => participant.userId !== trip.userId) // Don't notify the owner
            .map(async (participant) => {
              // Get participant user details
              const participantUser = await storage.getUser(participant.userId);
              if (!participantUser || !participantUser.email) return;
              
              return sendTripCancellationEmail({
                recipientEmail: participantUser.email,
                recipientName: participantUser.name || participantUser.username,
                tripOrigin: trip.originName,
                tripDestination: trip.destinationName,
                tripDate: tripDateFormatted,
                ownerName: tripOwner.name || tripOwner.username
              });
            });
            
          // Wait for all emails to be sent (but don't block response)
          Promise.all(emailPromises).catch(err => {
            console.error("Error sending trip cancellation emails:", err);
          });
        } catch (emailError) {
          console.error("Error preparing trip cancellation emails:", emailError);
          // Continue with deletion even if email sending fails
        }
      }
      
      // Delete the trip
      const success = await storage.deleteTrip(tripId);
      if (!success) {
        return res.status(404).json({ message: "Failed to delete trip" });
      }
      
      res.status(200).json({ 
        success: true, 
        message: "Trip deleted successfully",
        notificationsSent: sendNotifications && process.env.SENDGRID_API_KEY ? true : false
      });
    } catch (error) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ message: "Failed to delete trip" });
    }
  });

  // Matchmaking routes
  app.get("/api/trips/:id/matches", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const matches = await storage.findMatchingTrips(tripId);
      
      // Obter detalhes da viagem para a qual estamos buscando matches
      const trip = await storage.getTrip(tripId);
      
      // Se a viagem existe, for tipo NEEDRIDE e tiver matches encontrados
      if (trip && trip.status === "NEEDRIDE" && matches.length > 0) {
        try {
          // Obter informações do usuário
          const user = await storage.getUser(trip.userId);
          
          // Se o usuário tem email e o parâmetro sendNotification não está definido como false
          if (user && user.email && req.query.sendNotification !== 'false' && process.env.SENDGRID_API_KEY) {
            const { sendNewMatchEmail } = require('./utils/email');
            
            // Enviar email notificando sobre as novas viagens compatíveis
            await sendNewMatchEmail({
              recipientEmail: user.email,
              recipientName: user.name || user.username,
              tripOrigin: trip.originName,
              tripDestination: trip.destinationName,
              tripDate: new Date(trip.startDate).toLocaleDateString('pt-PT'),
              matchCount: matches.length
            });
            
            console.log(`Sent match notification email for trip ${tripId} (${matches.length} matches)`);
          }
        } catch (emailError) {
          console.error("Error sending match notification email:", emailError);
          // Não falha o processo se o email não puder ser enviado
        }
      }
      
      res.json(matches);
    } catch (error) {
      console.error("Error finding matching trips:", error);
      res.status(500).json({ message: "Failed to find matching trips" });
    }
  });
  
  // Trip participants routes
  app.get("/api/trips/:id/participants", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const participants = await storage.getTripParticipants(tripId);
      
      // Get user details for each participant to include name and avatar
      const participantsWithDetails = await Promise.all(
        participants.map(async (participant) => {
          const user = await storage.getUser(participant.userId);
          return {
            ...participant,
            user: user ? {
              id: user.id,
              name: user.name || user.username,
              avatar: user.avatar
            } : null
          };
        })
      );
      
      res.json(participantsWithDetails);
    } catch (error) {
      console.error("Error getting trip participants:", error);
      res.status(500).json({ message: "Failed to get trip participants" });
    }
  });
  
  app.get("/api/users/:id/participating-trips", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const trips = await storage.getUserTripsAsParticipant(userId);
      res.json(trips);
    } catch (error) {
      console.error("Error getting user's participating trips:", error);
      res.status(500).json({ message: "Failed to get participating trips" });
    }
  });
  
  app.get("/api/trips/:tripId/is-participant/:userId", async (req, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const userId = parseInt(req.params.userId);
      const isParticipant = await storage.isUserTripParticipant(tripId, userId);
      res.json({ isParticipant });
    } catch (error) {
      console.error("Error checking participant status:", error);
      res.status(500).json({ message: "Failed to check participant status" });
    }
  });

  // Direct participants endpoint for API testing
  app.post("/api/trips/:id/participants", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Get the trip to check if it has available seats
      const trip = await storage.getTrip(tripId);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Check if this is a provider trip with available seats
      if ((trip.status === "PROVIDER" || trip.status === "FLEXIBLE") && 
          (trip.availableSeats === null || trip.availableSeats < 1)) {
        return res.status(400).json({ message: "No available seats on this trip" });
      }
      
      // Add the participant - this also handles updating the available seats
      const tripParticipant = await storage.addTripParticipant({
        tripId,
        userId
      });
      
      // Get the updated trip with modified seat count
      const updatedTrip = await storage.getTrip(tripId);
      
      res.status(200).json({ 
        success: true, 
        message: "Successfully joined the trip",
        trip: updatedTrip,
        participant: tripParticipant
      });
    } catch (error) {
      console.error("Error joining trip:", error);
      res.status(500).json({ message: "Failed to join trip" });
    }
  });
  
  // Join a trip endpoint
  app.post("/api/trips/:id/join", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const { userId, createUserTrip = true, sendNotifications = true, existingNeedRideTripId = null } = req.body;
      
      console.log(`Join trip request for tripId=${tripId}, userId=${userId}, createUserTrip=${createUserTrip}, existingNeedRideTripId=${existingNeedRideTripId}`);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Get the trip to check if it has available seats
      const trip = await storage.getTrip(tripId);
      
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Check if this is a provider trip with available seats
      if ((trip.status === "PROVIDER" || trip.status === "FLEXIBLE") && 
          (trip.availableSeats === null || trip.availableSeats < 1)) {
        return res.status(400).json({ message: "No available seats on this trip" });
      }
      
      let userTrip = null;
      
      // Se temos um existingNeedRideTripId, usamos essa viagem existente em vez de criar uma nova
      if (existingNeedRideTripId) {
        // Logar todas as informações para debug
        console.log(`existingNeedRideTripId provided: ${existingNeedRideTripId}, type: ${typeof existingNeedRideTripId}`);
        
        // Buscar a viagem NEEDRIDE existente
        userTrip = await storage.getTrip(Number(existingNeedRideTripId));
        
        if (userTrip) {
          console.log(`Using existing NEEDRIDE trip (ID: ${userTrip.id}) for user ${userId}. Trip data:`, JSON.stringify(userTrip));
          
          // Marcar a viagem como oculta
          await storage.updateTrip(userTrip.id, { hidden: true });
          console.log(`Updated trip ${userTrip.id} to hidden=true`);
          
          // Verificar se o usuário é dono da viagem
          if (userTrip.userId !== Number(userId)) {
            console.log(`Warning: User ${userId} tried to use NEEDRIDE trip ${userTrip.id} owned by user ${userTrip.userId}`);
            userTrip = null; // Reseta para null para que uma nova viagem seja criada se necessário
          }
        } else {
          console.log(`Warning: Specified NEEDRIDE trip ${existingNeedRideTripId} not found`);
        }
      }
      
      // Só criamos uma nova viagem NEEDRIDE se:
      // 1. Não temos viagem existente válida para usar (userTrip é null)
      // 2. Não temos existingNeedRideTripId (não foi especificado nenhum ID)
      // 3. createUserTrip é verdadeiro 
      // 4. A viagem à qual estamos nos juntando é uma viagem PROVIDER
      if (!userTrip && !existingNeedRideTripId && createUserTrip && trip.status === "PROVIDER") {
        // Create a new trip for the user with NEEDRIDE status
        userTrip = await storage.createTrip({
          userId: Number(userId),
          originName: trip.originName,
          originLat: trip.originLat,
          originLng: trip.originLng,
          originRadius: 0,
          destinationName: trip.destinationName,
          destinationLat: trip.destinationLat,
          destinationLng: trip.destinationLng,
          destinationRadius: 0,
          startDate: new Date(trip.startDate),
          endDate: trip.endDate ? new Date(trip.endDate) : undefined,
          departureTime: trip.departureTime === null ? undefined : trip.departureTime,
          status: "NEEDRIDE",
          notes: `Esta viagem foi criada automaticamente ao aceitar a boleia em "${trip.originName} para ${trip.destinationName}"`,
          hidden: true // This trip should be hidden as it's automatically created
        });
        
        console.log(`Created NEEDRIDE trip for user ${userId} matching trip ${tripId}:`, userTrip);
      }
      
      // Add the participant - this also handles updating the available seats
      const tripParticipant = await storage.addTripParticipant({
        tripId,
        userId: Number(userId),
        // Se existingNeedRideTripId foi fornecido, usamos ele com prioridade, mesmo que userTrip seja null
        userNeedRideTripId: existingNeedRideTripId ? Number(existingNeedRideTripId) : userTrip ? userTrip.id : undefined
      });
      
      // Get the updated trip with modified seat count
      const updatedTrip = await storage.getTrip(tripId);

      // Enviar emails de notificação se sendNotifications estiver ativado
      if (sendNotifications) {
        try {
          // Buscar informações do usuário que está se juntando à viagem
          const joiningUser = await storage.getUser(Number(userId));
          
          // Buscar informações do proprietário da viagem
          const tripOwner = await storage.getUser(trip.userId);
          
          if (tripOwner && tripOwner.email && joiningUser) {
            // 1. Email para o condutor notificando que alguém se juntou à viagem
            const { sendPassengerJoinedEmail } = require('./utils/email');
            await sendPassengerJoinedEmail({
              recipientEmail: tripOwner.email,
              recipientName: tripOwner.name || tripOwner.username,
              passengerName: joiningUser.name || joiningUser.username,
              tripOrigin: trip.originName,
              tripDestination: trip.destinationName,
              tripDate: new Date(trip.startDate).toLocaleDateString('pt-PT')
            });
            
            // 2. Email para o passageiro confirmando a participação
            if (joiningUser.email && updatedTrip) {
              const { sendTripJoinConfirmationEmail } = require('./utils/email');
              await sendTripJoinConfirmationEmail({
                recipientEmail: joiningUser.email,
                recipientName: joiningUser.name || joiningUser.username,
                driverName: tripOwner.name || tripOwner.username,
                tripOrigin: trip.originName,
                tripDestination: trip.destinationName,
                tripDate: new Date(trip.startDate).toLocaleDateString('pt-PT'),
                seatCount: updatedTrip.availableSeats || 0
              });
            }
            
            console.log(`Sent notification emails for trip join: tripId=${tripId}, userId=${userId}`);
          }
        } catch (emailError) {
          console.error("Error sending join notification emails:", emailError);
          // Não falha o processo se os emails não puderem ser enviados
        }
      }
      
      res.status(200).json({ 
        success: true, 
        message: "Successfully joined the trip",
        trip: updatedTrip,
        userTrip: userTrip, // Return the newly created user trip if created
        participant: tripParticipant
      });
    } catch (error) {
      console.error("Error joining trip:", error);
      res.status(500).json({ message: "Failed to join trip" });
    }
  });
  
  // Leave a trip endpoint
  app.delete("/api/trips/:tripId/participants/:userId", async (req, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const userId = parseInt(req.params.userId);
      const deleteNeedRideTrip = req.query.deleteNeedRideTrip === 'true';
      
      console.log(`User ${userId} leaving trip ${tripId}, deleteNeedRideTrip: ${deleteNeedRideTrip}`);
      console.log(`Query parameter value: ${req.query.deleteNeedRideTrip}, type: ${typeof req.query.deleteNeedRideTrip}`);
      
      // Get the joined trip details to use later
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      // Primeiro buscamos o participante para verificar se há um tripId associado
      let userNeedRideTrip = null;
      
      // Buscar o registro de participante para ver se tem uma viagem NEEDRIDE associada
      const participant = await storage.findTripParticipant(tripId, userId);
      console.log(`Finding participant record for tripId=${tripId}, userId=${userId}:`, participant);
      
      if (deleteNeedRideTrip && participant && participant.userNeedRideTripId) {
        try {
          // Agora temos o ID exato da viagem NEEDRIDE a ser excluída
          const needRideTripId = participant.userNeedRideTripId;
          console.log(`Found exact NEEDRIDE trip ID from participant record: ${needRideTripId}`);
          
          // Buscar a viagem para ter detalhes completos
          const needRideTrip = await storage.getTrip(needRideTripId);
          
          if (needRideTrip) {
            console.log(`Found NEEDRIDE trip to delete: ID=${needRideTrip.id}, Origin=${needRideTrip.originName}, Destination=${needRideTrip.destinationName}`);
            await storage.deleteTrip(needRideTrip.id);
            console.log(`Deleted NEEDRIDE trip (ID: ${needRideTrip.id})`);
            userNeedRideTrip = needRideTrip;
          } else {
            console.log(`Referenced NEEDRIDE trip ID=${needRideTripId} not found in database`);
          }
        } catch (error) {
          console.error("Error deleting NEEDRIDE trip:", error);
        }
      } else if (deleteNeedRideTrip) {
        console.log("No NEEDRIDE trip ID found in participant record, using fallback search methods");
        
        try {
          // FALLBACK: Se não temos a informação no participante (para compatibilidade), usamos os métodos antigos
          // Find all the user's trips first
          const userTrips = await storage.getTripsByUser(userId);
          console.log(`Found ${userTrips.length} trips for user ${userId}`);
          
          // Log all user trips for debugging
          userTrips.forEach((userTrip, index) => {
            console.log(`Trip ${index + 1}: ID=${userTrip.id}, Status=${userTrip.status}, Hidden=${userTrip.hidden}, Origin=${userTrip.originName}, Destination=${userTrip.destinationName}`);
          });
          
          // MÉTODO 1: Procurar viagens NEEDRIDE ocultas com a mesma rota
          for (const userTrip of userTrips) {
            if (userTrip.status === "NEEDRIDE" && userTrip.hidden) {
              const sameOrigin = userTrip.originName.toLowerCase().trim() === trip.originName.toLowerCase().trim();
              const sameDestination = userTrip.destinationName.toLowerCase().trim() === trip.destinationName.toLowerCase().trim();
              
              if (sameOrigin && sameDestination) {
                userNeedRideTrip = userTrip;
                console.log(`Method 1: Found hidden NEEDRIDE trip: ID=${userTrip.id}`);
                break;
              }
            }
          }
          
          // MÉTODO 2: Procurar qualquer viagem NEEDRIDE com a mesma rota
          if (!userNeedRideTrip) {
            for (const userTrip of userTrips) {
              if (userTrip.status === "NEEDRIDE") {
                const sameOrigin = userTrip.originName.toLowerCase().trim() === trip.originName.toLowerCase().trim();
                const sameDestination = userTrip.destinationName.toLowerCase().trim() === trip.destinationName.toLowerCase().trim();
                
                if (sameOrigin && sameDestination) {
                  userNeedRideTrip = userTrip;
                  console.log(`Method 2: Found NEEDRIDE trip: ID=${userTrip.id}`);
                  break;
                }
              }
            }
          }
          
          // Se encontramos uma viagem para excluir
          if (userNeedRideTrip) {
            console.log(`Found auto-created NEEDRIDE trip (ID: ${userNeedRideTrip.id}) to delete using fallback methods`);
            await storage.deleteTrip(userNeedRideTrip.id);
            console.log(`Deleted auto-created NEEDRIDE trip (ID: ${userNeedRideTrip.id})`);
          } else {
            console.log(`No matching NEEDRIDE trip found for user ${userId} on route ${trip.originName} -> ${trip.destinationName}`);
          }
        } catch (error) {
          console.error("Error finding or deleting NEEDRIDE trip with fallback methods:", error);
        }
      }
      
      // Now remove the user from the trip's participants
      const success = await storage.removeTripParticipant(tripId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Participant not found" });
      }
      
      // Get the updated trip with modified seat count
      const updatedTrip = await storage.getTrip(tripId);
      
      res.status(200).json({
        success: true,
        message: "Successfully left the trip",
        trip: updatedTrip,
        deletedNeedRideTrip: userNeedRideTrip ? {
          id: userNeedRideTrip.id,
          originName: userNeedRideTrip.originName,
          destinationName: userNeedRideTrip.destinationName
        } : null
      });
    } catch (error) {
      console.error("Error leaving trip:", error);
      res.status(500).json({ message: "Failed to leave trip" });
    }
  });

  // Message routes
  app.get("/api/users/:userId/messages", async (req, res) => {
    try {
      const messages = await storage.getMessagesByUser(parseInt(req.params.userId));
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.get("/api/messages/:userId1/:userId2", async (req, res) => {
    try {
      const userId1 = parseInt(req.params.userId1);
      const userId2 = parseInt(req.params.userId2);
      
      const messages = await storage.getMessagesBetweenUsers(userId1, userId2);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get conversation" });
    }
  });

  app.post("/api/messages", validateBody(insertMessageSchema), async (req, res) => {
    try {
      const message = await storage.createMessage(req.validatedBody);
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.patch("/api/messages/:id/read", async (req, res) => {
    try {
      const success = await storage.markMessageAsRead(parseInt(req.params.id));
      
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // City routes
  app.get("/api/cities", async (req, res) => {
    try {
      const cities = await storage.getCities();
      res.json(cities);
    } catch (error) {
      console.error("Error getting cities:", error);
      res.status(500).json({ message: "Error getting cities" });
    }
  });

  app.post("/api/cities", validateBody(insertCitySchema), async (req: Request, res) => {
    try {
      const city = await storage.createCity(req.validatedBody);
      res.status(201).json(city);
    } catch (error) {
      console.error("Error creating city:", error);
      res.status(500).json({ message: "Error creating city" });
    }
  });

  app.get("/api/cities/:id", async (req, res) => {
    try {
      const city = await storage.getCity(parseInt(req.params.id));
      
      if (!city) {
        return res.status(404).json({ message: "City not found" });
      }
      
      res.json(city);
    } catch (error) {
      console.error("Error getting city:", error);
      res.status(500).json({ message: "Error getting city" });
    }
  });

  app.patch("/api/cities/:id", async (req, res) => {
    try {
      const cityId = parseInt(req.params.id);
      const city = await storage.updateCity(cityId, req.body);
      
      if (!city) {
        return res.status(404).json({ message: "City not found" });
      }
      
      res.json(city);
    } catch (error) {
      console.error("Error updating city:", error);
      res.status(500).json({ message: "Error updating city" });
    }
  });

  app.delete("/api/cities/:id", async (req, res) => {
    try {
      const cityId = parseInt(req.params.id);
      const result = await storage.deleteCity(cityId);
      
      if (!result) {
        return res.status(404).json({ message: "City not found" });
      }
      
      res.json({ message: "City deleted successfully" });
    } catch (error) {
      console.error("Error deleting city:", error);
      res.status(500).json({ message: "Error deleting city" });
    }
  });

  app.post("/api/cities/seed", async (req, res) => {
    try {
      const result = await storage.seedCities();
      res.json({ message: "Cities seeded successfully", count: result });
    } catch (error) {
      console.error("Error seeding cities:", error);
      res.status(500).json({ message: "Error seeding cities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
