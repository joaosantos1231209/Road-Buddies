import { apiRequest } from './queryClient';
import type { City, User } from '@shared/schema';

// Type for creating a new city
export type NewCity = {
  name: string;
  lat: string;
  lng: string;
  isActive?: boolean;
};

// Cities API functions
export async function fetchCities(): Promise<City[]> {
  return apiRequest<City[]>('/api/cities');
}

export async function fetchCity(id: number): Promise<City> {
  return apiRequest<City>(`/api/cities/${id}`);
}

export async function createCity(city: NewCity): Promise<City> {
  return apiRequest<City>('/api/cities', 'POST', city);
}

export async function updateCity(id: number, city: Partial<NewCity>): Promise<City> {
  return apiRequest<City>(`/api/cities/${id}`, 'PATCH', city);
}

export async function deleteCity(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/cities/${id}`, 'DELETE');
}

export async function seedCities(): Promise<{ message: string; count: number }> {
  return apiRequest<{ message: string; count: number }>('/api/cities/seed', 'POST');
}

// Email verification API functions
export async function verifyEmail(token: string): Promise<{ message: string; user: User }> {
  return apiRequest<{ message: string; user: User }>(`/api/auth/verify?token=${token}`, 'GET');
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/auth/resend-verification', 'POST', { email });
}