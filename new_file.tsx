import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Map, MapPin, Calendar, CarFront, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTrip } from "@/hooks/use-trips";
import { TRIP_STATUS, PORTUGAL_CITIES } from "@/lib/constants";
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
  status: z.enum(["PROVIDER", "FLEXIBLE", "NEEDRIDE"]),
  availableSeats: z.number().min(1).max(10).optional(),
  price: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type CreateTripFormValues = z.infer<typeof createTripSchema>;

export default function CreateTripModal({ isOpen, onClose }: CreateTripModalProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [userId, setUserId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined,
  });
  
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
      status: TRIP_STATUS.NEEDRIDE,
      notes: "",
    },
  });
  
  // Fetch current user data from backend when Firebase auth state changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.uid) {
        try {
          const response = await apiRequest('GET', `/api/users/by-firebase-id/${currentUser.uid}`);
          const userData = await response.json();
          if (userData && userData.id) {
            setUserId(userData.id);
            // Update the form with the correct user ID
            form.setValue('userId', userData.id);
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
      originName: "",
      originLat: "",
      originLng: "",
      originRadius: 2,
      destinationName: "",
      destinationLat: "",
      destinationLng: "",
      destinationRadius: 3,
      startDate: new Date(),
      status: TRIP_STATUS.NEEDRIDE,
      notes: "",
    },
  });
  
  const selectedStatus = form.watch("status");
  
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
  
  function selectCity(type: 'origin' | 'destination', city: typeof PORTUGAL_CITIES[0]) {
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
            {/* Origins and Destinations */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="originName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Origem</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Localização de partida"
                            {...field}
                            className="pl-4 pr-10"
                            list="originCities"
                          />
                          <MapPin className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                          <datalist id="originCities">
                            {PORTUGAL_CITIES.map(city => (
                              <option key={city.name} value={city.name} />
                            ))}
                          </datalist>
                        </div>
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const city = PORTUGAL_CITIES.find(c => c.name === field.value) || 
                                       PORTUGAL_CITIES[0];
                          selectCity('origin', city);
                        }}
                      >
                        <Map className="h-4 w-4" />
                      </Button>
                    </div>
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
                    <div className="flex gap-2">
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Localização de chegada"
                            {...field}
                            className="pl-4 pr-10"
                            list="destinationCities"
                          />
                          <MapPin className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                          <datalist id="destinationCities">
                            {PORTUGAL_CITIES.map(city => (
                              <option key={city.name} value={city.name} />
                            ))}
                          </datalist>
                        </div>
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const city = PORTUGAL_CITIES.find(c => c.name === field.value) || 
                                       PORTUGAL_CITIES[1];
                          selectCity('destination', city);
                        }}
                      >
                        <Map className="h-4 w-4" />
                      </Button>
                    </div>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Range */}
            <div>
              <FormLabel className="font-medium">Data da Viagem</FormLabel>
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
            </div>

            {/* Vehicle Status */}
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
                          value={TRIP_STATUS.PROVIDER} 
                          id="provider" 
                          className="text-primary focus:ring-primary"
                        />
                        <Label htmlFor="provider" className="ml-3 cursor-pointer flex-1">
                          <span className="block font-medium">Levo a viatura de certeza</span>
                          <span className="text-sm text-gray-600">Posso dar boleia a outros utilizadores</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-primary cursor-pointer">
                        <RadioGroupItem 
                          value={TRIP_STATUS.FLEXIBLE} 
                          id="flexible" 
                          className="text-primary focus:ring-primary"
                        />
                        <Label htmlFor="flexible" className="ml-3 cursor-pointer flex-1">
                          <span className="block font-medium">Posso levar viatura se necessário</span>
                          <span className="text-sm text-gray-600">Flexível para conduzir ou ser passageiro</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-primary cursor-pointer">
                        <RadioGroupItem 
                          value={TRIP_STATUS.NEEDRIDE} 
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

            {/* Conditional fields based on vehicle status */}
            {(selectedStatus === TRIP_STATUS.PROVIDER || selectedStatus === TRIP_STATUS.FLEXIBLE) && (
              <FormField
                control={form.control}
                name="availableSeats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Lugares Disponíveis</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString() || "1"}
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

            {selectedStatus === TRIP_STATUS.PROVIDER && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Preço por Pessoa (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedStatus === TRIP_STATUS.NEEDRIDE && (
              <FormField
                control={form.control}
                name="maxPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Preço Máximo que Pretende Pagar (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
