import { User } from 'firebase/auth';
import { apiRequest } from './queryClient';

/**
 * Creates or updates a user in the backend based on Firebase auth user
 * @param firebaseUser The Firebase auth user object
 * @returns The created/updated user from the backend
 */
export async function syncUserWithBackend(firebaseUser: User) {
  try {
    console.log('Syncing user with backend, Firebase ID:', firebaseUser.uid);
    console.log('User email:', firebaseUser.email);
    console.log('Display name:', firebaseUser.displayName);
    console.log('Photo URL:', firebaseUser.photoURL ? 'Has photo' : 'No photo');
    
    // Extract relevant user information from Firebase user but only use it for new users
    // This ensures we don't overwrite profile data that was set in the app
    const userData = {
      firebaseId: firebaseUser.uid,
      username: firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.substring(0, 8)}`,
      email: firebaseUser.email,
      // Only use Firebase display name as a fallback for new users
      firebaseDisplayName: firebaseUser.displayName,
      avatar: firebaseUser.photoURL || undefined
    };
    
    console.log('Sending user data to backend:', {
      firebaseId: userData.firebaseId,
      username: userData.username,
      email: userData.email,
      hasDisplayName: !!userData.firebaseDisplayName,
      hasAvatar: !!userData.avatar
    });
    
    // Send request to backend to create or update the user
    const user = await apiRequest('/api/users/sync', 'POST', userData);
    console.log('Synced user data:', user);
    return user;
  } catch (error) {
    console.error('Error syncing user with backend:', error);
    throw error;
  }
}