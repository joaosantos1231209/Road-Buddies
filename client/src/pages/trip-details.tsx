import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useTrip, useMatchingTrips, useTripParticipants, useJoinTrip, useLeaveTrip, useDeleteTrip } from "@/hooks/use-trips";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditTripModal from "@/components/trips/EditTripModal";
import { MobileHeader, MobileFooter, MobileNavSpacer } from "@/components/navigation/MobileNav";
import Sidebar from "@/components/navigation/Sidebar";
import TripCard from "@/components/trips/TripCard";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Car,
  Clock,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  ThumbsUp,
  CarFront
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TRIP_STATUS_LABELS, TRIP_STATUS_COLORS, TRIP_STATUS } from "@/lib/constants";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

export default function TripDetails() {
  const [, params] = useRoute("/trip/:id");
  const tripId = params?.id ? parseInt(params.id) : 0;
  const { currentUser } = useAuth();
  
  // Extrair o parâmetro joiner da URL (ID da viagem NEEDRIDE do usuário)
  const [joinerTripId, setJoinerTripId] = useState<number | null>(null);
  
  useEffect(() => {
    // Verifica se há um parâmetro "joiner" na URL
    const urlParams = new URLSearchParams(window.location.search);
    const joinerParam = urlParams.get('joiner');
    
    if (joinerParam) {
      const parsedId = parseInt(joinerParam);
      console.log(`Found joiner parameter in URL: ${joinerParam}, parsed as ${parsedId}`);
      setJoinerTripId(parsedId);
    } else {
      console.log('No joiner parameter found in URL');
      setJoinerTripId(null);
    }
  }, []);
  
  const { data: trip, isLoading } = useTrip(tripId);
  const { data: matchingTrips, isLoading: isLoadingMatches } = useMatchingTrips(tripId);
  const { data: participants, isLoading: isLoadingParticipants } = useTripParticipants(tripId);
  
  // State to store trip owners data (cache)
  const [tripOwners, setTripOwners] = useState<Record<number, { id: number; name: string; avatar?: string }>>({});
  const [participantUsers, setParticipantUsers] = useState<Record<number, { id: number; name: string; avatar?: string }>>({});
  const [currentBackendUserId, setCurrentBackendUserId] = useState<number | undefined>(undefined);
  const [isUserParticipating, setIsUserParticipating] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [confirmJoinOpen, setConfirmJoinOpen] = useState<boolean>(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  
  // Hook de toast para mostrar mensagens
  const { toast } = useToast();
  
  // Hooks de mutação
  const joinTripMutation = useJoinTrip();
  const leaveTripMutation = useLeaveTrip();
  const deleteTripMutation = useDeleteTrip();
  
  // State to store current user's backend data
  const [userData, setUserData] = useState({
    id: 0,
    name: "Carregando...",
    email: "carregando@example.com",
    avatar: undefined
  });
  
  // Fetch current user's backend data including ID
  useEffect(() => {
    if (currentUser?.uid) {
      const fetchCurrentUserData = async () => {
        try {
          const userData = await apiRequest(`/api/users/by-firebase-id/${currentUser.uid}`);
          setCurrentBackendUserId(userData.id);
          
          // Also update the user data for display
          setUserData({
            id: userData.id,
            name: userData.name || userData.username || "Utilizador",
            email: userData.email || "",
            avatar: userData.avatar
          });
        } catch (error) {
          console.error("Error fetching current user data:", error);
        }
      };
      
      fetchCurrentUserData();
    }
  }, [currentUser]);
  
  // Fetch user data for trip owner
  useEffect(() => {
    if (trip && !tripOwners[trip.userId]) {
      const fetchTripOwner = async () => {
        try {
          const userData = await apiRequest(`/api/users/${trip.userId}`);
          setTripOwners(prev => ({ 
            ...prev, 
            [trip.userId]: {
              id: userData.id,
              name: userData.name || userData.username,
              avatar: userData.avatar || undefined
            }
          }));
        } catch (error) {
          console.error("Error fetching trip owner:", error);
        }
      };
      
      fetchTripOwner();
    }
    
    // Also fetch user data for matching trips
    if (matchingTrips) {
      matchingTrips.forEach(matchTrip => {
        if (!tripOwners[matchTrip.userId]) {
          const fetchMatchingTripOwner = async () => {
            try {
              const userData = await apiRequest(`/api/users/${matchTrip.userId}`);
              setTripOwners(prev => ({ 
                ...prev, 
                [matchTrip.userId]: {
                  id: userData.id,
                  name: userData.name || userData.username,
                  avatar: userData.avatar || undefined
                }
              }));
            } catch (error) {
              console.error("Error fetching matching trip owner:", error);
            }
          };
          
          fetchMatchingTripOwner();
        }
      });
    }
  }, [trip, matchingTrips, tripOwners]);
  
  // Fetch participant users data and check if current user is participating
  useEffect(() => {
    // Check if current user is participating in this trip
    if (currentBackendUserId && tripId) {
      const checkParticipation = async () => {
        try {
          const response = await apiRequest(`/api/trips/${tripId}/is-participant/${currentBackendUserId}`);
          setIsUserParticipating(response.isParticipant);
        } catch (error) {
          console.error("Error checking user participation:", error);
        }
      };
      
      checkParticipation();
    }
    
    // Fetch participant user data for display
    if (participants && participants.length > 0) {
      participants.forEach((participant: { id: number; tripId: number; userId: number; createdAt: Date }) => {
        if (!participantUsers[participant.userId]) {
          const fetchParticipantData = async () => {
            try {
              const userData = await apiRequest(`/api/users/${participant.userId}`);
              setParticipantUsers(prev => ({ 
                ...prev, 
                [participant.userId]: {
                  id: userData.id,
                  name: userData.name || userData.username,
                  avatar: userData.avatar || undefined
                }
              }));
            } catch (error) {
              console.error("Error fetching participant data:", error);
            }
          };
          
          fetchParticipantData();
        }
      });
    }
  }, [currentBackendUserId, tripId, participants, participantUsers]);
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "d 'de' MMMM, yyyy", { locale: ptBR });
  };

  const formatTimeRange = (startDate: Date | string, endDate?: Date | string) => {
    if (!endDate) {
      return format(new Date(startDate), "HH:mm");
    }
    return `${format(new Date(startDate), "HH:mm")}-${format(new Date(endDate), "HH:mm")}`;
  };

  const getTripOwner = (userId: number) => {
    return tripOwners[userId] || {
      id: userId,
      name: "Utilizador",
      avatar: ""
    };
  };
  
  const getParticipantUser = (userId: number) => {
    return participantUsers[userId] || {
      id: userId,
      name: "Utilizador",
      avatar: ""
    };
  };
  
  // Função para abrir o diálogo de confirmação para juntar-se à viagem
  const handleJoinTrip = () => {
    if (!currentBackendUserId || !trip) return;
    setConfirmJoinOpen(true);
  };
  
  // Função para realmente executar a junção à viagem
  const executeJoinTrip = async () => {
    if (!currentBackendUserId || !trip) return;
    
    setIsActionLoading(true);
    try {
      // Obter novamente o parâmetro joiner da URL no momento da execução
      // para garantir que temos o valor mais recente
      const urlParams = new URLSearchParams(window.location.search);
      const joinerParam = urlParams.get('joiner');
      const effectiveJoinerId = joinerParam ? parseInt(joinerParam) : joinerTripId;
      
      // Se temos um joinerTripId, passamos ele como o existingNeedRideTripId
      console.log(`Joining trip ${trip.id} with joinerTripId=${effectiveJoinerId} (from URL: ${joinerParam}, from state: ${joinerTripId})`);
      
      const result = await joinTripMutation.mutateAsync({ 
        tripId: trip.id, 
        userId: currentBackendUserId,
        // Garantir que o joinerTripId seja passado como número se existir
        existingNeedRideTripId: effectiveJoinerId
      });
      
      console.log("Join trip result:", result);
      
      // Mensagem personalizada com base no resultado
      let description = "Você juntou-se à viagem.";
      if (joinerTripId) {
        description = "Você juntou-se à viagem usando sua viagem 'Preciso de boleia' existente.";
      }
      
      toast({
        title: "Sucesso!",
        description,
        variant: "default",
      });
      
      // Atualizar o estado de participação
      setIsUserParticipating(true);
    } catch (error) {
      console.error("Error joining trip:", error);
      toast({
        title: "Erro",
        description: "Não foi possível juntar-se à viagem. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
      setConfirmJoinOpen(false);
    }
  };
  
  // Função para abrir o diálogo de confirmação para deixar a viagem
  const handleLeaveTrip = () => {
    if (!currentBackendUserId || !trip) return;
    setConfirmLeaveOpen(true);
  };
  
  // Função para realmente executar a ação de deixar a viagem
  const executeLeaveTrip = async (deleteNeedRideTrip: boolean) => {
    if (!currentBackendUserId || !trip) return;
    
    setIsActionLoading(true);
    try {
      const result = await leaveTripMutation.mutateAsync({ 
        tripId: trip.id, 
        userId: currentBackendUserId,
        deleteNeedRideTrip
      });
      
      let description = "Você saiu da viagem.";
      if (result.deletedNeedRideTrip) {
        description = `Você saiu da viagem e a viagem correspondente "${result.deletedNeedRideTrip.originName} → ${result.deletedNeedRideTrip.destinationName}" foi removida.`;
      }
      
      toast({
        title: "Sucesso!",
        description,
        variant: "default",
      });
      
      // Atualizar o estado de participação
      setIsUserParticipating(false);
    } catch (error) {
      console.error("Error leaving trip:", error);
      toast({
        title: "Erro",
        description: "Não foi possível sair da viagem. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
      setConfirmLeaveOpen(false);
    }
  };
  
  // Função para excluir uma viagem
  const handleDeleteTrip = async () => {
    if (!trip) return;
    
    setIsActionLoading(true);
    try {
      await deleteTripMutation.mutateAsync({ id: trip.id, userId: userData.id });
      
      toast({
        title: "Viagem excluída",
        description: "A viagem foi excluída com sucesso.",
        variant: "default",
      });
      
      // Redirecionar para a página de viagens
      window.location.href = "/my-trips";
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a viagem. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
      setConfirmDeleteOpen(false);
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      <MobileHeader user={{
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar
      }} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar user={{
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar
        }} />
        
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto p-4">
            <div className="mb-6">
              <Link href="/my-trips">
                <Button variant="ghost" size="sm" className="mb-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar às Minhas Viagens
                </Button>
              </Link>
              
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-6 w-40" />
                  <div className="flex items-start space-x-4 mt-6">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              ) : trip ? (
                <>
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">
                      {trip.originName} → {trip.destinationName}
                    </h1>
                    <Badge className={`${TRIP_STATUS_COLORS[trip.status]} flex items-center`}>
                      {trip.status === TRIP_STATUS.PROVIDER ? (
                        <CarFront className="h-3.5 w-3.5 md:mr-1.5" />
                      ) : (
                        <ThumbsUp className="h-3.5 w-3.5 md:mr-1.5" />
                      )}
                      <span className="hidden md:inline">{TRIP_STATUS_LABELS[trip.status]}</span>
                    </Badge>
                  </div>
                  
                  <div className="flex items-center mt-2 text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {formatDate(trip.startDate)}
                      {trip.endDate && trip.endDate !== trip.startDate ? ` - ${formatDate(trip.endDate)}` : ''}
                    </span>
                  </div>
                  
                  <div className="mt-6 flex items-start space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage 
                        src={getTripOwner(trip.userId).avatar} 
                        alt={getTripOwner(trip.userId).name} 
                      />
                      <AvatarFallback>{getInitials(getTripOwner(trip.userId).name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-xl font-semibold">{getTripOwner(trip.userId).name}</h2>
                          {/* <div className="text-sm text-gray-600 mt-1">Criado em {formatDate(trip.createdAt)}</div>  */} 
                        </div>
                        
                        {/* Ações da viagem */}
                        <div className="flex gap-2">
                          {/* Logs para debug - remover posteriormente */}
                          {console.log('Render conditions: ', {
                            currentBackendUserId,
                            'trip.userId': trip.userId,
                            'trip.status': trip.status,
                            'trip.availableSeats': trip.availableSeats,
                            isUserParticipating
                          })}
                          
                          {/* Mostrar botão de Juntar-se apenas se:
                              1. Não for o criador da viagem
                              2. A viagem for do tipo PROVIDER
                              3. A viagem tiver vagas disponíveis
                              4. O usuário não for participante ainda */}
                          {currentBackendUserId && 
                          trip.userId !== currentBackendUserId && 
                          trip.status === "PROVIDER" && 
                          trip.availableSeats !== null && 
                          trip.availableSeats > 0 && 
                          !isUserParticipating && (
                            <Button 
                              variant="default"
                              className="rounded-full"
                              onClick={handleJoinTrip}
                              disabled={isActionLoading}
                            >
                              <UserPlus className="h-4 w-4 md:mr-1" />
                              <span className="hidden md:inline">Juntar-se</span>
                            </Button>
                          )}
                          
                          {/* Mostrar botão de Deixar viagem se o usuário já for participante */}
                          {currentBackendUserId && 
                          trip.userId !== currentBackendUserId && 
                          isUserParticipating && (
                            <Button 
                              variant="outline"
                              className="rounded-full border-red-200 bg-red-50 hover:bg-red-100 text-red-700"
                              onClick={handleLeaveTrip}
                              disabled={isActionLoading}
                            >
                              <UserMinus className="h-4 w-4 md:mr-1" />
                              <span className="hidden md:inline">Deixar viagem</span>
                            </Button>
                          )}
                          
                          {/* Mostrar botão de Editar apenas para o criador da viagem e se não houver participantes */}
                          {currentBackendUserId && 
                          trip.userId === currentBackendUserId && 
                          participants && 
                          participants.length === 0 && (
                            <Button 
                              variant="outline"
                              className="rounded-full border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
                              onClick={() => setIsEditModalOpen(true)}
                              disabled={isActionLoading}
                            >
                              <Edit className="h-4 w-4 md:mr-1" />
                              <span className="hidden md:inline">Editar</span>
                            </Button>
                          )}

                          {/* Mostrar botão de Eliminar apenas para o criador da viagem */}
                          {currentBackendUserId && 
                          trip.userId === currentBackendUserId && (
                            <Button 
                              variant="outline"
                              className="rounded-full border-red-200 bg-red-50 hover:bg-red-100 text-red-700"
                              onClick={() => setConfirmDeleteOpen(true)}
                              disabled={isActionLoading}
                            >
                              <Trash2 className="h-4 w-4 md:mr-1" />
                              <span className="hidden md:inline">Eliminar</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Detalhes do Trajeto</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <div className="flex flex-col items-center mr-3">
                              <div className="w-3 h-3 rounded-full bg-green-500 mt-1"></div>
                              <div className="w-0.5 h-14 bg-gray-300"></div>
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            </div>
                            <div>
                              <div>
                                <div className="font-medium">{trip.originName}</div>
                                <div className="text-sm text-gray-600 flex items-center mt-6">
                                  {/* <MapPin className="h-4 w-4 mr-1" />
                                  <span>
                                    Ponto de partida
                                  </span> */}
                                </div>
                              </div>
                              <div className="mt-4">
                                <div className="font-medium">{trip.destinationName}</div>
                                <div className="text-sm text-gray-600 flex items-center mt-1">
                                  {/* <MapPin className="h-4 w-4 mr-1" />
                                  <span>
                                    Ponto de chegada
                                  </span> */}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Informações Adicionais</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center text-gray-700">
                            <Calendar className="h-5 w-5 mr-3 text-gray-500" />
                            <div>
                              <div className="font-medium">Data e Hora</div>
                              <div className="text-sm text-gray-600">
                                {formatDate(trip.startDate)}
                                {trip.endDate && (trip.endDate !== trip.startDate) 
                                  ? ` - ${formatDate(trip.endDate)}` 
                                  : ''}
                                {trip.departureTime && (
                                  <div className="flex items-center mt-1">
                                    <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                    <span>Hora de saída: {trip.departureTime}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-gray-700">
                            <Car className="h-5 w-5 mr-3 text-gray-500" />
                            <div>
                              <div className="font-medium">Status da Viatura</div>
                              <div className="text-sm text-gray-600">
                                {TRIP_STATUS_LABELS[trip.status]}
                              </div>
                            </div>
                          </div>
                          
                          {trip.availableSeats && trip.status !== "NEEDRIDE" && (
                            <div className="flex items-center text-gray-700">
                              <Users className="h-5 w-5 mr-3 text-gray-500" />
                              <div>
                                <div className="font-medium">Lugares Disponíveis</div>
                                <div className="text-sm text-gray-600">
                                  {trip.availableSeats} {trip.availableSeats === 1 ? "lugar" : "lugares"}
                                </div>
                              </div>
                            </div>
                          )}
                          

                          
                          {trip.notes && (
                            <div className="flex items-start text-gray-700 mt-4">
                              <div>
                                <div className="font-medium">Observações</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {trip.notes}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Participants Section */}
                  <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">Participantes</h2>
                    
                    {isLoadingParticipants ? (
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                      </div>
                    ) : participants && participants.length > 0 ? (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-2">
                            {participants.length} {participants.length === 1 ? 'pessoa' : 'pessoas'} confirmadas para esta viagem:
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {participants.map((participant: { id: number; tripId: number; userId: number; createdAt: Date }) => (
                              <div key={participant.id} className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage 
                                    src={getParticipantUser(participant.userId).avatar} 
                                    alt={getParticipantUser(participant.userId).name} 
                                  />
                                  <AvatarFallback>{getInitials(getParticipantUser(participant.userId).name)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">
                                  {getParticipantUser(participant.userId).name}
                                  {participant.userId === currentBackendUserId && " (Você)"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/*
                        {currentBackendUserId && currentBackendUserId === trip.userId && (
                          <div className="text-sm text-gray-500">
                            Você é o proprietário desta viagem
                          </div>
                        )}
                        */}
                        
                        
                        {currentBackendUserId && currentBackendUserId !== trip.userId && (
                          <>
                            {isUserParticipating ? (
                              <div className="text-sm text-green-600 font-medium">
                                Você está participando desta viagem
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                Veja as viagens compatíveis abaixo e escolha a que melhor atende suas necessidades
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Users className="h-10 w-10 mx-auto text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                          Ainda não há participantes nesta viagem
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Seja o primeiro a participar!
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Viagem não encontrada</h3>
                </div>
              )}
            </div>
            
            {/* Matching Trips Section - Shown to trip owner or if viewing a NEEDRIDE trip */}
            {trip && (currentBackendUserId === trip.userId || trip.status === "NEEDRIDE") && (
              <div className="mt-10">
                <h2 className="text-xl font-bold mb-4">Viagens Compatíveis</h2>
                
                {isLoadingMatches ? (
                  <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-40 w-full rounded-lg" />
                    ))}
                  </div>
                ) : matchingTrips && matchingTrips.length > 0 ? (
                  (() => {
                    // Filter matching trips first - don't show trips the user already owns
                    const filteredTrips = matchingTrips.filter(matchTrip => 
                      matchTrip.userId !== currentBackendUserId
                    );
                    
                    // Se a viagem atual for NEEDRIDE, passamos o ID dela como joinerTripId
                    const shouldUseJoinerTripId = trip.status === "NEEDRIDE";
                    
                    // Then check if we have any trips left after filtering
                    return filteredTrips.length > 0 ? (
                      <div className="space-y-4">
                        {filteredTrips.map((matchTrip) => (
                          <TripCard 
                            key={matchTrip.id} 
                            trip={matchTrip} 
                            user={getTripOwner(matchTrip.userId)}
                            currentUserId={currentBackendUserId}
                            showMatchIndicator={false}
                            joinerTripId={shouldUseJoinerTripId ? trip.id : undefined}
                            onJoinTrip={() => {
                              // Refresh the trip data after joining
                              window.location.reload();
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      // No trips left after filtering
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Clock className="h-10 w-10 mx-auto text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                          Não há viagens compatíveis disponíveis
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {isUserParticipating 
                            ? "Você já participa de todas as viagens compatíveis." 
                            : "Todas as viagens compatíveis são suas ou você já está a participar nelas."}
                        </p>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Clock className="h-10 w-10 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      Não há viagens compatíveis
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Volte mais tarde para verificar se há novas correspondências.
                    </p>
                  </div>
                )}
              </div>
            )}
            <MobileNavSpacer />
          </div>
        </main>
      </div>
      
      <MobileFooter />
      
      {/* Modais e Diálogos */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Os participantes da viagem serão notificados por email (se disponível).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTrip}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "A eliminar..." : "Sim, eliminar viagem"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Modal de edição */}
      {isEditModalOpen && trip && (
        <EditTripModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          trip={trip}
        />
      )}
      
      {/* Diálogo de confirmação para juntar-se à viagem */}
      <AlertDialog open={confirmJoinOpen} onOpenChange={setConfirmJoinOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Juntar-se a esta viagem?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeJoinTrip}
              className="bg-green-600 hover:bg-green-700"
              disabled={isActionLoading}
            >
              {isActionLoading ? "Processando..." : "Sim, quero juntar-me"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmação para deixar a viagem com opção de excluir NEEDRIDE */}
      <AlertDialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deixar a viagem?</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">Deseja mesmo deixar esta viagem?</p>
              <p className="mb-2">Pode deixar a viagem e criar uma "Preciso de Boleia" com as mesmas características. O que deseja fazer?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-4 flex flex-row gap-2">
            <div className="flex-1">
              <button 
                onClick={() => executeLeaveTrip(true)}
                disabled={isActionLoading}
                className="w-full rounded-md bg-red-500 hover:bg-red-600 text-white p-4 text-center"
              >
                Deixar a viagem
              </button>
            </div>
            <div className="flex-1">
              <button 
                onClick={() => executeLeaveTrip(false)}
                disabled={isActionLoading}
                className="w-full rounded-md bg-primary text-white p-4 text-center"
              >
                Deixar a viagem e criar uma "Preciso de Boleia"
              </button>
            </div>
            <div className="flex-1">
              <AlertDialogCancel className="w-full h-full">
                Cancelar
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
