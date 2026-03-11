import { useState, useEffect } from "react";
import { MobileHeader, MobileFooter, MobileNavSpacer } from "@/components/navigation/MobileNav";
import Sidebar from "@/components/navigation/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useCitiesWithFallback, 
  useAddCity, 
  useUpdateCity,
  useDeleteCity,
  useSeedCities
} from "@/hooks/use-cities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Plus, Pencil, Trash, MapPin, AlertTriangle, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { City } from "@shared/schema";

// Define the form schema for adding/editing cities
const cityFormSchema = z.object({
  name: z.string().min(2, "O nome da cidade deve ter pelo menos 2 caracteres"),
  lat: z.string().min(1, "A latitude é obrigatória"),
  lng: z.string().min(1, "A longitude é obrigatória"),
  isActive: z.boolean().optional().default(true),
});

type CityFormValues = z.infer<typeof cityFormSchema>;

export default function AdminCities() {
  const { currentUser, appUser } = useAuth();
  const { toast } = useToast();
  const { cities, isLoading, isFallbackActive, seedCities } = useCitiesWithFallback();
  const { mutate: addCity, isPending: isAddingCity } = useAddCity();
  const { mutate: updateCity, isPending: isUpdatingCity } = useUpdateCity();
  const { mutate: deleteCity, isPending: isDeletingCity } = useDeleteCity();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Forms for adding and editing cities
  const addForm = useForm<CityFormValues>({
    resolver: zodResolver(cityFormSchema),
    defaultValues: {
      name: "",
      lat: "",
      lng: "",
      isActive: true,
    },
  });

  const editForm = useForm<CityFormValues>({
    resolver: zodResolver(cityFormSchema),
    defaultValues: {
      name: selectedCity?.name || "",
      lat: selectedCity?.lat || "",
      lng: selectedCity?.lng || "",
    },
  });

  // Update edit form when selected city changes
  useEffect(() => {
    if (selectedCity) {
      editForm.reset({
        name: selectedCity.name,
        lat: selectedCity.lat,
        lng: selectedCity.lng,
        isActive: selectedCity.isActive,
      });
    }
  }, [selectedCity, editForm]);

  // User data for sidebar
  const userData = {
    name: appUser?.name || currentUser?.displayName || "Administrador",
    email: appUser?.email || currentUser?.email || "",
    avatar: appUser?.avatar || currentUser?.photoURL || undefined
  };

  const handleAddCity = (data: CityFormValues) => {
    addCity(data, {
      onSuccess: () => {
        toast({
          title: "Cidade adicionada",
          description: `A cidade ${data.name} foi adicionada com sucesso.`,
        });
        addForm.reset();
        setIsAddDialogOpen(false);
      },
      onError: (error) => {
        toast({
          title: "Erro ao adicionar cidade",
          description: `Ocorreu um erro ao adicionar a cidade: ${error.message}`,
          variant: "destructive",
        });
      },
    });
  };

  const handleEditCity = (data: CityFormValues) => {
    if (!selectedCity?.id) return;

    updateCity(
      { id: selectedCity.id, city: data },
      {
        onSuccess: () => {
          toast({
            title: "Cidade atualizada",
            description: `A cidade ${data.name} foi atualizada com sucesso.`,
          });
          setIsEditDialogOpen(false);
        },
        onError: (error) => {
          toast({
            title: "Erro ao atualizar cidade",
            description: `Ocorreu um erro ao atualizar a cidade: ${error.message}`,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDeleteCity = () => {
    if (!selectedCity?.id) return;

    deleteCity(selectedCity.id, {
      onSuccess: () => {
        toast({
          title: "Cidade removida",
          description: `A cidade ${selectedCity.name} foi removida com sucesso.`,
        });
        setSelectedCity(null);
        setIsDeleteDialogOpen(false);
      },
      onError: (error) => {
        toast({
          title: "Erro ao remover cidade",
          description: `Ocorreu um erro ao remover a cidade: ${error.message}`,
          variant: "destructive",
        });
      },
    });
  };

  const handleSeedCities = () => {
    seedCities(undefined, {
      onSuccess: () => {
        toast({
          title: "Cidades iniciais adicionadas",
          description: "As cidades iniciais foram adicionadas com sucesso.",
        });
      },
      onError: (error) => {
        toast({
          title: "Erro ao adicionar cidades iniciais",
          description: `Ocorreu um erro ao adicionar as cidades iniciais: ${error.message}`,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader user={userData} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar user={userData} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Gestão de Cidades</h1>
              <div className="flex gap-2">
                <Button onClick={handleSeedCities} variant="outline">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 md:mr-2" />
                  )}
                  <span className="hidden md:inline">Restaurar Cidades Iniciais</span>
                </Button>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Adicionar Cidade</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Nova Cidade</DialogTitle>
                      <DialogDescription>
                        Adicione uma nova cidade para ser usada nas viagens.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...addForm}>
                      <form onSubmit={addForm.handleSubmit(handleAddCity)} className="space-y-4">
                        <FormField
                          control={addForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome da Cidade</FormLabel>
                              <FormControl>
                                <Input placeholder="Lisboa" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={addForm.control}
                            name="lat"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Latitude</FormLabel>
                                <FormControl>
                                  <Input placeholder="38.7223" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={addForm.control}
                            name="lng"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Longitude</FormLabel>
                                <FormControl>
                                  <Input placeholder="-9.1393" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={addForm.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Status da Cidade</FormLabel>
                                <FormDescription>
                                  Cidades inativas não aparecerão nos formulários de viagem.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={isAddingCity}>
                            {isAddingCity ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Adicionar
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {isFallbackActive && (
              <Alert className="mb-6 border-amber-500 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertTitle>Modo Offline</AlertTitle>
                <AlertDescription>
                  A aplicação está usando a lista estática de cidades devido a problemas de conexão com o banco de dados. 
                  As alterações feitas podem não ser salvas até que a conexão seja restaurada.
                </AlertDescription>
              </Alert>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Lista de Cidades</CardTitle>
                <CardDescription>
                  Cidades disponíveis para seleção nos formulários de viagem.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Latitude</TableHead>
                        <TableHead>Longitude</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cities.map((city) => (
                        <TableRow key={city.id} className={!city.isActive ? "opacity-50" : ""}>
                          <TableCell className="font-medium">{city.name}</TableCell>
                          <TableCell>{city.lat}</TableCell>
                          <TableCell>{city.lng}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {city.isActive ? (
                                <span className="inline-flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  Ativa
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-gray-400">
                                  <XCircle className="h-4 w-4" />
                                  Inativa
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCity(city);
                                  editForm.reset({
                                    name: city.name,
                                    lat: city.lat,
                                    lng: city.lng,
                                    isActive: city.isActive,
                                  });
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCity(city);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
              <MobileNavSpacer />
            </Card>
          </div>

          {/* Edit City Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Cidade</DialogTitle>
                <DialogDescription>
                  Atualize as informações da cidade selecionada.
                </DialogDescription>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleEditCity)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="lat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="lng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Status da Cidade</FormLabel>
                          <FormDescription>
                            Cidades inativas não aparecerão nos formulários de viagem.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isUpdatingCity}>
                      {isUpdatingCity ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Salvar Alterações
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Delete City Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remover Cidade</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja remover esta cidade? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center p-4 bg-gray-50 rounded-md">
                <MapPin className="h-6 w-6 mr-3 text-gray-500" />
                <div>
                  <h3 className="font-medium">{selectedCity?.name}</h3>
                  <p className="text-sm text-gray-500">
                    Coordenadas: {selectedCity?.lat}, {selectedCity?.lng}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteCity}
                  disabled={isDeletingCity}
                >
                  {isDeletingCity ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Remover Cidade
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
      <MobileFooter />
    </div>
  );
}