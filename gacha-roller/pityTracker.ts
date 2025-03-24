// pityTracker.ts
import fs from 'fs';
import path from 'path';
import logger from './logger';

// Define the pity thresholds
export const PITY_THRESHOLDS = {
  rare: 10,    // Guaranteed rare after 10 commons
  epic: 50,    // Guaranteed epic after 50 rolls without an epic
  legendary: 100, // Guaranteed legendary after 100 rolls
  mythic: 300,  // Guaranteed mythic after 300 rolls
};

// Define the pity structure
export interface UserPity {
  user_id: string;
  commonStreak: number;    // Number of commons in a row
  rollsSinceRare: number;  // Rolls since last rare+
  rollsSinceEpic: number;  // Rolls since last epic+
  rollsSinceHigher: number; // Rolls since any rarity higher than current
  totalRolls: number;      // Total lifetime rolls
  lastRoll: string;        // Timestamp of last roll
  guaranteedNextRarity?: string; // If set, the next roll will be at least this rarity
}

// In-memory cache of user pity data
const pityCache: Record<string, UserPity> = {};

// Path to the pity data file
const pityFilePath = path.join(__dirname, 'pity-data.json');

// Load all pity data from disk
export function loadPityData(): Record<string, UserPity> {
  try {
    if (fs.existsSync(pityFilePath)) {
      const data = fs.readFileSync(pityFilePath, 'utf8');
      const parsed = JSON.parse(data);
      Object.assign(pityCache, parsed);
      logger.info('Loaded pity data', { userCount: Object.keys(pityCache).length });
    } else {
      logger.info('No pity data file found, creating new one');
      savePityData(); // Create the file
    }
  } catch (error) {
    logger.error('Failed to load pity data', { error });
  }
  
  return pityCache;
}

// Save all pity data to disk
export function savePityData(): void {
  try {
    fs.writeFileSync(pityFilePath, JSON.stringify(pityCache, null, 2), 'utf8');
    logger.info('Saved pity data', { userCount: Object.keys(pityCache).length });
  } catch (error) {
    logger.error('Failed to save pity data', { error });
  }
}

// Get a user's pity data, creating a new entry if not found
export function getUserPity(userId: string): UserPity {
  if (!pityCache[userId]) {
    pityCache[userId] = {
      user_id: userId,
      commonStreak: 0,
      rollsSinceRare: 0,
      rollsSinceEpic: 0,
      rollsSinceHigher: 0,
      totalRolls: 0,
      lastRoll: new Date().toISOString()
    };
  }
  
  return pityCache[userId];
}

// Update a user's pity counter based on rarity
export function updatePity(userId: string, rarity: string): UserPity {
  const pity = getUserPity(userId);
  
  // Increment the total rolls
  pity.totalRolls++;
  pity.lastRoll = new Date().toISOString();
  
  // Reset or increment streaks based on rarity
  switch (rarity) {
    case 'mythic':
      // Mythic resets all pity counters
      pity.commonStreak = 0;
      pity.rollsSinceRare = 0;
      pity.rollsSinceEpic = 0;
      pity.rollsSinceHigher = 0;
      break;
      
    case 'legendary':
      // Legendary resets common, rare, and epic counters
      pity.commonStreak = 0;
      pity.rollsSinceRare = 0;
      pity.rollsSinceEpic = 0;
      pity.rollsSinceHigher = 0;
      break;
      
    case 'epic':
      // Epic resets common and rare counters
      pity.commonStreak = 0;
      pity.rollsSinceRare = 0;
      pity.rollsSinceEpic = 0;
      // Still counting until legendary/mythic
      pity.rollsSinceHigher++;
      break;
      
    case 'rare':
      // Rare resets common counter
      pity.commonStreak = 0;
      pity.rollsSinceRare = 0;
      // Still counting until epic+
      pity.rollsSinceEpic++;
      pity.rollsSinceHigher++;
      break;
      
    case 'common':
    default:
      // Common increments all counters
      pity.commonStreak++;
      pity.rollsSinceRare++;
      pity.rollsSinceEpic++;
      pity.rollsSinceHigher++;
      break;
  }
  
  // Clear any guaranteed rarity flag
  delete pity.guaranteedNextRarity;
  
  // Check if we've hit any pity thresholds
  if (pity.commonStreak >= PITY_THRESHOLDS.rare) {
    pity.guaranteedNextRarity = 'rare';
    logger.info('Pity system activated', { 
      userId, 
      commonStreak: pity.commonStreak, 
      guaranteedRarity: 'rare' 
    });
  }
  
  if (pity.rollsSinceEpic >= PITY_THRESHOLDS.epic) {
    pity.guaranteedNextRarity = 'epic';
    logger.info('Pity system activated', { 
      userId, 
      rollsSinceEpic: pity.rollsSinceEpic, 
      guaranteedRarity: 'epic' 
    });
  }
  
  if (pity.rollsSinceRare >= PITY_THRESHOLDS.legendary) {
    pity.guaranteedNextRarity = 'legendary';
    logger.info('Pity system activated', { 
      userId, 
      rollsSinceRare: pity.rollsSinceRare, 
      guaranteedRarity: 'legendary' 
    });
  }
  
  if (pity.rollsSinceHigher >= PITY_THRESHOLDS.mythic) {
    pity.guaranteedNextRarity = 'mythic';
    logger.info('Pity system activated', { 
      userId, 
      rollsSinceHigher: pity.rollsSinceHigher, 
      guaranteedRarity: 'mythic' 
    });
  }
  
  // Save after update
  savePityData();
  
  return pity;
}

// Check if a roll should be upgraded due to pity
export function checkPityUpgrade(userId: string): string | null {
  const pity = getUserPity(userId);
  
  if (pity.guaranteedNextRarity) {
    const upgradeRarity = pity.guaranteedNextRarity;
    logger.info('Applying pity upgrade', { 
      userId, 
      upgradeRarity,
      commonStreak: pity.commonStreak,
      rollsSinceRare: pity.rollsSinceRare,
      rollsSinceEpic: pity.rollsSinceEpic
    });
    
    return upgradeRarity;
  }
  
  return null;
}

// Get the number of rolls until the next pity threshold
export function getRollsUntilPity(userId: string): Record<string, number> {
  const pity = getUserPity(userId);
  
  return {
    rare: Math.max(0, PITY_THRESHOLDS.rare - pity.commonStreak),
    epic: Math.max(0, PITY_THRESHOLDS.epic - pity.rollsSinceEpic),
    legendary: Math.max(0, PITY_THRESHOLDS.legendary - pity.rollsSinceRare),
    mythic: Math.max(0, PITY_THRESHOLDS.mythic - pity.rollsSinceHigher)
  };
}

// Ensure a user's pity data exists
export function ensurePityData(userId: string): void {
  if (!pityCache[userId]) {
    getUserPity(userId); // This will create a new entry if not found
    logger.info('Created new pity data for user', { userId });
  }
}

// Initialize on module load
loadPityData();

// If the module is loaded directly, log a message
if (require.main === module) {
  logger.info('PityTracker initialized as main module');
}