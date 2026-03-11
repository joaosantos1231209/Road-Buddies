import React, { useState, useEffect } from "react";
import { MobileHeader, MobileFooter, MobileNavSpacer } from "@/components/navigation/MobileNav";
import Sidebar from "@/components/navigation/Sidebar";
import TripCard from "@/components/trips/TripCard";
import CreateTripModal from "@/components/trips/CreateTripModal";
import { useUserTrips, useUserParticipatingTrips, useLeaveTrip, useMatchingTrips } from "@/hooks/use-trips";
import { Plus, Car, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { Trip } from "@shared/schema";
import { format } from "date-fns";

// Componente para exibir viagens compatíveis com as viagens NEEDRIDE do usuário
interface MatchesListProps {
  needRideTrips: Trip[];
  currentUserId?: number;
}

// Componente para exibir uma viagem compatível individual
function MatchingTripCard({ trip, needRideTripId, currentUserId }: { 
  trip: Trip; 
  needRideTripId: number; 
  currentUserId?: number; 
}) {
  const [tripOwner, setTripOwner] = useState<any>({
    name: "Carregando...",
    avatar: undefined
  });
  
  useEffect(() => {
    async function fetchTripOwner() {
      try {
        const owner = await apiRequest(`/api/users/${trip.userId}`);
        if (owner) {
          setTripOwner({
            name: owner.name || owner.username,
            avatar: owner.avatar
          });
        }
      } catch (error) {
        console.error("Error fetching trip owner:", error);
      }
    }
    
    fetchTripOwner();
  }, [trip.userId]);
  
  return (
    <TripCard 
      trip={trip}
      user={tripOwner}
      currentUserId={currentUserId}
      showMatchIndicator={true}
      joinerTripId={needRideTripId}
    />
  );
}

// Componente para exibir viagens compatíveis para uma viagem NEEDRIDE
function NeedRideTripMatches({ needRideTrip, currentUserId }: { 
  needRideTrip: Trip; 
  currentUserId?: number; 
}) {
  const { data: matches = [], isLoading: isLoadingMatches } = useMatchingTrips(needRideTrip.id);
  
  // Filtra apenas viagens PROVIDER
  const providerMatches = matches ? matches.filter(match => match.status === 'PROVIDER') : [];
  
  return (
    <div key={`needride-${needRideTrip.id}`} className="border-t pt-4">
      <div className="mb-2">
        <p className="text-sm font-medium">
          Viagens compatíveis com sua viagem de:
        </p>
        <p className="text-base">
          <span className="font-semibold">{needRideTrip.originName}</span> para <span className="font-semibold">{needRideTrip.destinationName}</span>
        </p>
        <p className="text-sm text-gray-500">
          {format(new Date(needRideTrip.startDate), 'dd/MM/yyyy')}
          {needRideTrip.endDate && ` até ${format(new Date(needRideTrip.endDate), 'dd/MM/yyyy')}`}
        </p>
      </div>
      
      {isLoadingMatches ? (
        <Skeleton className="h-24 w-full" />
      ) : providerMatches.length > 0 ? (
        <div className="space-y-4">
          {providerMatches.map(match => (
            <MatchingTripCard 
              key={`match-${match.id}-${needRideTrip.id}`}
              trip={match}
              needRideTripId={needRideTrip.id}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded p-4 text-center text-gray-500">
          Nenhuma viagem compatível encontrada para este percurso
        </div>
      )}
    </div>
  );
}

// Componente principal para exibir todas as viagens NEEDRIDE e seus matches
function MatchesList({ needRideTrips, currentUserId }: MatchesListProps) {
  if (!needRideTrips || needRideTrips.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg">
        <Users className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma viagem em modo "Preciso de Boleia"</h3>
        <p className="mt-1 text-sm text-gray-500">
          Crie uma viagem indicando que precisa de boleia para ver viagens compatíveis.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {needRideTrips.map(needRideTrip => (
        <NeedRideTripMatches 
          key={`needride-matches-${needRideTrip.id}`}
          needRideTrip={needRideTrip}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}

// Component to handle showing participating trips
interface ParticipatingTripCardProps {
  trip: Trip;
  currentUserId?: number;
  isHistoric?: boolean;
}

function ParticipatingTripCard({ trip, currentUserId, isHistoric = false }: ParticipatingTripCardProps) {
  const [tripOwner, setTripOwner] = useState<any>({
    name: "Carregando...",
    avatar: undefined
  });
  const leaveTrip = useLeaveTrip();
  
  useEffect(() => {
    async function fetchTripOwner() {
      try {
        const owner = await apiRequest(`/api/users/${trip.userId}`);
        if (owner) {
          setTripOwner({
            name: owner.name || owner.username,
            avatar: owner.avatar
          });
        }
      } catch (error) {
        console.error("Error fetching trip owner:", error);
      }
    }
    
    fetchTripOwner();
  }, [trip.userId]);
  
  return (
    <TripCard 
      trip={trip} 
      user={tripOwner}
      currentUserId={currentUserId}
      showMatchIndicator={false}
      isHistoric={isHistoric}
      onLeaveTrip={() => {
        // Force refresh after leaving a trip
        window.location.reload();
      }}
    />
  );
}

export default function MyTrips() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  
  // Fetch user data from backend based on Firebase user ID
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.uid) {
        try {
          const data = await apiRequest(`/api/users/by-firebase-id/${currentUser.uid}`);
          setUserData(data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoadingUser(false);
        }
      } else {
        setIsLoadingUser(false);
      }
    };
    
    fetchUserData();
  }, [currentUser]);
  
  // Carrega viagens ativas (não expiradas) para a aba principal 
  // Adicionado refetchInterval para atualizar automaticamente a cada 5 segundos 
  // e refetchOnWindowFocus para atualizar quando a janela receber foco
  const { data: userTrips, isLoading: isLoadingTrips } = useUserTrips(userData?.id, { refetchInterval: 5000 });
  const { data: participatingTrips, isLoading: isLoadingParticipatingTrips } = 
    useUserParticipatingTrips(userData?.id, { refetchInterval: 5000 });
  
  // Carrega viagens expiradas para a aba de histórico
  const { data: historicTrips, isLoading: isLoadingHistoricTrips } = 
    useUserTrips(userData?.id, { includeExpired: true });
  const { data: historicParticipatingTrips, isLoading: isLoadingHistoricParticipatingTrips } = 
    useUserParticipatingTrips(userData?.id, { includeExpired: true });
  
  const isLoading = isLoadingUser || isLoadingTrips || isLoadingParticipatingTrips;
  const isLoadingHistory = isLoadingUser || isLoadingHistoricTrips || isLoadingHistoricParticipatingTrips;
  
  // Filtra viagens expiradas do histórico completo para exibir na aba de histórico
  const expiredTrips = React.useMemo(() => {
    if (!historicTrips) return [];
    const now = new Date();
    return historicTrips.filter(trip => {
      const endDate = trip.endDate ? new Date(trip.endDate) : new Date(trip.startDate);
      return endDate < now;
    });
  }, [historicTrips]);
  
  // Filtra viagens participantes expiradas para a aba de histórico
  const expiredParticipatingTrips = React.useMemo(() => {
    if (!historicParticipatingTrips) return [];
    const now = new Date();
    return historicParticipatingTrips.filter((trip: Trip) => {
      const endDate = trip.endDate ? new Date(trip.endDate) : new Date(trip.startDate);
      return endDate < now;
    });
  }, [historicParticipatingTrips]);
  
  // Prepare user data for components
  const userDisplay = userData ? {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    avatar: userData.avatar || undefined
  } : { name: 'User', email: '', avatar: undefined };
  
  return (
    <div className="flex flex-col h-screen">
      <MobileHeader user={userDisplay} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar user={userDisplay} />
        
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Minhas Viagens</h1>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded-full"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nova Viagem
              </Button>
            </div>
            
            <Tabs defaultValue="active" className="mb-8">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="active" className="flex items-center">
                  <Car className="h-4 w-4 mr-2" />
                  <span>Ativas</span>
                </TabsTrigger>
                <TabsTrigger value="matches" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Matches</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <span>Histórico</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="mt-6">
                <div className="space-y-4">
                  {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-lg shadow overflow-hidden border border-gray-100 p-4">
                        <div className="flex items-start">
                          <Skeleton className="h-12 w-12 rounded-full mr-4" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-6 w-40" />
                              <Skeleton className="h-5 w-24" />
                            </div>
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-20 w-full" />
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-4 w-36" />
                              <Skeleton className="h-8 w-24 rounded-full" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (userTrips && userTrips.length > 0) || (participatingTrips && participatingTrips.length > 0) ? (
                    <>
                      {/* First show trips the user is participating in from other users */}
                      {participatingTrips && participatingTrips.length > 0 && (
                        <>
                          <h3 className="font-medium text-lg mb-4">Viagens que aceitei</h3>
                          <div className="space-y-4 mb-8">
                            {participatingTrips.map((trip: Trip) => (
                              <ParticipatingTripCard 
                                key={`participating-${trip.id}`} 
                                trip={trip}
                                currentUserId={userData?.id}
                              />
                            ))}
                          </div>
                        </>
                      )}
                      
                      {/* Then show the user's own trips */}
                      {userTrips && userTrips.length > 0 && (
                        <>
                          <h3 className="font-medium text-lg mb-4">Minhas viagens criadas</h3>
                          <div className="space-y-4">
                            {userTrips.map((trip) => (
                              <TripCard 
                                key={`owned-${trip.id}`} 
                                trip={trip} 
                                user={{
                                  name: userDisplay.name,
                                  avatar: userDisplay.avatar
                                }}
                                currentUserId={userData?.id}
                                showMatchIndicator={true}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                      <Car className="h-12 w-12 mx-auto text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma viagem ativa</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Você ainda não criou nenhuma necessidade de viagem.
                      </p>
                      <div className="mt-6">
                        <Button 
                          onClick={() => setIsCreateModalOpen(true)}
                          className="rounded-full"
                        >
                          Criar Primeira Viagem
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="matches" className="mt-6">
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-lg shadow overflow-hidden border border-gray-100 p-4">
                          <div className="flex items-start">
                            <Skeleton className="h-12 w-12 rounded-full mr-4" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <Skeleton className="h-6 w-40" />
                                <Skeleton className="h-5 w-24" />
                              </div>
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-20 w-full" />
                              <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-8 w-24 rounded-full" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {userTrips ? (
                        <div>
                          {/* Somente exibe quando o usuário tem viagens NEEDRIDE */}
                          {userTrips && userTrips.filter(trip => trip.status === 'NEEDRIDE').length > 0 ? (
                            <div className="mb-6">
                              <h3 className="font-medium text-lg mb-4">Viagens compatíveis com suas necessidades</h3>
                              
                              {/* Para cada viagem NEEDRIDE, exibe seus matches */}
                              <MatchesList 
                                needRideTrips={userTrips.filter(trip => trip.status === 'NEEDRIDE')} 
                                currentUserId={userData?.id} 
                              />
                            </div>
                          ) : (
                            // Mostra mensagem quando não há viagens NEEDRIDE
                            <div className="text-center py-10 bg-gray-50 rounded-lg">
                              <Users className="h-12 w-12 mx-auto text-gray-400" />
                              <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma viagem em modo "Preciso de Boleia"</h3>
                              <p className="mt-1 text-sm text-gray-500">
                                Crie uma viagem indicando que precisa de boleia para ver viagens compatíveis.
                              </p>
                              <div className="mt-6">
                                <Button 
                                  onClick={() => setIsCreateModalOpen(true)}
                                  className="rounded-full"
                                >
                                  Criar Nova Viagem
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Mostra quando não há viagens
                        <div className="text-center py-10 bg-gray-50 rounded-lg">
                          <Users className="h-12 w-12 mx-auto text-gray-400" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma viagem criada</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Crie uma viagem para ver viagens compatíveis.
                          </p>
                          <div className="mt-6">
                            <Button 
                              onClick={() => setIsCreateModalOpen(true)}
                              className="rounded-full"
                            >
                              Criar Nova Viagem
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="mt-6">
                <div className="space-y-4">
                  {isLoadingHistory ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-lg shadow overflow-hidden border border-gray-100 p-4">
                        <div className="flex items-start">
                          <Skeleton className="h-12 w-12 rounded-full mr-4" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-6 w-40" />
                              <Skeleton className="h-5 w-24" />
                            </div>
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-20 w-full" />
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-4 w-36" />
                              <Skeleton className="h-8 w-24 rounded-full" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (expiredTrips && expiredTrips.length > 0) || (expiredParticipatingTrips && expiredParticipatingTrips.length > 0) ? (
                    <>
                      {/* Primeiro mostrar viagens que o usuário participou de outros usuários */}
                      {expiredParticipatingTrips && expiredParticipatingTrips.length > 0 && (
                        <>
                          <h3 className="font-medium text-lg mb-4">Viagens passadas que participei</h3>
                          <div className="space-y-4 mb-8">
                            {expiredParticipatingTrips.map((trip: Trip) => (
                              <ParticipatingTripCard 
                                key={`history-participating-${trip.id}`} 
                                trip={trip}
                                currentUserId={userData?.id}
                                isHistoric={true}
                              />
                            ))}
                          </div>
                        </>
                      )}
                      
                      {/* Depois mostrar as viagens criadas pelo próprio usuário */}
                      {expiredTrips && expiredTrips.length > 0 && (
                        <>
                          <h3 className="font-medium text-lg mb-4">Minhas viagens passadas</h3>
                          <div className="space-y-4">
                            {expiredTrips.map((trip) => (
                              <TripCard 
                                key={`history-owned-${trip.id}`} 
                                trip={trip} 
                                user={{
                                  name: userDisplay.name,
                                  avatar: userDisplay.avatar
                                }}
                                currentUserId={userData?.id}
                                showMatchIndicator={false}
                                isHistoric={true}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                      <CalendarDays className="h-12 w-12 mx-auto text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma viagem no histórico</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Suas viagens passadas aparecerão aqui.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <MobileNavSpacer />
          </div>
        </main>
      </div>
      
      <MobileFooter />
      
      <CreateTripModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
