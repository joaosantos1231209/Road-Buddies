import { useState, useEffect } from "react";
import { Plus, Minus, Cloud, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Trip } from "@shared/schema";
import { TRIP_STATUS_COLORS } from "@/lib/constants";

interface MapViewProps {
  trips: Trip[];
  onCreateTrip: () => void;
}

export default function MapView({ trips, onCreateTrip }: MapViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // This component simulates a map view
  // In a real implementation, we would use Google Maps API
  
  useEffect(() => {
    // Implementation note: This would be where we would initialize Google Maps
    console.log("Map component mounted");
    
    return () => {
      console.log("Map component unmounted");
    };
  }, []);
  
  // Display trip markers on the map
  useEffect(() => {
    // Implementation note: This would be where we would add markers for each trip
    console.log("Trips updated in map:", trips.length);
  }, [trips]);

  return (
    <div className="relative h-full bg-gray-100 overflow-hidden">
      <div className="absolute inset-0 map-placeholder">
        {/* Placeholder for Google Maps Integration */}
        <div className="h-full relative">
          {/* Visualize trips on the map */}
          {trips.map((trip) => (
            <div 
              key={trip.id}
              className="absolute"
              style={{ 
                left: `${30 + Math.random() * 60}%`, 
                top: `${20 + Math.random() * 60}%` 
              }}
            >
              <div className={`w-4 h-4 rounded-full ${TRIP_STATUS_COLORS[trip.status]} animate-pulse`} />
            </div>
          ))}
        </div>
      </div>
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow p-2 flex space-x-2">
        <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
          <Plus className="h-5 w-5 text-gray-700" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
          <Minus className="h-5 w-5 text-gray-700" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
          <Cloud className="h-5 w-5 text-gray-700" />
        </Button>
      </div>

      {/* Create Trip Button */}
      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-4">
        <Button 
          className="bg-primary text-white px-4 py-2 rounded-full shadow-lg font-medium flex items-center"
          onClick={onCreateTrip}
        >
          <Plus className="h-5 w-5 mr-2" />
          Criar Viagem
        </Button>
      </div>
      
      {/* Location Search (Mobile) */}
      <div className="absolute top-4 left-4 right-16 md:hidden">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Para onde vai?" 
            className="w-full px-10 py-2 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <MapPin className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
