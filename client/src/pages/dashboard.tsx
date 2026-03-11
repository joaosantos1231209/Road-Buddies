import { useState, useEffect, useRef } from "react";
import { Trip } from "@shared/schema";
import { useTrips } from "@/hooks/use-trips";
import { Filter, ListFilter, RefreshCw } from "lucide-react";
import { MobileHeader, MobileFooter, MobileNavSpacer } from "@/components/navigation/MobileNav";
import Sidebar from "@/components/navigation/Sidebar";
import MapView from "@/components/map/MapView";
import TripCard from "@/components/trips/TripCard";
import CreateTripModal from "@/components/trips/CreateTripModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Component to fetch trip owner's data and display the trip card
function TripOwnerProvider({ userId, trip }: { userId: number, trip: Trip }) {
  const [ownerData, setOwnerData] = useState({
    name: "Carregando...",
    avatar: undefined
  });
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser: firebaseUser } = useAuth();
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);
  
  // Obter o ID do usuário atual - vai ser usado para determinar quais viagens
  // devem mostrar o badge de match
  useEffect(() => {
    if (firebaseUser) {
      apiRequest(`/api/users/by-firebase-id/${firebaseUser.uid}`)
        .then(data => {
          if (data && data.id) {
            setCurrentUserId(data.id);
          }
        })
        .catch(error => {
          console.error("Error fetching current user data:", error);
        });
    }
  }, [firebaseUser]);
  
  useEffect(() => {
    async function fetchOwnerData() {
      try {
        setIsLoading(true);
        const user = await apiRequest(`/api/users/${userId}`);
        
        if (user) {
          setOwnerData({
            name: user.name || user.username,
            avatar: user.avatar
          });
        }
      } catch (error) {
        console.error("Error fetching trip owner data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchOwnerData();
  }, [userId]);
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100 p-4">
        <div className="flex items-start">
          <Skeleton className="h-12 w-12 rounded-full mr-4" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <TripCard 
      trip={trip} 
      user={ownerData}
      currentUserId={currentUserId}
    />
  );
}

export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Configurando a verificação periódica e filtrando apenas viagens atuais/futuras 
  const { data: trips, isLoading, dataUpdatedAt } = useTrips({ 
    includeExpired: false, // exclui viagens passadas
    refetchInterval: 30000 
  });
  const { currentUser: firebaseUser } = useAuth();
  const [userData, setUserData] = useState({
    id: 0,
    name: "Carregando...",
    email: "",
    avatar: undefined
  });
  
  // Estado para controlar a notificação de novas viagens
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [tripCount, setTripCount] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Efeito para detectar novas viagens
  useEffect(() => {
    // Só executa após a primeira carga de dados
    if (!isLoading && trips) {
      // Se já tínhamos um count anterior, podemos comparar
      if (tripCount !== null) {
        const currentCount = trips.length;
        
        // Se temos mais viagens do que antes
        if (currentCount > tripCount) {
          const newTripsCount = currentCount - tripCount;
          
          // Mostra notificação de novas viagens
          toast({
            title: `${newTripsCount} ${newTripsCount === 1 ? 'nova viagem disponível' : 'novas viagens disponíveis'}`,
            description: "Novas oportunidades de viagem foram adicionadas",
            variant: "default",
          });
        }
      }
      
      // Atualiza a contagem de viagens atual
      setTripCount(trips.length);
      setLastUpdateTime(Date.now());
    }
  }, [trips, isLoading, dataUpdatedAt]);
  
  // Fetch user data when component mounts
  useEffect(() => {
    async function fetchUserData() {
      if (!firebaseUser) return;
      
      try {
        const user = await apiRequest(`/api/users/by-firebase-id/${firebaseUser.uid}`);
        
        if (user) {
          setUserData({
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }
    
    fetchUserData();
  }, [firebaseUser]);

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader user={{
        avatar: userData.avatar
      }} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar user={{
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar
        }} />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Map Area removed as requested */}

            {/* Ride Info Section */}
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="max-w-4xl mx-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-xl">Próximas Viagens</h2>
                  <div className="flex space-x-2">
                    {/* Botão atualizar escondido por enquanto 
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-gray-700 h-9"
                      onClick={() => {
                        // Forçar atualização manual
                        setLastUpdateTime(Date.now());
                        // Aqui usaríamos queryClient.invalidateQueries para forçar atualização
                        // mas estamos usando o refetch automático então não é necessário
                        toast({
                          title: "Verificando novas viagens",
                          description: "A lista está sendo atualizada...",
                          variant: "default",
                        });
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Atualizar
                    </Button>
                    */}
                    {/* Botões de filtrar e ordenar removidos conforme solicitado */}
                  </div>
                </div>
                <div className="mb-2 text-sm text-gray-600 italic">
                  {/* Mostrando apenas viagens atuais e futuras, ordenadas por data mais próxima */}
                </div>

                {/* Trip Cards */}
                <div className="space-y-4">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
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
                  ) : trips && trips.length > 0 ? (
                    // Ordenar as viagens por data mais próxima primeiro
                    [...trips]
                      .sort((a, b) => {
                        const dateA = new Date(a.startDate);
                        const dateB = new Date(b.startDate);
                        return dateA.getTime() - dateB.getTime();
                      })
                      .map((trip) => (
                        <TripOwnerProvider 
                          key={trip.id} 
                          userId={trip.userId} 
                          trip={trip} 
                        />
                      ))
                  ) : (
                    <div className="text-center py-10">
                      <h3 className="text-lg font-medium text-gray-900">Nenhuma viagem disponível</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Crie uma nova necessidade de viagem para começar.
                      </p>
                      <div className="mt-6">
                        <Button 
                          onClick={() => setIsCreateModalOpen(true)}
                          className="rounded-full"
                        >
                          Criar Viagem
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <MobileNavSpacer />
              </div>
            </div>
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
