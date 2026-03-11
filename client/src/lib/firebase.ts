import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged, 
  User,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Log Firebase initialization for debugging
console.log('Initializing Firebase with Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);

// Initialize Firebase with explicit types
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Set custom parameters for the auth provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Add additional scopes for better profile data
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Log the current URL for debugging Firebase domain configuration
console.log('Current application URL:', window.location.origin);
console.log('IMPORTANT: Make sure to add this URL to Firebase Console > Authentication > Settings > Authorized Domains');

/**
 * Signs in with Google using redirect (works better in iframe environments like Replit)
 * @returns Promise that resolves when redirect is complete
 */
export const signInWithGoogle = async () => {
  try {
    // Add logging for debugging
    console.log("Starting Google sign-in process");
    
    // Force refresh auth sessions
    await auth.signOut();
    
    // Configure custom parameters for better UX
    googleProvider.setCustomParameters({
      prompt: 'select_account',
      // Important: Ensure the login_hint is empty to show the account picker
      login_hint: '',
      // Pass current origin as redirect_uri to help in constrained iframe environments
      redirect_uri: `${window.location.origin}/login`
    });
    
    console.log("Google provider configured with redirect URI:", window.location.origin);
    
    // Try to use auth with redirect
    try {
      // Start the redirect
      await signInWithRedirect(auth, googleProvider);
      // This code won't execute until the user returns from the redirect
      console.log("Redirect initiated");
      return true;
    } catch (redirectError) {
      console.error("Error with redirect auth:", redirectError);
      throw redirectError;
    }
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw error;
  }
};

/**
 * Handle the redirect result when returning from Google auth
 * @returns Promise that resolves with the authenticated user or null
 */
export const handleRedirectResult = async () => {
  try {
    console.log("Handling redirect result");
    
    // Try to get the auth result from the redirect
    try {
      const result = await getRedirectResult(auth);
      
      // Log detailed information about the result
      if (result) {
        console.log("Redirect result: User authenticated");
        console.log("User details:", {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          emailVerified: result.user.emailVerified,
          createdAt: result.user.metadata.creationTime,
          lastLogin: result.user.metadata.lastSignInTime,
        });
        
        // In newer Firebase versions, credential needs to be accessed differently
        // We're just checking if user was authenticated, so we don't need credential
        
        return result.user;
      } else {
        console.log("No redirect result found. User may not have completed the auth flow.");
        
        // Check if we have a current user despite no redirect result
        // This happens sometimes in iframe environments
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log("Current user found despite no redirect result:", currentUser.email);
          return currentUser;
        }
        
        return null;
      }
    } catch (redirectError) {
      console.error("Error getting redirect result:", redirectError);
      
      // Check if we still have a current user despite the error
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log("Current user found despite redirect error:", currentUser.email);
        return currentUser;
      }
      
      throw redirectError;
    }
  } catch (error) {
    console.error("Error handling redirect result: ", error);
    throw error;
  }
};

/**
 * Signs in with email and password
 * @param email User's email
 * @param password User's password
 * @returns Promise that resolves with the authenticated user
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error signing in with email: ", error);
    throw error;
  }
};

/**
 * Creates a new user with email and password
 * @param email User's email
 * @param password User's password
 * @returns Promise that resolves with the created user
 */
export const registerWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error registering with email: ", error);
    throw error;
  }
};

/**
 * Signs out the current user
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
};

/**
 * Listen for authentication state changes
 * @param callback Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get the current authenticated user
 * @returns The current user or null if not authenticated
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Update the user's profile information in Firebase
 * @param displayName New display name
 * @param photoURL New avatar URL
 * @returns Promise that resolves when update is complete
 */
export const updateUserProfile = async (displayName?: string, photoURL?: string) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is signed in");
  }
  
  try {
    await updateProfile(user, {
      displayName: displayName || user.displayName,
      photoURL: photoURL || user.photoURL
    });
    
    // Refresh the token to ensure changes take effect
    await user.getIdToken(true);
    return true;
  } catch (error) {
    console.error("Error updating Firebase profile:", error);
    throw error;
  }
};

// City types to match with our PORTUGAL_CITIES array
export interface City {
  id?: string;
  name: string;
  lat: string;
  lng: string;
}

/**
 * Get all cities from Firestore collection
 * @returns Promise resolving to array of cities
 */
export const getCities = async (): Promise<City[]> => {
  try {
    const citiesRef = collection(db, 'cities');
    const q = query(citiesRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    const cities: City[] = [];
    querySnapshot.forEach((doc) => {
      cities.push({
        id: doc.id,
        ...doc.data() as Omit<City, 'id'>
      });
    });
    
    return cities;
  } catch (error) {
    console.error("Error getting cities from Firestore:", error);
    throw error;
  }
};

/**
 * Add a new city to Firestore
 * @param city The city object to add
 * @returns Promise resolving to the city ID
 */
export const addCity = async (city: Omit<City, 'id'>): Promise<string> => {
  try {
    const citiesRef = collection(db, 'cities');
    const docRef = await addDoc(citiesRef, city);
    return docRef.id;
  } catch (error) {
    console.error("Error adding city to Firestore:", error);
    throw error;
  }
};

/**
 * Update an existing city in Firestore
 * @param id City ID to update
 * @param city Updated city data
 * @returns Promise resolving when update completes
 */
export const updateCity = async (id: string, city: Partial<Omit<City, 'id'>>): Promise<void> => {
  try {
    const cityRef = doc(db, 'cities', id);
    await updateDoc(cityRef, city);
  } catch (error) {
    console.error("Error updating city in Firestore:", error);
    throw error;
  }
};

/**
 * Delete a city from Firestore
 * @param id City ID to delete
 * @returns Promise resolving when deletion completes
 */
export const deleteCity = async (id: string): Promise<void> => {
  try {
    const cityRef = doc(db, 'cities', id);
    await deleteDoc(cityRef);
  } catch (error) {
    console.error("Error deleting city from Firestore:", error);
    throw error;
  }
};

/**
 * Seed initial cities to Firestore if collection is empty
 * @param cities Array of cities to seed
 * @returns Promise resolving when seeding completes
 */
export const seedCities = async (cities: Omit<City, 'id'>[]): Promise<void> => {
  try {
    // Check if cities already exist
    const existingCities = await getCities();
    
    if (existingCities.length === 0) {
      console.log("Seeding cities to Firestore...");
      const citiesRef = collection(db, 'cities');
      
      // Add each city to Firestore
      const promises = cities.map(city => 
        addDoc(citiesRef, city)
      );
      
      await Promise.all(promises);
      console.log(`${cities.length} cities added to Firestore`);
    } else {
      console.log("Cities collection already exists, skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding cities to Firestore:", error);
    throw error;
  }
};

export { auth, db };