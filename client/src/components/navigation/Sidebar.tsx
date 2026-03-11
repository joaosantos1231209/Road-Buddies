import { useLocation, Link } from "wouter";
import { 
  Home, 
  Clock, 
  MessageSquare, 
  User, 
  Search,
  MapPin,
  Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/lib/constants";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  currentPath: string;
}

function SidebarLink({ href, icon, label, badge, currentPath }: SidebarLinkProps) {
  const isActive = currentPath === href;
  
  return (
    <li>
      <Link href={href}>
        <div
          className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
            isActive
              ? "bg-blue-50 text-primary"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {icon}
          <span>{label}</span>
          {badge && (
            <span className="ml-auto bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

interface SidebarProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const { appUser } = useAuth();
  
  return (
    <aside className="hidden md:flex md:w-72 lg:w-80 flex-col bg-white shadow-sm z-10">
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center space-x-3 mb-6">
          <img
            src="/logo.png"
            alt={`${APP_NAME} Logo`}
            className="h-10 w-10"
          />
          <h1 className="font-bold text-xl">{APP_NAME}</h1>
        </Link>
        {/* Search removed as requested */}
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          <SidebarLink
            href="/"
            icon={<Home className="h-5 w-5" />}
            label="Próximas Viagens"
            currentPath={location}
          />
          <SidebarLink
            href="/my-trips"
            icon={<Clock className="h-5 w-5" />}
            label="Minhas Viagens"
            currentPath={location}
          />
          {/* Messages link removed as requested */}
          <SidebarLink
            href="/profile"
            icon={<User className="h-5 w-5" />}
            label="Perfil"
            currentPath={location}
          />
          
          {/* Admin section - only visible to admin users */}
          {appUser?.isAdmin && (
            <>
              <div className="mt-6 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                  Admin
                </h3>
              </div>
              <SidebarLink
                href="/admin/cities"
                icon={<MapPin className="h-5 w-5" />}
                label="Gerir Cidades"
                currentPath={location}
              />
            </>
          )}
        </ul>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-primary mb-2">Vantagens de partilhar viagens</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500 mr-2 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Economize até 70% nos custos de viagem</span>
            </li>
            <li className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500 mr-2 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Reduza a sua pegada ambiental</span>
            </li>
            <li className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500 mr-2 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Conheça novas pessoas durante as viagens</span>
            </li>
          </ul>
        </div>
      </nav>
      
      <div className="p-4 border-t">
        <Link href="/profile" className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors">
          <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-full w-full p-2 text-gray-500" />
            )}
          </div>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
