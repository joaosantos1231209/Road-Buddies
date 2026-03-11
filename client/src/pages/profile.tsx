import { useState, useEffect } from "react";
import { MobileHeader, MobileFooter, MobileNavSpacer } from "@/components/navigation/MobileNav";
import Sidebar from "@/components/navigation/Sidebar";
import { User, Mail, MapPin, Car, Calendar, Phone, Edit, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { updateUserProfile } from "@/lib/firebase";
import { format } from "date-fns";

// Default user data (will be replaced with real data when loaded)
const defaultUserData = {
  id: 0,
  username: "", // Added username field
  name: "Carregando...",
  email: "carregando@example.com",
  phone: "",
  location: "Portugal",
  about: "",
  avatar: undefined,
  memberSince: "Agora",
  totalTrips: 0,
  rating: 0,
};

// Initial empty stats, will be populated with real data in the future
const emptyTripStats = [
  { label: "Viagens Criadas", value: 0 },
  { label: "Viagens Concluídas", value: 0 },
  { label: "Pessoas Transportadas", value: 0 },
  { label: "Kms Partilhados", value: "0" },
];

export default function Profile() {
  const { toast } = useToast();
  const { currentUser: firebaseUser, isAuthenticated, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(defaultUserData);
  const [profileData, setProfileData] = useState({
    name: defaultUserData.name,
    email: defaultUserData.email,
    phone: defaultUserData.phone,
    location: defaultUserData.location,
    about: defaultUserData.about,
  });
  const [preferenceData, setPreferenceData] = useState({
    vehicle: "",
    seats: "4",
    // Campos de horário removidos conforme solicitado
    preferences: [] as string[],
    rules: [] as string[],
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  // Fetch user data from backend when component mounts
  useEffect(() => {
    async function fetchUserData() {
      if (!isAuthenticated || !firebaseUser) return;
      
      try {
        // Get the user data from the backend
        const user = await apiRequest(`/api/users/by-firebase-id/${firebaseUser.uid}`);
        
        if (user) {
          // Create the user data object
          const newUserData = {
            id: user.id,
            username: user.username || "", // Add username
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            location: user.location || "Portugal",
            about: user.about || "",
            avatar: user.avatar,
            memberSince: user.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : "Recentemente",
            totalTrips: 0, // We'll update this in future
            rating: 0, // We'll update this in future
          };
          
          // Update the state
          setUserData(newUserData);
          setProfileData({
            name: newUserData.name,
            email: newUserData.email,
            phone: newUserData.phone,
            location: newUserData.location,
            about: newUserData.about,
          });
          
          // Update preference data with values from the database
          // Ensure arrays are properly handled
          let preferences = [];
          let rules = [];
          
          if (user.travelPreferences) {
            try {
              preferences = typeof user.travelPreferences === 'string' 
                ? JSON.parse(user.travelPreferences) 
                : user.travelPreferences;
            } catch (e) {
              console.warn("Could not parse travel preferences:", e);
            }
          }
          
          if (user.travelRules) {
            try {
              rules = typeof user.travelRules === 'string' 
                ? JSON.parse(user.travelRules) 
                : user.travelRules;
            } catch (e) {
              console.warn("Could not parse travel rules:", e);
            }
          }
          
          setPreferenceData({
            vehicle: user.vehicle || "",
            seats: user.vehicleSeats?.toString() || "4",
            // Campos de horário removidos conforme solicitado
            preferences: Array.isArray(preferences) ? preferences : [],
            rules: Array.isArray(rules) ? rules : []
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do utilizador.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserData();
  }, [isAuthenticated, firebaseUser, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      if (!userData.id) {
        toast({
          title: "Erro",
          description: "Não foi possível identificar o utilizador.",
          variant: "destructive",
        });
        return;
      }
      
      // Convert avatar file to base64 if exists, resize and crop to square (500x500)
      // Usamos qualquer para evitar problemas de tipagem
      let avatarUrl: any = userData.avatar;
      if (avatarFile) {
        avatarUrl = await new Promise<string>((resolve) => {
          const img = new Image();
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const reader = new FileReader();
          
          reader.onload = (e) => {
            img.onload = () => {
              // Set canvas size to 500x500 (desired output size)
              canvas.width = 500;
              canvas.height = 500;
              
              // Calculate dimensions for cropping the image to a square
              const size = Math.min(img.width, img.height);
              const x = (img.width - size) / 2;
              const y = (img.height - size) / 2;
              
              // Draw a filled white background (in case of transparent images)
              ctx!.fillStyle = 'white';
              ctx!.fillRect(0, 0, canvas.width, canvas.height);
              
              // Draw the image to the canvas, cropping to a square and resizing
              ctx!.drawImage(
                img, 
                x, y, size, size, // Source coordinates (cropped square area)
                0, 0, 500, 500    // Destination coordinates (output size)
              );
              
              // Convert the canvas to data URL
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              resolve(dataUrl);
            };
            
            img.src = e.target!.result as string;
          };
          
          reader.readAsDataURL(avatarFile);
        });
      }
      
      const updatedUserData = {
        ...profileData,
        username: userData.username, // Preserve the username
        avatar: avatarUrl
      };
      
      const updatedUser = await apiRequest(`/api/users/${userData.id}`, 'PATCH', updatedUserData);
        
      // Update the Firebase user profile with our new helper function
      try {
        await updateUserProfile(profileData.name, avatarUrl);
        console.log("Firebase user profile updated successfully");
      } catch (firebaseError) {
        console.error("Error updating Firebase profile:", firebaseError);
        // We'll still continue with the local update even if Firebase update fails
      }
      
      toast({
        title: "Perfil atualizado",
        description: "As suas informações foram atualizadas com sucesso.",
      });
      
      // Update local user data with data from server
      setUserData(prev => ({
        ...prev,
        name: updatedUser.name,
        username: updatedUser.username, // Keep username from server
        email: updatedUser.email,
        phone: updatedUser.phone || "",
        location: updatedUser.location || "Portugal",
        about: updatedUser.about || "",
        avatar: updatedUser.avatar
      }));
      
      // Also update profile data
      setProfileData({
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || "",
        location: updatedUser.location || "Portugal",
        about: updatedUser.about || "",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  const handlePreferenceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPreferenceData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSavePreferences = async () => {
    try {
      if (!userData.id) {
        toast({
          title: "Erro",
          description: "Não foi possível identificar o utilizador.",
          variant: "destructive",
        });
        return;
      }
      
      // Prepare preferences data for saving
      // Make sure arrays are stored as JSON strings
      const updatedPreferences = {
        vehicle: preferenceData.vehicle,
        vehicleSeats: preferenceData.seats ? parseInt(preferenceData.seats) : null,
        // Campos de horário removidos conforme solicitado
        departureTime: null, // Definindo como null para limpar valores anteriores
        returnTime: null, // Definindo como null para limpar valores anteriores
        travelPreferences: Array.isArray(preferenceData.preferences) 
          ? JSON.stringify(preferenceData.preferences) 
          : "[]",
        travelRules: Array.isArray(preferenceData.rules) 
          ? JSON.stringify(preferenceData.rules) 
          : "[]"
      };
      
      const updatedUser = await apiRequest(`/api/users/${userData.id}`, 'PATCH', updatedPreferences);
      
      toast({
        title: "Preferências atualizadas",
        description: "As suas preferências de viagem foram atualizadas com sucesso.",
      });
      
      // Process preferences and rules from the response
      let preferences = [];
      let rules = [];
      
      if (updatedUser.travelPreferences) {
        try {
          preferences = typeof updatedUser.travelPreferences === 'string' 
            ? JSON.parse(updatedUser.travelPreferences) 
            : updatedUser.travelPreferences;
        } catch (e) {
          console.warn("Could not parse travel preferences:", e);
        }
      }
      
      if (updatedUser.travelRules) {
        try {
          rules = typeof updatedUser.travelRules === 'string' 
            ? JSON.parse(updatedUser.travelRules) 
            : updatedUser.travelRules;
        } catch (e) {
          console.warn("Could not parse travel rules:", e);
        }
      }
      
      // Update local user data with server response
      setUserData(prev => ({
        ...prev,
        vehicle: updatedUser.vehicle || "",
        vehicleSeats: updatedUser.vehicleSeats,
        // Campos de horário removidos conforme solicitado
        travelPreferences: updatedUser.travelPreferences,
        travelRules: updatedUser.travelRules
      }));
      
      // Update preference data
      setPreferenceData({
        vehicle: updatedUser.vehicle || "",
        seats: updatedUser.vehicleSeats?.toString() || "4",
        // Campos de horário removidos conforme solicitado
        preferences: Array.isArray(preferences) ? preferences : [],
        rules: Array.isArray(rules) ? rules : []
      });
      
      setIsEditingPreferences(false);
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as preferências. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Sessão terminada",
        description: "A sua sessão foi encerrada com sucesso.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao terminar a sessão. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
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
        
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Perfil</h1>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Left Column - Profile Summary */}
              <div className="md:col-span-1">
                <Card>
                  <CardContent className="pt-6">
                    {isLoading ? (
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="rounded-full bg-gray-200 h-24 w-24 mb-4"></div>
                        <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className={`relative ${isEditing ? "group" : ""}`}>
                          <Avatar className="h-24 w-24">
                            <AvatarImage 
                              src={avatarFile ? URL.createObjectURL(avatarFile) : userData.avatar} 
                              alt={userData.name}
                              className={isEditing ? "cursor-pointer group-hover:opacity-75 transition-opacity" : ""}
                            />
                            <AvatarFallback>{getInitials(userData.name)}</AvatarFallback>
                          </Avatar>
                          {/* O botão de edição do avatar só aparece quando já estamos em modo de edição */}
                          {isEditing && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Label 
                                htmlFor="avatar-upload" 
                                className="bg-black bg-opacity-50 text-white p-1 rounded-full cursor-pointer"
                              >
                                <Edit className="h-5 w-5" />
                              </Label>
                              <Input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setAvatarFile(e.target.files[0]);
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <h2 className="mt-4 text-xl font-semibold">{userData.name}</h2>
                        <p className="text-gray-500">{userData.location}</p>
                        
                        <div className="mt-6 w-full">
                          <div className="flex items-center justify-between">
                            <div className="text-center">
                              <p className="text-2xl font-bold">{userData.totalTrips}</p>
                              <p className="text-sm text-gray-500">Viagens</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold">{userData.rating || "-"}</p>
                              <p className="text-sm text-gray-500">Avaliação</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 w-full">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Membro desde:</span> {userData.memberSince}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {emptyTripStats.map((stat, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <p className="text-sm text-gray-600">{stat.label}</p>
                          <p className="font-semibold">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Column - Profile Details */}
              <div className="md:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Informações Pessoais</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? (
                        <Save className="h-4 w-4" />
                      ) : (
                        <Edit className="h-4 w-4" />
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label htmlFor="name">Nome</Label>
                            <div className="flex items-center mt-1">
                              <User className="h-4 w-4 text-gray-500 mr-2" />
                              <Input
                                id="name"
                                name="name"
                                value={profileData.name}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <div className="flex items-center mt-1">
                              <Mail className="h-4 w-4 text-gray-500 mr-2" />
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                value={profileData.email}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="phone">Telefone</Label>
                            <div className="flex items-center mt-1">
                              <Phone className="h-4 w-4 text-gray-500 mr-2" />
                              <Input
                                id="phone"
                                name="phone"
                                value={profileData.phone}
                                onChange={(e) => {
                                  // Aceitar apenas números e o sinal "+"
                                  const value = e.target.value;
                                  if (/^[0-9+]*$/.test(value) || value === '') {
                                    handleInputChange(e);
                                  }
                                }}
                                placeholder="+351 900000000"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="location">Localização</Label>
                            <div className="flex items-center mt-1">
                              <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                              <Input
                                id="location"
                                name="location"
                                value={profileData.location}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="about">Sobre</Label>
                            <div className="flex items-start mt-1">
                              <textarea
                                id="about"
                                name="about"
                                value={profileData.about}
                                onChange={handleInputChange}
                                className="flex-1 min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button onClick={handleSaveProfile}>
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Alterações
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Nome</p>
                            <p className="font-medium">{profileData.name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{profileData.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Telefone</p>
                            <p className="font-medium">{profileData.phone}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Localização</p>
                            <p className="font-medium">{profileData.location}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Sobre</p>
                          <p className="text-sm">{profileData.about}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Preferências de Viagem</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditingPreferences(!isEditingPreferences)}
                    >
                      {isEditingPreferences ? (
                        <Save className="h-4 w-4" />
                      ) : (
                        <Edit className="h-4 w-4" />
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="driver">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="driver" className="flex items-center">
                          <Car className="h-4 w-4 mr-2" />
                          Condutor
                        </TabsTrigger>
                        <TabsTrigger value="passenger" className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Passageiro
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="driver" className="pt-4">
                        {isEditingPreferences ? (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="vehicle">Veículo</Label>
                              <Input
                                id="vehicle"
                                name="vehicle"
                                placeholder="Ex: Renault Clio, 2018"
                                value={preferenceData.vehicle}
                                onChange={handlePreferenceInputChange}
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="seats">Lugares Disponíveis</Label>
                              <Input
                                id="seats"
                                name="seats"
                                type="number"
                                min="1"
                                max="9"
                                placeholder="Ex: 4"
                                value={preferenceData.seats}
                                onChange={handlePreferenceInputChange}
                                className="mt-1"
                              />
                            </div>
                            
                            {/* Campos de horário removidos conforme solicitado */}
                            
                            <div>
                              <Label>Regras e Preferências</Label>
                              <div className="mt-2 flex flex-col space-y-2">
                                {preferenceData.rules.map((rule, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                      {rule}
                                    </span>
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        const newRules = [...preferenceData.rules];
                                        newRules.splice(index, 1);
                                        setPreferenceData(prev => ({
                                          ...prev,
                                          rules: newRules
                                        }));
                                      }}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                ))}
                                
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="new-rule"
                                    placeholder="Nova regra (ex: Não fumar no carro)"
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                        const newRule = e.currentTarget.value.trim();
                                        setPreferenceData(prev => ({
                                          ...prev,
                                          rules: [...prev.rules, newRule]
                                        }));
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                  />
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={(e) => {
                                      const input = document.getElementById('new-rule') as HTMLInputElement;
                                      if (input && input.value.trim()) {
                                        const newRule = input.value.trim();
                                        setPreferenceData(prev => ({
                                          ...prev,
                                          rules: [...prev.rules, newRule]
                                        }));
                                        input.value = '';
                                      }
                                    }}
                                  >
                                    Adicionar
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex justify-end">
                              <Button onClick={handleSavePreferences}>
                                <Save className="h-4 w-4 mr-2" />
                                Guardar Preferências
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center">
                              <Car className="h-5 w-5 text-gray-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-500">Veículo</p>
                                <p className="font-medium">{preferenceData.vehicle || "Não definido"}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <User className="h-5 w-5 text-gray-500 mr-3" />
                              <div>
                                <p className="text-sm text-gray-500">Lugares Disponíveis</p>
                                <p className="font-medium">{preferenceData.seats || "4"}</p>
                              </div>
                            </div>
                            
                            {/* Seção de horários removida conforme solicitado */}
                            
                            <div>
                              <p className="text-sm text-gray-500 mb-2">Regras e Preferências</p>
                              <div className="flex flex-wrap gap-2">
                                {preferenceData.rules && preferenceData.rules.length > 0 ? (
                                  preferenceData.rules.map((rule, index) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{rule}</span>
                                  ))
                                ) : (
                                  <p className="text-sm text-gray-400">Nenhuma regra definida</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="passenger" className="pt-4">
                        {isEditingPreferences ? (
                          <div className="space-y-4">
                            {/* Campo de horário removido conforme solicitado */}
                            
                            <div>
                              <Label>Preferências</Label>
                              <div className="mt-2 flex flex-col space-y-2">
                                {preferenceData.preferences.map((pref, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                      {pref}
                                    </span>
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        const newPreferences = [...preferenceData.preferences];
                                        newPreferences.splice(index, 1);
                                        setPreferenceData(prev => ({
                                          ...prev,
                                          preferences: newPreferences
                                        }));
                                      }}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                ))}
                                
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="new-preference"
                                    placeholder="Nova preferência (ex: Música calma)"
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                        const newPreference = e.currentTarget.value.trim();
                                        setPreferenceData(prev => ({
                                          ...prev,
                                          preferences: [...prev.preferences, newPreference]
                                        }));
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                  />
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={(e) => {
                                      const input = document.getElementById('new-preference') as HTMLInputElement;
                                      if (input && input.value.trim()) {
                                        const newPreference = input.value.trim();
                                        setPreferenceData(prev => ({
                                          ...prev,
                                          preferences: [...prev.preferences, newPreference]
                                        }));
                                        input.value = '';
                                      }
                                    }}
                                  >
                                    Adicionar
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex justify-end">
                              <Button onClick={handleSavePreferences}>
                                <Save className="h-4 w-4 mr-2" />
                                Guardar Preferências
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Seção de horários removida conforme solicitado */}
                            
                            <div>
                              <p className="text-sm text-gray-500 mb-2">Preferências</p>
                              <div className="flex flex-wrap gap-2">
                                {preferenceData.preferences && preferenceData.preferences.length > 0 ? (
                                  preferenceData.preferences.map((pref, index) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{pref}</span>
                                  ))
                                ) : (
                                  <p className="text-sm text-gray-400">Nenhuma preferência definida</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Avaliações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 text-center">Ainda não há avaliações disponíveis.</p>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="mt-6 mb-6">
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={handleLogout}
                  >
                    Terminar Sessão
                  </Button>
                  <MobileNavSpacer />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <MobileFooter />
    </div>
  );
}