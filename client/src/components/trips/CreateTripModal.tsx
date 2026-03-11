import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Map, MapPin, Calendar, CarFront, Users, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTrip } from "@/hooks/use-trips";
import { useCitiesWithFallback } from "@/hooks/use-cities";
import { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Extend the insertTripSchema from shared/schema.ts
const createTripSchema = z.object({
  userId: z.number(),
  originName: z.string().min(1, "Origem é obrigatória"),
  originLat: z.string(),
  originLng: z.string(),
  originRadius: z.number().min(0).max(30),
  destinationName: z.string().min(1, "Destino é obrigatório"),
  destinationLat: z.string(),
  destinationLng: z.string(),
  destinationRadius: z.number().min(0).max(30),
  startDate: z.date(),
  endDate: z.date().optional(),
  departureTime: z.string().optional(),
  // Comentamos temporariamente o status FLEXIBLE
  status: z.enum(["PROVIDER", /* "FLEXIBLE", */ "NEEDRIDE"]),
  availableSeats: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

type CreateTripFormValues = z.infer<typeof createTripSchema>;

export default function CreateTripModal({ isOpen, onClose }: CreateTripModalProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [userId, setUserId] = useState<number | null>(null);
  const [defaultSeats, setDefaultSeats] = useState<number>(4); // Default value if not found in profile
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined,
  });
  
  // Fetch cities from database with fallback
  const { cities, isLoading: isLoadingCities } = useCitiesWithFallback();
  
  const createTripMutation = useCreateTrip();
  
  const form = useForm<CreateTripFormValues>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      userId: 0, // Will be updated when user data is fetched
      originName: "",
      originLat: "",
      originLng: "",
      originRadius: 2,
      destinationName: "",
      destinationLat: "",
      destinationLng: "",
      destinationRadius: 3,
      startDate: new Date(),
      departureTime: "",
      status: "NEEDRIDE" as const,
      notes: "",
    },
  });
  
  // Fetch current user data from backend when Firebase auth state changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.uid) {
        try {
          const userData = await apiRequest(`/api/users/by-firebase-id/${currentUser.uid}`);
          if (userData && userData.id) {
            setUserId(userData.id);
            // Update the form with the correct user ID
            form.setValue('userId', userData.id);
            
            // Get default seats from user profile if available
            if (userData.vehicleSeats) {
              setDefaultSeats(userData.vehicleSeats);
            }
          }
        } catch (error) {
          console.error('Error fetching user data for trip creation:', error);
          toast({
            title: "Erro ao obter dados do utilizador",
            description: "Não foi possível obter o ID do utilizador para criar a viagem.",
            variant: "destructive",
          });
        }
      }
    };
    
    fetchUserData();
  }, [currentUser, toast, form]);
  
  const selectedStatus = form.watch("status");
  
  // Set default seats and handle date range changes when status changes
  useEffect(() => {
    if (selectedStatus === "PROVIDER") {
      // Set default seats
      form.setValue('availableSeats', defaultSeats);
      
      // Force single date selection for PROVIDER (remove end date)
      if (dateRange?.to) {
        setDateRange({
          from: dateRange.from,
          to: undefined
        });
      }
    }
  }, [selectedStatus, defaultSeats, form, dateRange]);
  
  function onSubmit(data: CreateTripFormValues) {
    // Add date range
    if (dateRange?.from) {
      data.startDate = dateRange.from;
      data.endDate = dateRange.to;
    }
    
    createTripMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Viagem criada com sucesso!",
          description: "A sua necessidade de viagem foi registada.",
        });
        onClose();
        form.reset();
      },
      onError: (error) => {
        toast({
          title: "Erro ao criar viagem",
          description: String(error),
          variant: "destructive",
        });
      }
    });
  }
  
  function selectCity(type: 'origin' | 'destination', city: { name: string; lat: string; lng: string }) {
    if (type === 'origin') {
      form.setValue('originName', city.name);
      form.setValue('originLat', city.lat);
      form.setValue('originLng', city.lng);
    } else {
      form.setValue('destinationName', city.name);
      form.setValue('destinationLat', city.lat);
      form.setValue('destinationLng', city.lng);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Criar Necessidade de Viagem</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Vehicle Status - Movido para o início do formulário */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Status da Viatura</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 gap-3 mt-2"
                    >
                      <div className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-primary cursor-pointer">
                        <RadioGroupItem 
                          value="PROVIDER" 
                          id="provider" 
                          className="text-primary focus:ring-primary"
                        />
                        <Label htmlFor="provider" className="ml-3 cursor-pointer flex-1">
                          <span className="block font-medium">Levo a viatura</span>
                          <span className="text-sm text-gray-600">Posso dar boleia a outros utilizadores</span>
                        </Label>
                      </div>
                      
                      {/* Opção FLEXIBLE comentada temporariamente
                      <div className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-primary cursor-pointer">
                        <RadioGroupItem 
                          value="FLEXIBLE" 
                          id="flexible" 
                          className="text-primary focus:ring-primary"
                        />
                        <Label htmlFor="flexible" className="ml-3 cursor-pointer flex-1">
                          <span className="block font-medium">Posso levar viatura se necessário</span>
                          <span className="text-sm text-gray-600">Flexível para conduzir ou ser passageiro</span>
                        </Label>
                      </div>
                      */}
                      
                      <div className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-primary cursor-pointer">
                        <RadioGroupItem 
                          value="NEEDRIDE" 
                          id="needride" 
                          className="text-primary focus:ring-primary"
                        />
                        <Label htmlFor="needride" className="ml-3 cursor-pointer flex-1">
                          <span className="block font-medium">Não tenho viatura</span>
                          <span className="text-sm text-gray-600">Preciso de boleia</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional fields based on vehicle status - Movido para logo após status */}
            {/* Deixamos apenas o status PROVIDER, já que FLEXIBLE foi temporariamente removido */}
            {(selectedStatus === "PROVIDER" /* || selectedStatus === "FLEXIBLE" */) && (
              <FormField
                control={form.control}
                name="availableSeats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Lugares Disponíveis</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString() || defaultSeats.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o número de lugares" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 lugar</SelectItem>
                        <SelectItem value="2">2 lugares</SelectItem>
                        <SelectItem value="3">3 lugares</SelectItem>
                        <SelectItem value="4">4 lugares</SelectItem>
                        <SelectItem value="5">5+ lugares</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Origins and Destinations */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="originName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Origem</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o local de partida" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.filter(city => city.isActive).map(city => (
                          <SelectItem key={city.id} value={city.name}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Opção de raio temporariamente comentada
                    <div className="mt-2 flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name="originRadius"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <Slider
                              value={[field.value]}
                              min={0}
                              max={20}
                              step={1}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                            <div className="text-sm text-gray-600">Raio: {field.value} km</div>
                          </FormItem>
                        )}
                      />
                    </div>
                    */}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destinationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Destino</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o local de chegada" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.filter(city => city.isActive).map(city => (
                          <SelectItem key={city.id} value={city.name}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Opção de raio temporariamente comentada
                    <div className="mt-2 flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name="destinationRadius"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <Slider
                              value={[field.value]}
                              min={0}
                              max={20}
                              step={1}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                            <div className="text-sm text-gray-600">Raio: {field.value} km</div>
                          </FormItem>
                        )}
                      />
                    </div>
                    */}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Selection & Departure Time */}
            <div>
              <FormLabel className="font-medium">Data da Viagem</FormLabel>
              
              {/* Escolha condicional entre DatePicker e DateRangePicker baseada no tipo de viagem */}
              {selectedStatus === "PROVIDER" ? (
                <>
                  <DatePicker
                    date={dateRange?.from}
                    onDateChange={(date) => setDateRange({
                      from: date,
                      to: undefined
                    })}
                    className="mt-1"
                  />
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Viagens com viatura permitem apenas uma data específica
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    className="mt-1"
                  />
                  <div className="mt-2">
                    <Label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded text-primary focus:ring-primary" 
                        checked={!!dateRange?.to}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDateRange({
                              from: dateRange?.from || new Date(),
                              to: new Date(new Date().setDate(new Date().getDate() + 1))
                            });
                          } else {
                            setDateRange({
                              from: dateRange?.from || new Date(),
                              to: undefined
                            });
                          }
                        }}
                      />
                      <span className="ml-2 text-sm text-gray-700">Tenho flexibilidade de datas</span>
                    </Label>
                  </div>
                </>
              )}
              
              {/* Hora de Saída com novo TimePicker */}
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="departureTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Hora de Saída</FormLabel>
                      <FormControl>
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecionar hora de partida"
                        />
                      </FormControl>
                      <div className="text-xs text-gray-500 mt-1">
                        Indique a hora prevista de partida (opcional)
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>



            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre a viagem..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createTripMutation.isPending}
              >
                {createTripMutation.isPending ? "A criar..." : "Criar Viagem"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}