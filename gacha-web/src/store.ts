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
  
  // Game methods
  rollCard: (forcedRarity?: string) => Promise<void>;
  fetchCollection: () => void;
  fetchPityInfo: () => Promise<void>;
  clearCard: () => void;
  
  // Collection management methods
  addCardToCollection: (card: Card) => void;
  clearLocalData: () => void;
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

// Constants for localStorage
const COLLECTION_KEY = 'gacha_collection';
const USER_ID_KEY = 'gacha_user_id';
const COLLECTION_TIMESTAMP_KEY = 'gacha_collection_timestamp';
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper function to generate a random user ID
const generateUserId = () => {
  return 'user_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
};

// Helper function to check if the collection has expired
const isCollectionExpired = () => {
  const timestamp = localStorage.getItem(COLLECTION_TIMESTAMP_KEY);
  if (!timestamp) return true;
  
  const expiryTime = parseInt(timestamp) + SESSION_EXPIRY;
  return Date.now() > expiryTime;
};

export const useStore = create<State>((set, get) => ({
  loading: false,
  card: null,
  collection: [],
  user: null,
  error: null,
  lastPityInfo: null,
  isAuthenticated: true, // Always authenticated in this simplified version
  
  setLoading: (val) => set({ loading: val }),
  
  // Get or create a user ID for local storage
  getUserId: () => {
    let userId = localStorage.getItem(USER_ID_KEY);
    
    // Check if userId exists and collection hasn't expired
    if (!userId || isCollectionExpired()) {
      // Generate a new userId and reset collection timestamp
      userId = generateUserId();
      localStorage.setItem(USER_ID_KEY, userId);
      localStorage.setItem(COLLECTION_TIMESTAMP_KEY, Date.now().toString());
      localStorage.setItem(COLLECTION_KEY, JSON.stringify([]));
    }
    
    return userId;
  },
  
  rollCard: async (forcedRarity?: string) => {
    set({ loading: true, error: null });
    
    // Get or create user ID for local storage
    const userId = get().getUserId();
    const username = 'guest_user';
    
    try {
      // Add the forced rarity parameter if specified
      const payload: { 
        user_id: string; 
        username: string; 
        forced_rarity?: string 
      } = {
        user_id: userId,
        username
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
      
      const response = await axios.post(`${API_URL}/roll`, payload);
      
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
      
      // Add the new card to local collection
      get().addCardToCollection(response.data);
      
      set({ 
        card: response.data,
        loading: false,
        lastPityInfo: pityInfo,
        user: { userId, username, email: '' }
      });
    } catch (error: any) {
      console.error('Error rolling card:', error);
      
      // Check if it's a 503 error (Service Unavailable)
      if (error.response && error.response.status === 503) {
        // Check if it's a timeout error specifically
        if (error.response.data && error.response.data.isTimeout) {
          set({ 
            loading: false,
            error: '⏱️ The image generation took longer than expected. Your card might still be processing. Please try again shortly.'
          });
        } else {
          set({ 
            loading: false,
            error: '⚠️ Image servers are currently busy. Your card may have a placeholder image. Please try again in a few minutes.'
          });
        }
        
        // Check if we got a card despite the 503 error
        if (error.response.data && error.response.data.card_id) {
          set({ card: error.response.data });
          get().addCardToCollection(error.response.data);
        }
      } else {
        set({ 
          loading: false,
          error: 'Failed to roll card. The image generation service might be temporarily overloaded. Please try again in a few minutes.'
        });
      }
    }
  },
  
  // Load collection from localStorage
  fetchCollection: () => {
    try {
      // Check if collection has expired
      if (isCollectionExpired()) {
        // Clear expired collection data
        localStorage.removeItem(COLLECTION_KEY);
        localStorage.setItem(COLLECTION_TIMESTAMP_KEY, Date.now().toString());
        set({ collection: [] });
        return;
      }
      
      // Get collection from localStorage
      const collectionString = localStorage.getItem(COLLECTION_KEY);
      const collection = collectionString ? JSON.parse(collectionString) : [];
      
      set({ collection });
    } catch (error) {
      console.error('Error loading collection from localStorage:', error);
      set({ collection: [], error: 'Failed to load your collection from local storage.' });
    }
  },
  
  // Add a card to the collection in localStorage
  addCardToCollection: (card: Card) => {
    try {
      // Get current collection
      const collectionString = localStorage.getItem(COLLECTION_KEY);
      const collection = collectionString ? JSON.parse(collectionString) : [];
      
      // Add new card
      collection.push(card);
      
      // Update localStorage
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection));
      localStorage.setItem(COLLECTION_TIMESTAMP_KEY, Date.now().toString());
      
      // Update state
      set({ collection });
    } catch (error) {
      console.error('Error adding card to collection:', error);
    }
  },
  
  fetchPityInfo: async () => {
    // Get current user ID
    const userId = get().getUserId();
    
    try {
      const response = await axios.get(`${API_URL}/pity/${userId}`);
      
      // If we got valid pity data, update the store
      if (response.data) {
        set({ lastPityInfo: response.data });
        console.log('Fetched pity info:', response.data);
      }
    } catch (error: any) {
      console.error('Error fetching pity info:', error);
      // We don't set an error state here to avoid disrupting the main UI
    }
  },
  
  clearCard: () => set({ card: null }), // Keep lastPityInfo unchanged
  
  // Method to clear all local storage data (for collection expiration)
  clearLocalData: () => {
    localStorage.removeItem(COLLECTION_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(COLLECTION_TIMESTAMP_KEY);
    
    set({
      collection: [],
      lastPityInfo: null,
      card: null,
      user: null
    });
    
    // Generate a new user ID
    const userId = generateUserId();
    const username = 'guest_user';
    
    localStorage.setItem(USER_ID_KEY, userId);
    localStorage.setItem(COLLECTION_TIMESTAMP_KEY, Date.now().toString());
    localStorage.setItem(COLLECTION_KEY, JSON.stringify([]));
    
    set({ user: { userId, username, email: '' } });
  }
}));