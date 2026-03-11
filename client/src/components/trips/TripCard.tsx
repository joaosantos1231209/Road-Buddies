import { Link } from "wouter";
import { Calendar, Users, Car, UserPlus, UserMinus, CheckCircle, Trash2, Edit, Footprints } from "lucide-react";
import { Trip } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TRIP_STATUS_LABELS, TRIP_STATUS_COLORS, TRIP_STATUS_ICONS, TRIP_STATUS } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useTripMatches, useJoinTrip, useLeaveTrip, useTripParticipants, useDeleteTrip } from "@/hooks/use-trips";
import { useToast } from "@/hooks/use-toast";
import EditTripModal from "./EditTripModal";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TripCardProps {
  trip: Trip;
  user: {
    name: string;
    avatar?: string;
  };
  currentUserId?: number;
  showMatchIndicator?: boolean;
  onJoinTrip?: () => void;
  onLeaveTrip?: () => void;
  isHistoric?: boolean;
  joinerTripId?: number; // ID da viagem NEEDRIDE do usuário, se aplicável
}

export default function TripCard({ 
  trip, 
  user, 
  currentUserId, 
  showMatchIndicator = true,
  onJoinTrip,
  onLeaveTrip,
  isHistoric = false,
  joinerTripId
}: TripCardProps) {
  const { data: matches, isLoading: isLoadingMatches } = useTripMatches(trip.id);
  const { data: participants, isLoading: isLoadingParticipants } = useTripParticipants(trip.id);
  const joinTrip = useJoinTrip();
  const leaveTrip = useLeaveTrip();
  const deleteTrip = useDeleteTrip();
  const { toast } = useToast();
  const [hasMatches, setHasMatches] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [participantUsers, setParticipantUsers] = useState<Record<number, { id: number; name: string; avatar?: string }>>({});

  // Check if this trip has matches
  useEffect(() => {
    if (matches && matches.length > 0) {
      setHasMatches(true);
    }
  }, [matches]);

  // Check if current user is a participant
  useEffect(() => {
    if (currentUserId && trip.id) {
      setIsLoading(true);
      apiRequest(`/api/trips/${trip.id}/is-participant/${currentUserId}`)
        .then(data => {
          setIsParticipant(data.isParticipant);
        })
        .catch(error => {
          console.error("Error checking participant status:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [currentUserId, trip.id]);
  
  // Fetch participant user data
  useEffect(() => {
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
  }, [participants, participantUsers]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "";
    return format(new Date(date), "d 'de' MMMM, yyyy", { locale: ptBR });
  };

  const formatTimeRange = (startDate: Date | null | undefined, endDate?: Date | null | undefined) => {
    if (!startDate) return "";
    if (!endDate) {
      return format(new Date(startDate), "HH:mm");
    }
    return `${format(new Date(startDate), "HH:mm")}-${format(new Date(endDate), "HH:mm")}`;
  };

  const formatDateRange = (startDate: Date | null | undefined, endDate?: Date | null | undefined, departureTime?: string) => {
    if (!startDate) return "";
    
    // Se o horário de partida foi fornecido, usá-lo com prioridade
    const timeInfo = departureTime ? ` • ${departureTime}` : "";
    
    if (!endDate) {
      return `${formatDate(startDate)}${timeInfo}`;
    }
    
    // Se for o mesmo dia, mostrar a data uma vez e o intervalo de horas,
    // mas se tiver departureTime, priorizar este valor
    if (format(new Date(startDate), "yyyy-MM-dd") === format(new Date(endDate), "yyyy-MM-dd")) {
      if (departureTime) {
        return `${formatDate(startDate)} • ${departureTime}`;
      } else {
        return `${formatDate(startDate)} • ${formatTimeRange(startDate, endDate)}`;
      }
    }
    
    // Se forem dias diferentes, mostrar o intervalo de dias e o horário se disponível
    return `${format(new Date(startDate), "d", { locale: ptBR })}-${format(new Date(endDate), "d 'de' MMMM, yyyy", { locale: ptBR })}${timeInfo}`;
  };

  // Handle joining a trip
  const handleJoinTrip = async () => {
    if (!currentUserId) {
      toast({
        title: "Erro",
        description: "Não foi possível identificar o seu utilizador. Por favor, tente novamente mais tarde.",
        variant: "destructive"
      });
      return;
    }

    try {
      await joinTrip.mutateAsync({ 
        tripId: trip.id, 
        userId: currentUserId 
      });
      
      toast({
        title: "Sucesso!",
        description: "Juntou-se à viagem com sucesso.",
      });
      
      setIsParticipant(true);
      
      if (onJoinTrip) {
        onJoinTrip();
      }
    } catch (error) {
      console.error("Error joining trip:", error);
      toast({
        title: "Erro",
        description: "Não foi possível juntar-se à viagem. Por favor, tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };
  
  // Handle leaving a trip
  const handleLeaveTrip = async () => {
    if (!currentUserId) {
      toast({
        title: "Erro",
        description: "Não foi possível identificar o seu utilizador. Por favor, tente novamente mais tarde.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await leaveTrip.mutateAsync({ 
        tripId: trip.id, 
        userId: currentUserId 
      });
      
      toast({
        title: "Sucesso!",
        description: "Saiu da viagem com sucesso.",
      });
      
      setIsParticipant(false);
      
      if (onLeaveTrip) {
        onLeaveTrip();
      }
    } catch (error) {
      console.error("Error leaving trip:", error);
      toast({
        title: "Erro",
        description: "Não foi possível sair da viagem. Por favor, tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };
  
  // Handle deleting a trip (only for trip owners)
  const handleDeleteTrip = async () => {
    if (!currentUserId) {
      toast({
        title: "Erro",
        description: "Não foi possível identificar o seu utilizador. Por favor, tente novamente mais tarde.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await deleteTrip.mutateAsync({ 
        id: trip.id, 
        userId: currentUserId,
        sendNotifications: true 
      });
      
      toast({
        title: "Sucesso!",
        description: response.notificationsSent 
          ? "Viagem eliminada com sucesso. Os participantes foram notificados por email."
          : "Viagem eliminada com sucesso.",
      });
      
      // Refresh the page to show updated trips list
      window.location.reload();
      
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast({
        title: "Erro",
        description: "Não foi possível eliminar a viagem. Por favor, tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100 relative">
        <div className="p-4">
          <div className="flex items-start">
            <div className="mr-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <h3 className="font-semibold text-lg">
                    {trip.originName} → {trip.destinationName}
                  </h3>
                  {isParticipant && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="ml-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" />
                              {trip.userId !== currentUserId ? (
                                <span>Boleia Aceite</span>
                              ) : (
                                <span>Participante</span>
                              )}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {trip.userId !== currentUserId ? (
                            <p>Você aceitou boleia nesta viagem</p>
                          ) : (
                            <p>Você participa nesta viagem</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {/* Match indicator - mostrado apenas se:
                      1. Pertence ao usuário atual OU
                      2. Match com uma viagem do usuário atual */}
                  {showMatchIndicator && hasMatches && (trip.userId === currentUserId || matches?.some(m => m.userId === currentUserId)) && (
                    <Badge variant="secondary" className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200">
                      <Car className="h-3 w-3 mr-1" />
                      Match
                    </Badge>
                  )}
                  
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${TRIP_STATUS_COLORS[trip.status]} flex items-center`}>
                    {trip.status === TRIP_STATUS.PROVIDER ? (
                      <Car className="h-3.5 w-3.5 md:mr-1.5" />
                    ) : (
                      <Footprints className="h-3.5 w-3.5 md:mr-1.5" />
                    )}
                    <span className="hidden md:inline">{TRIP_STATUS_LABELS[trip.status]}</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                <span>{formatDateRange(trip.startDate, trip.endDate, trip.departureTime || undefined)}</span>
              </div>
              <div className="flex items-start mb-3">
                <div className="flex flex-col items-center mr-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1"></div>
                  <div className="w-0.5 h-8 bg-gray-300"></div>
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">{trip.originName}</div>
                   <div className="text-gray-500 text-xs mb-4">
                    {/* Ponto de partida */}
                  </div> 
                  <div className="font-medium">{trip.destinationName}</div>
                  <div className="text-gray-500 text-xs">
                    {/* Ponto de chegada */}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  {/* Participant avatars */}
                  {participants && participants.length > 0 && (
                    <div className="flex items-center">
                      <div className="flex -space-x-2 mr-2">
                        {Object.values(participantUsers).slice(0, 3).map((user, i) => (
                          <TooltipProvider key={i} delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="h-6 w-6 ring-2 ring-white">
                                  <AvatarImage src={user.avatar} alt={user.name} />
                                  <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{user.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        {Object.values(participantUsers).length > 3 && (
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-500 ring-2 ring-white font-medium text-xs">
                                  +{Object.values(participantUsers).length - 3}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-52">
                                <p className="text-xs">
                                  {Object.values(participantUsers).slice(3).map(u => u.name).join(", ")}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <span>{participants.length} Participante{participants.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  
                  {trip.availableSeats !== null && trip.availableSeats > 0 && (
                    <div className="flex items-center text-gray-600 ml-3">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{trip.availableSeats} Lugar{trip.availableSeats !== 1 ? 'es' : ''}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-2 sm:mt-0">
                  {!isHistoric ? (
                    <Link href={joinerTripId ? `/trip/${trip.id}?joiner=${joinerTripId}` : `/trip/${trip.id}`}>
                      <Button size="sm" className="rounded-full">
                        Ver Detalhes
                      </Button>
                    </Link>
                  ) : (
                    <>
                      {/* Para viagens históricas, mostrar distintivo de viagem concluída */}
                      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 flex items-center gap-1 mr-2">
                        <Calendar className="h-3.5 w-3.5" />
                        Viagem Concluída
                      </Badge>
                      
                      <Link href={`/trip/${trip.id}`}>
                        <Button size="sm" variant="outline" className="rounded-full">
                          Ver Histórico
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de confirmação para exclusão */}
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
              disabled={deleteTrip.isPending || isLoading}
            >
              {deleteTrip.isPending ? "A eliminar..." : "Sim, eliminar viagem"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Trip Modal */}
      {isEditModalOpen && (
        <EditTripModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          trip={trip}
        />
      )}
    </>
  );
}