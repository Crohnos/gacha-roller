// src/store.ts
import { create } from 'zustand';
import axios from 'axios';

// Define types for our store
type PityInfo = {
  rolls_until_rare: number;
  rolls_until_epic: number;
  rolls_until_legendary: number;
  rolls_until_mythic: number;
  common_streak: number;
  total_rolls: number;
  guaranteed_next_rarity: string | null;
};

type Card = {
  card_id: number;
  image_path: string;
  description: string;
  css: string;
  rarity: string;
  character: string;
  enhancements: string[];
  pity_info?: PityInfo;
};

type User = {
  userId: string;
  username: string;
  email?: string;
};

interface State {
  loading: boolean;
  card: Card | null;
  collection: Card[];
  user: User | null;
  error: string | null;
  lastPityInfo: PityInfo | null;
  isAuthenticated: boolean;
  
  setLoading: (val: boolean) => void;
  
  // Authentication methods
  register: (username: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyResetToken: (token: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  
  // Game methods
  rollCard: (forcedRarity?: string) => Promise<void>;
  fetchCollection: () => Promise<void>;
  fetchPityInfo: () => Promise<void>;
  clearCard: () => void;
}

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Configure axios defaults
axios.defaults.withCredentials = true; // Always send credentials
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Define rarity tiers to match backend values exactly
const RARITIES = {
  common: 'common',
  rare: 'rare',
  epic: 'epic',
  legendary: 'legendary',
  mythic: 'mythic'
};

export const useStore = create<State>((set, get) => ({
  loading: false,
  card: null,
  collection: [],
  user: null,
  error: null,
  lastPityInfo: null,
  isAuthenticated: false,
  
  setLoading: (val) => set({ loading: val }),
  
  // Authentication methods
  register: async (username, email, password) => {
    set({ loading: true, error: null });
    
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      }, { withCredentials: true });
      
      set({
        user: response.data.user,
        isAuthenticated: true,
        loading: false
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  
  login: async (email, password) => {
    set({ loading: true, error: null });
    
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      }, { withCredentials: true });
      
      set({
        user: response.data.user,
        isAuthenticated: true,
        loading: false
      });
      
      // Fetch user pity info after login
      get().fetchPityInfo();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  
  logout: async () => {
    set({ loading: true });
    
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
      
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        card: null,
        collection: [],
        lastPityInfo: null
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, we still reset local state
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        card: null,
        collection: [],
        lastPityInfo: null
      });
    }
  },
  
  checkAuth: async () => {
    try {
      // Add a small delay to ensure server is ready to handle requests
      const response = await axios.get(`${API_URL}/auth/check-session`, { 
        withCredentials: true,
        // Increase timeout to avoid quick failures
        timeout: 5000
      });
      
      console.log('Auth check response:', response.data);
      
      if (response.data && response.data.isAuthenticated) {
        set({
          user: response.data.user,
          isAuthenticated: true
        });
        
        // Fetch user data after authentication
        get().fetchPityInfo();
        get().fetchCollection();
      } else {
        // Clear authentication state if not authenticated
        set({ isAuthenticated: false, user: null });
      }
    } catch (error) {
      console.error('Check auth error:', error);
      // Don't throw error, just set state to not authenticated
      set({ isAuthenticated: false, user: null });
    }
  },
  
  forgotPassword: async (email) => {
    set({ loading: true, error: null });
    
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      set({ loading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to process request';
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  
  verifyResetToken: async (token) => {
    set({ loading: true, error: null });
    
    try {
      const response = await axios.get(`${API_URL}/auth/verify-reset-token?token=${token}`);
      set({ loading: false });
      return response.data.valid;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Invalid token';
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  
  resetPassword: async (token, newPassword) => {
    set({ loading: true, error: null });
    
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, newPassword });
      set({ loading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to reset password';
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  
  rollCard: async (forcedRarity?: string) => {
    const { user, isAuthenticated } = get();
    set({ loading: true, error: null });
    
    // Check authentication
    if (!isAuthenticated || !user) {
      set({ 
        loading: false, 
        error: 'You must be logged in to roll cards.' 
      });
      return;
    }
    
    try {
      // Add the forced rarity parameter if specified
      const payload = {
        user_id: user.userId,
        username: user.username
      };
      
      // Add the forced rarity if provided
      if (forcedRarity) {
        // Log to console for debugging
        console.log('Forcing rarity in store.ts:', forcedRarity);
        
        // Check if forcedRarity is actually a string and not an event object
        if (typeof forcedRarity === 'string') {
          // Validate the rarity against our defined rarities
          const normalizedRarity = forcedRarity.toLowerCase();
          if (RARITIES[normalizedRarity as keyof typeof RARITIES]) {
            // Use direct assignment with the verified rarity
            payload.forced_rarity = RARITIES[normalizedRarity as keyof typeof RARITIES];
            console.log('Using validated rarity:', payload.forced_rarity);
          } else {
            console.error(`Invalid rarity provided: ${forcedRarity}. Must be one of: ${Object.keys(RARITIES).join(', ')}`);
          }
        } else {
          console.error('ERROR: forcedRarity is not a string!', forcedRarity);
          // Force mythic regardless to test the backend
          payload.forced_rarity = 'mythic';
          console.log('Forcing mythic rarity as fallback');
        }
        
        // Confirm what we're sending
        console.log('Payload after adding forced_rarity:', payload);
      }
      
      // Debug log the full payload
      console.log('API payload:', payload);
      
      const response = await axios.post(`${API_URL}/roll`, payload, { withCredentials: true });
      
      // Debug the response
      console.log('API Response:', response.data);
      console.log('Response rarity:', response.data.rarity);
      
      if (forcedRarity && response.data.rarity !== forcedRarity.toLowerCase()) {
        console.error(`WARNING: Requested rarity "${forcedRarity}" but got "${response.data.rarity}" instead!`);
        
        // Debug info if available
        if (response.data.debug_info) {
          console.log('Server debug info:', response.data.debug_info);
        }
      }
      
      // Store pity info separately so it persists even when card is cleared
      const pityInfo = response.data.pity_info || null;
      
      set({ 
        card: response.data,
        loading: false,
        lastPityInfo: pityInfo
      });
      
      // After rolling a card, refresh the collection
      get().fetchCollection();
    } catch (error: any) {
      console.error('Error rolling card:', error);
      
      // Check if it's a 503 error (Service Unavailable)
      if (error.response && error.response.status === 503) {
        set({ 
          loading: false,
          error: '⚠️ Image servers are currently busy. Your card may have a placeholder image. Please try again in a few minutes.'
        });
        
        // Check if we got a card despite the 503 error
        if (error.response.data && error.response.data.card_id) {
          set({ card: error.response.data });
        }
      } else {
        set({ 
          loading: false,
          error: 'Failed to roll card. The image generation service might be temporarily overloaded. Please try again in a few minutes.'
        });
      }
    }
  },
  
  fetchCollection: async () => {
    const { user, isAuthenticated } = get();
    
    // Check authentication
    if (!isAuthenticated || !user) {
      // Silently return for collection since it's loaded on app startup
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/collection/${user.userId}`, { withCredentials: true });
      set({ collection: response.data });
    } catch (error: any) {
      console.error('Error fetching collection:', error);
      
      // Handle 401 Unauthorized
      if (error.response && error.response.status === 401) {
        set({ isAuthenticated: false, user: null });
        return;
      }
      
      // Check if it's a 503 error (Service Unavailable)
      if (error.response && error.response.status === 503) {
        set({ 
          error: '⚠️ Image servers are currently busy. Your collection is available but some images may be placeholders.'
        });
        
        // If we got partial data, still use it
        if (error.response.data && Array.isArray(error.response.data)) {
          set({ collection: error.response.data });
        }
      } else {
        set({ error: 'Failed to fetch collection. The image service might be temporarily overloaded. Please try again in a few minutes.' });
      }
    }
  },
  
  fetchPityInfo: async () => {
    const { user, isAuthenticated } = get();
    
    // Check authentication
    if (!isAuthenticated || !user) {
      // Silently return for pity info since it's loaded on app startup
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/pity/${user.userId}`, { withCredentials: true });
      
      // If we got valid pity data, update the store
      if (response.data) {
        set({ lastPityInfo: response.data });
        console.log('Fetched pity info:', response.data);
      }
    } catch (error: any) {
      console.error('Error fetching pity info:', error);
      
      // Handle 401 Unauthorized
      if (error.response && error.response.status === 401) {
        set({ isAuthenticated: false, user: null });
      }
      
      // We don't set an error state here to avoid disrupting the main UI
    }
  },
  
  clearCard: () => set({ card: null }) // Keep lastPityInfo unchanged
}));