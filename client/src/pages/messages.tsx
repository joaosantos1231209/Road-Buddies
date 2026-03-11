import { useState } from "react";
import { MobileHeader, MobileFooter, MobileNavSpacer } from "@/components/navigation/MobileNav";
import Sidebar from "@/components/navigation/Sidebar";
import { Search, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

// Mock user data
const currentUser = {
  id: 1,
  name: "João Silva",
  email: "joao@example.com",
  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
};

// Mock contacts
const mockContacts = [
  {
    id: 2,
    name: "Ana Costa",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    lastMessage: "Ainda precisas de boleia para Lisboa?",
    unread: 3,
    time: "12:30"
  },
  {
    id: 3,
    name: "Pedro Santos",
    avatar: "https://randomuser.me/api/portraits/men/44.jpg",
    lastMessage: "Vou sair às 8h, podes estar na estação?",
    unread: 0,
    time: "Ontem"
  },
  {
    id: 4,
    name: "Marta Silva",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    lastMessage: "Obrigada pela boleia, até à próxima!",
    unread: 0,
    time: "25/06"
  },
];

// Mock conversation
const mockConversation = [
  {
    id: 1,
    senderId: 2,
    text: "Olá! Vi que vais para Lisboa na próxima semana.",
    time: "11:30"
  },
  {
    id: 2,
    senderId: 1,
    text: "Olá Ana! Sim, vou na segunda-feira de manhã.",
    time: "11:32"
  },
  {
    id: 3,
    senderId: 2,
    text: "Perfeito! Ainda precisas de boleia ou já tens transporte?",
    time: "11:35"
  },
  {
    id: 4,
    senderId: 2,
    text: "Eu vou de carro e tenho 2 lugares disponíveis.",
    time: "11:36"
  },
  {
    id: 5,
    senderId: 1,
    text: "Que ótimo! Ainda estou à procura de transporte. A que horas sais?",
    time: "11:40"
  },
  {
    id: 6,
    senderId: 2,
    text: "Vou sair às 8h da manhã do Porto. Para ti serve?",
    time: "11:45"
  },
  {
    id: 7,
    senderId: 2,
    text: "Ainda precisas de boleia para Lisboa?",
    time: "12:30"
  },
];

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState(mockContacts[0]);
  const [newMessage, setNewMessage] = useState("");
  
  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;
    
    // In a real app, this would send the message to the server
    console.log("Sending message:", newMessage);
    setNewMessage("");
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
      <MobileHeader user={currentUser} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar user={currentUser} />
        
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Contacts List */}
          <div className="w-full md:w-80 border-r flex flex-col bg-white">
            <div className="p-4 border-b">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Pesquisar conversas..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="divide-y">
                {mockContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedContact.id === contact.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <div className="flex items-start">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contact.avatar} alt={contact.name} />
                          <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                        </Avatar>
                        {contact.unread > 0 && (
                          <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {contact.unread}
                          </span>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{contact.name}</span>
                          <span className="text-xs text-gray-500">{contact.time}</span>
                        </div>
                        <p className={`text-sm truncate ${contact.unread > 0 ? "font-medium" : "text-gray-600"}`}>
                          {contact.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          {/* Conversation */}
          <div className="flex-1 flex flex-col">
            {selectedContact ? (
              <>
                <div className="p-4 border-b bg-white flex items-center">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                    <AvatarFallback>{getInitials(selectedContact.name)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <div className="font-medium">{selectedContact.name}</div>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-4 bg-gray-50">
                  <div className="space-y-4">
                    {mockConversation.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === currentUser.id ? "justify-end" : "justify-start"}`}
                      >
                        <div className="flex items-end gap-2 max-w-[75%]">
                          {message.senderId !== currentUser.id && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                              <AvatarFallback>{getInitials(selectedContact.name)}</AvatarFallback>
                            </Avatar>
                          )}
                          <Card className={`shadow-sm ${
                            message.senderId === currentUser.id ? "bg-primary text-white" : ""
                          }`}>
                            <CardContent className="p-3">
                              <p className="text-sm">{message.text}</p>
                              <div className={`text-xs mt-1 ${
                                message.senderId === currentUser.id ? "text-blue-100" : "text-gray-500"
                              }`}>
                                {message.time}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t bg-white">
                  <div className="flex items-center">
                    <Input
                      type="text"
                      placeholder="Escreva uma mensagem..."
                      className="flex-1"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      className="ml-2" 
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={newMessage.trim() === ""}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <MobileNavSpacer />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center p-6">
                  <h3 className="text-lg font-medium">Selecione uma conversa</h3>
                  <p className="text-gray-600 mt-1">Escolha um contacto para iniciar uma conversa</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      <MobileFooter />
    </div>
  );
}
