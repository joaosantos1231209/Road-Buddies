import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchCities, 
  createCity, 
  updateCity, 
  deleteCity, 
  seedCities,
  type NewCity
} from '@/lib/api';
import { PORTUGAL_CITIES } from '@/lib/constants';
import type { City } from '@shared/schema';

/**
 * Hook to get all cities from the database
 */
export const useCities = () => {
  return useQuery({
    queryKey: ['/api/cities'],
    retry: 1,
    // Handle errors in the component using onError in useCitiesWithFallback
  });
};

/**
 * Hook to add a new city to the database
 */
export const useAddCity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (city: NewCity) => createCity(city),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cities'] });
    }
  });
};

/**
 * Hook to update an existing city in the database
 */
export const useUpdateCity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, city }: { id: number; city: Partial<NewCity> }) => 
      updateCity(id, city),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cities'] });
    }
  });
};

/**
 * Hook to delete a city from the database
 */
export const useDeleteCity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => deleteCity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cities'] });
    }
  });
};

/**
 * Hook to seed initial cities to the database
 */
export const useSeedCities = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: seedCities,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cities'] });
    }
  });
};

/**
 * Hook to manage cities with auto-fallback to static list
 * Use this as the main hook for cities in components
 */
export const useCitiesWithFallback = () => {
  const { data, isLoading, isError } = useCities();
  const [cities, setCities] = useState<City[]>([]);
  const [isFallbackActive, setIsFallbackActive] = useState(false);
  const { mutate: seedCitiesMutation, isPending: isSeeding } = useSeedCities();
  
  // Initialize with static cities to avoid loading state
  useEffect(() => {
    // Immediately set static cities on mount to ensure we have data
    const staticCities = PORTUGAL_CITIES.map((city, index) => ({
      id: index,
      name: city.name,
      lat: city.lat,
      lng: city.lng,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    setCities(staticCities);
    setIsFallbackActive(true);
  }, []);
  
  // Try to get database cities if available
  useEffect(() => {
    // If data is loaded and not empty, use it
    if (!isLoading && !isError && data && data.length > 0) {
      setCities(data);
      setIsFallbackActive(false);
    } 
    // If there was an error or no data and we're not already in seeding process
    else if (!isLoading && (isError || (data && data.length === 0)) && !isSeeding) {
      // Try to seed cities if there's no data (but not if there was an error)
      if (data && data.length === 0 && !isError) {
        console.log("No cities found, trying to seed initial data...");
        seedCitiesMutation();
      } else if (isError) {
        console.warn("Error fetching cities from database, using static list instead");
      }
    }
  }, [data, isLoading, isError, isSeeding, seedCitiesMutation]);
  
  return {
    cities,
    isLoading: false, // Never return loading since we have fallback data
    isError,
    isFallbackActive,
    seedCities: seedCitiesMutation
  };
};