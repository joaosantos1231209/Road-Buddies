import { useLocation, Link } from "wouter";
import { Search, Bell, Home, Clock, MessageSquare, User, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { APP_NAME } from "@/lib/constants";

interface MobileNavProps {
  user: {
    name?: string;
    email?: string;
    avatar?: string | undefined;
  };
}

export function MobileHeader({ user }: MobileNavProps) {
  return (
    <header className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
      <Link href="/" className="flex items-center space-x-2">
        <img
          src="/logo.png"
          alt={`${APP_NAME} Logo`}
          className="h-8 w-8"
        />
        <h1 className="font-semibold text-lg">{APP_NAME}</h1>
      </Link>
      <div className="flex items-center space-x-3">
        {/* Search button removed as requested */}
        {/* <button className="text-gray-500">
          <Bell className="h-6 w-6" />
        </button> */}
        <Link href="/profile" className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-full w-full p-1 text-gray-500" />
          )}
        </Link>
      </div>
    </header>
  );
}

// Adicionando espaço para o menu inferior
export function MobileNavSpacer() {
  return <div className="md:hidden h-16"></div>;
}

export function MobileFooter() {
  const [location] = useLocation();
  const { appUser } = useAuth();
  
  // Helper function to determine if a link is active
  const isActive = (path: string) => location === path;
  
  return (
    <nav className="md:hidden bg-white border-t flex items-center justify-around py-2 fixed bottom-0 left-0 right-0 z-50 shadow-md">
      <Link href="/">
        <div className={`flex flex-col items-center p-1 ${isActive("/") ? "text-primary" : "text-gray-500"}`}>
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Próximas</span>
        </div>
      </Link>
      <Link href="/my-trips">
        <div className={`flex flex-col items-center p-1 ${isActive("/my-trips") ? "text-primary" : "text-gray-500"}`}>
          <Clock className="h-6 w-6" />
          <span className="text-xs mt-1">Minhas</span>
        </div>
      </Link>
      {/* Messages link removed as requested */}
      <Link href="/profile">
        <div className={`flex flex-col items-center p-1 ${isActive("/profile") ? "text-primary" : "text-gray-500"}`}>
          <User className="h-6 w-6" />
          <span className="text-xs mt-1">Perfil</span>
        </div>
      </Link>
      
      {/* Admin item - only visible to admin users */}
      {appUser?.isAdmin && (
        <Link href="/admin/cities">
          <div className={`flex flex-col items-center p-1 ${isActive("/admin/cities") ? "text-primary" : "text-gray-500"}`}>
            <MapPin className="h-6 w-6" />
            <span className="text-xs mt-1">Cidades</span>
          </div>
        </Link>
      )}
    </nav>
  );
}
