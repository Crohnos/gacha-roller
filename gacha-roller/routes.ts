// routes.ts
import express from 'express';
import { Database } from 'sqlite';
import { 
  determineRarity, 
  rarityTiers, 
  generateImage, 
  generateDescription, 
  generateTwist
} from './cardGenerator';
import logger from './logger';

// Create a function to setup routes with access to the initialized DB
export function setupRoutes(app: express.Express, db: Database) {
  // Removed attachUser middleware to disable authentication
  
  // Endpoint to roll a new card - no authentication required
  app.post('/roll', (req, res, next) => {
    // Special handling for OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  }, async (req, res) => {
    // ⚠️ DIRECT MYTHIC CHECK ⚠️
    // Check if body contains the string "mythic" or "legendary" anywhere
    const bodyStr = JSON.stringify(req.body).toLowerCase();
    
    // MYTHIC CHECK
    if (bodyStr.includes('mythic')) {
      console.log('🔥🔥🔥 MYTHIC REQUEST DETECTED - SENDING MYTHIC RESPONSE 🔥🔥🔥');
      
      // Generate some random mythic character data
      const mythicCharacters = [
        'Skynet (Terminator)',
        'Agent Smith (The Matrix)',
        'SHODAN (System Shock)',
        'AM (I Have No Mouth and I Must Scream)',
        'Wintermute (Neuromancer)'
      ];
      const character = mythicCharacters[Math.floor(Math.random() * mythicCharacters.length)];
      
      // Extract character name and franchise for enhancement generation
      const characterMatch = character.match(/^(.*?)\s*\((.*?)\)$/);
      let characterName = character;
      let franchise = '';
      
      if (characterMatch) {
        characterName = characterMatch[1].trim();
        franchise = characterMatch[2].trim();
      }
      
      // Generate a twist for the character from static list
      const twist = generateTwist(characterName, franchise);
      
      // Generate fake ID and timestamp
      const card_id = Math.floor(Math.random() * 1000) + 900;
      const timestamp = Date.now();
      
      // Set default image_path
      let image_path = `cards/card-${timestamp}.png`;
      
      // Ensure the cards directory exists
      const fs = require('fs');
      const path = require('path');
      const cardsDir = path.join(__dirname, 'cards');
      if (!fs.existsSync(cardsDir)) {
        fs.mkdirSync(cardsDir, { recursive: true });
      }
      
      // Generate the image
      try {
        // Generate image using the standard function
        console.log('Generating mythic image for:', character);
        const generatedImagePath = await generateImage(character);
        
        if (generatedImagePath) {
          console.log('Successfully generated mythic image:', generatedImagePath);
          image_path = generatedImagePath;
        }
      } catch (imageError) {
        console.error('Failed to generate mythic image:', imageError);
        // If image generation fails, throw error to be handled by the outer catch block
        throw imageError;
      }
      
      // Generate a dynamic description using the same function used for normal rolls
      let description = '';
      try {
        // Use the proper description generator with the twist
        description = await generateDescription(character, twist);
        console.log('Successfully generated description for mythic:', description.substring(0, 50) + '...');
      } catch (descError) {
        // Retry the description generation one more time
        console.error('Failed to generate description for mythic, retrying:', descError);
        try {
          description = await generateDescription(character, twist);
        } catch (retryError) {
          // If retry fails, throw the error to be handled by the outer catch block
          throw retryError;
        }
      }
      
      // Insert into database
      try {
        const user_id = req.body.user_id || 'web_user_1';
        const characterName = character.split(' (')[0];
        
        // Save to database
        const result = await db.run(
          'INSERT INTO cards (user_id, image_path, description, css, rarity, character) VALUES (?, ?, ?, ?, ?, ?)',
          [user_id, image_path, description, '', 'mythic', characterName]
        );
        
        const mythicResponseData = {
          card_id: result.lastID || card_id,
          image_path,
          description,
          css: '',
          rarity: 'mythic',
          character,
          debug_info: {
            forced_rarity: 'mythic',
            request_body: req.body,
            message: 'Direct mythic intervention'
          }
        };
        
        return res.json(mythicResponseData);
      } catch (dbError) {
        console.error('Database error in mythic handler:', dbError);
        
        // Fallback if database fails
        return res.json({
          card_id,
          image_path: 'cards/card-1742765808501.png',
          description,
          css: '',
          rarity: 'mythic',
          character,
          debug_info: {
            message: 'Mythic fallback (DB error)',
            error: String(dbError)
          }
        });
      }
    }
    
    // LEGENDARY CHECK
    else if (bodyStr.includes('legendary')) {
      console.log('✨✨✨ LEGENDARY REQUEST DETECTED - SENDING LEGENDARY RESPONSE ✨✨✨');
      
      // Generate some random legendary character data
      const legendaryCharacters = [
        'GLaDOS (Portal)',
        'T-1000 (Terminator 2)',
        'VIKI (I, Robot)',
        'Ava (Ex Machina)',
        'Samantha (Her)'
      ];
      const character = legendaryCharacters[Math.floor(Math.random() * legendaryCharacters.length)];
      
      // Extract character name and franchise for enhancement generation
      const characterMatch = character.match(/^(.*?)\s*\((.*?)\)$/);
      let characterName = character;
      let franchise = '';
      
      if (characterMatch) {
        characterName = characterMatch[1].trim();
        franchise = characterMatch[2].trim();
      }
      
      // Generate a twist for the character from static list
      const twist = generateTwist(characterName, franchise);
      
      // Generate fake ID and timestamp
      const card_id = Math.floor(Math.random() * 1000) + 500;
      const timestamp = Date.now();
      
      // Set default image_path
      let image_path = `cards/card-${timestamp}.png`;
      
      // Ensure the cards directory exists
      const fs = require('fs');
      const path = require('path');
      const cardsDir = path.join(__dirname, 'cards');
      if (!fs.existsSync(cardsDir)) {
        fs.mkdirSync(cardsDir, { recursive: true });
      }
      
      // Generate the image
      try {
        // Generate image using the standard function
        console.log('Generating legendary image for:', character);
        const generatedImagePath = await generateImage(character);
        
        if (generatedImagePath) {
          console.log('Successfully generated legendary image:', generatedImagePath);
          image_path = generatedImagePath;
        }
      } catch (imageError) {
        console.error('Failed to generate legendary image:', imageError);
        // If image generation fails, throw error to be handled by the outer catch block
        throw imageError;
      }
      
      // Generate a dynamic description using the same function used for normal rolls
      let description = '';
      try {
        // Use the proper description generator with the twist
        description = await generateDescription(character, twist);
        console.log('Successfully generated description for legendary:', description.substring(0, 50) + '...');
      } catch (descError) {
        // Retry the description generation one more time
        console.error('Failed to generate description for legendary, retrying:', descError);
        try {
          description = await generateDescription(character, twist);
        } catch (retryError) {
          // If retry fails, throw the error to be handled by the outer catch block
          throw retryError;
        }
      }
      
      // Insert into database
      try {
        const user_id = req.body.user_id || 'web_user_1';
        const characterName = character.split(' (')[0];
        
        // Save to database
        const result = await db.run(
          'INSERT INTO cards (user_id, image_path, description, css, rarity, character) VALUES (?, ?, ?, ?, ?, ?)',
          [user_id, image_path, description, '', 'legendary', characterName]
        );
        
        const legendaryResponseData = {
          card_id: result.lastID || card_id,
          image_path,
          description,
          css: '',
          rarity: 'legendary',
          character,
          debug_info: {
            forced_rarity: 'legendary',
            request_body: req.body,
            message: 'Direct legendary intervention'
          }
        };
        
        return res.json(legendaryResponseData);
      } catch (dbError) {
        console.error('Database error in legendary handler:', dbError);
        
        // Fallback if database fails
        return res.json({
          card_id,
          image_path: 'cards/card-1742765808501.png',
          description,
          css: '',
          rarity: 'legendary',
          character,
          debug_info: {
            message: 'Legendary fallback (DB error)',
            error: String(dbError)
          }
        });
      }
    }
    
    // Normal request logging for non-mythic requests
    console.log('\n==== NEW ROLL REQUEST ====');
    console.log('FULL REQUEST BODY:', JSON.stringify(req.body));
    console.log('req.body typeof:', typeof req.body);
    console.log('req.body forced_rarity:', req.body.forced_rarity);
    console.log('forced_rarity typeof:', typeof req.body.forced_rarity);
    
    // Create a copy of the body to ensure we're not dealing with a reference issue
    const safeBody = {...req.body};
    console.log('Safe copy of body:', safeBody);
    console.log('Safe forced_rarity:', safeBody.forced_rarity);
    
    const { user_id, username, forced_rarity } = req.body;
    
    // Explicitly log forced rarity if present
    if (forced_rarity) {
      console.log(`FORCED RARITY DETECTED: "${forced_rarity}" (type: ${typeof forced_rarity})`);
      logger.info('FORCED RARITY DETECTED', { 
        forced_rarity,
        forced_rarity_type: typeof forced_rarity,
        body: JSON.stringify(req.body)
      });
    }
    
    // Use default guest user if no user_id or username provided
    const safe_user_id = user_id || `guest_${Date.now()}`;
    const safe_username = username || 'Guest User';
    
    try {
      // We already extracted forced_rarity above, don't redefine it
      
      // Add explicit debug log for forced rarity
      logger.info('DEBUG: Request body and forced rarity', { 
        body: req.body,
        forced_rarity_value: forced_rarity,
        forced_rarity_type: typeof forced_rarity
      });
      
      // Log the roll attempt
      logger.info('Roll attempt', { 
        user_id: safe_user_id, 
        username: safe_username, 
        forced_rarity: forced_rarity || 'none'
      });
      
      // Insert or update user
      await db.run('INSERT OR IGNORE INTO users (user_id, username) VALUES (?, ?)', [safe_user_id, safe_username]);
      
      // Determine card rarity and details (or use forced rarity)
      console.log('About to determine rarity. forced_rarity=', forced_rarity);
      
      // Check request body for mythic pattern
      const reqStr = JSON.stringify(req.body).toLowerCase();
      const forcedRarityStr = String(forced_rarity || '');
      
      console.log('Request body as string:', reqStr);
      console.log('Forced rarity as string:', forcedRarityStr);
      
      // MYTHIC FOUND IN REQUEST - PROCESS MYTHIC REQUEST PROPERLY
      if (reqStr.includes('mythic')) {
        console.log('⭐⭐⭐ MYTHIC FOUND IN REQUEST - PROCESSING MYTHIC! ⭐⭐⭐');
        
        // Generate a random mythic character
        const mythicCharacters = rarityTiers.mythic.characters;
        const character = mythicCharacters[Math.floor(Math.random() * mythicCharacters.length)];
        const characterName = character.split(' (')[0].trim();
        const franchise = character.split('(')[1]?.replace(')', '').trim() || '';
        
        // Generate a twist for the character from static list
        const twist = generateTwist(characterName, franchise);
        
        // Generate description through the proper generator with the same twist
        const description = await generateDescription(character, twist);
        
        // Generate image through the proper generator
        const image_path = await generateImage(character);
        
        // Generate an ID and add to database
        const card_id = Math.floor(Math.random() * 1000) + 900;
        const user_id = req.body.user_id || 'web_user_1';
        
        // Save to database
        const result = await db.run(
          'INSERT INTO cards (user_id, image_path, description, css, rarity, character) VALUES (?, ?, ?, ?, ?, ?)',
          [user_id, image_path, description, '', 'mythic', characterName]
        );
        
        return res.json({
          card_id: result.lastID || card_id,
          image_path,
          description,
          css: '',
          rarity: 'mythic',
          character,
          debug_info: {
            requested_rarity: 'mythic',
            final_rarity: 'mythic',
            was_forced: true
          }
        });
      }
      
      // Normal rarity determination code
      let rarity;
      
      // Check for mythic
      if (forcedRarityStr === 'mythic' || forcedRarityStr.toLowerCase() === 'mythic') {
        console.log('*** FORCING MYTHIC RARITY! ***');
        rarity = 'mythic';
      }
      // Check for other rarities
      else if (forced_rarity && rarityTiers[forcedRarityStr.toLowerCase() as keyof typeof rarityTiers]) {
        console.log(`*** FORCING RARITY: ${forced_rarity} ***`);
        rarity = forcedRarityStr.toLowerCase();
      }
      // Random determination as fallback
      else {
        console.log('No valid forced rarity found, determining randomly');
        rarity = await determineRarity(safe_user_id);
      }
      console.log('Rarity after determination:', rarity);
      
      // Make sure rarity is lowercase (if coming from frontend it might be capitalized)
      const normalizedRarity = typeof rarity === 'string' ? rarity.toLowerCase() : rarity;
      console.log('Normalized rarity:', normalizedRarity);
      
      // Import pity system
      const { updatePity, getRollsUntilPity } = require('./pityTracker');
      
      // Update pity counters for the user
      const updatedPity = updatePity(safe_user_id, normalizedRarity);
      const rollsUntilPity = getRollsUntilPity(safe_user_id);
      
      // Add debug log for final rarity determination
      logger.info('DEBUG: Rarity determined', {
        forced_rarity_input: forced_rarity,
        normalized_rarity: normalizedRarity,
        final_rarity_type: typeof normalizedRarity,
        available_rarities: Object.keys(rarityTiers),
        is_forced: !!forced_rarity,
        pity_info: {
          commonStreak: updatedPity.commonStreak,
          rollsUntilRare: rollsUntilPity.rare,
          rollsUntilEpic: rollsUntilPity.epic,
          totalRolls: updatedPity.totalRolls
        }
      });
      
      // Verify rarity is a valid key in rarityTiers
      if (!rarityTiers[normalizedRarity as keyof typeof rarityTiers]) {
        logger.error('Invalid rarity value', { rarity, normalizedRarity, forced_rarity });
        throw new Error(`Invalid rarity: ${normalizedRarity}`);
      }
      
      // Get the characters for this rarity tier
      const { characters } = rarityTiers[normalizedRarity as keyof typeof rarityTiers];
      
      // Extra debug for mythic or legendary
      if (normalizedRarity === 'mythic' || normalizedRarity === 'legendary') {
        console.log(`Available ${normalizedRarity} characters:`, characters);
      }
      
      // Select a random character
      const characterIndex = Math.floor(Math.random() * characters.length);
      const character = characters[characterIndex];
      
      // Extra logging for special rarities
      if (normalizedRarity === 'mythic' || normalizedRarity === 'legendary') {
        console.log(`Selected ${normalizedRarity} character at index ${characterIndex}:`, character);
      }
      
      // Extract character name and franchise for enhancement generation
      const characterMatch = character.match(/^(.*?)\s*\((.*?)\)$/);
      let characterName = character;
      let franchise = '';
      
      if (characterMatch) {
        characterName = characterMatch[1].trim();
        franchise = characterMatch[2].trim();
      }
      
      // Generate a twist for the character from static list
      const twist = generateTwist(characterName, franchise);
      
      // Log the card details before generation
      logger.info('Card details determined', { user_id, character, rarity, twist });
      
      // Log the twist for debugging
      logger.info('ROUTE TWIST DEBUG', {
        generatedTwist: twist,
        twistType: typeof twist,
        twistLength: twist.length,
        characterName,
        franchise,
        endpoint: '/roll',
        timestamp: Date.now(),
        location: 'normal-rarity-determination'
      });
      
      // First generate the image using the character with the twist
      const image_path = await generateImage(character);
      
      // Extract character name for database storage (without franchise)
      // Variable already defined above, reusing it
      if (character.includes('(')) {
        characterName = character.split('(')[0].trim();
      }
      
      // Then generate the description with the exact same twist to ensure consistency
      const description = await generateDescription(character, twist);
      
      // We're not using CSS generation anymore with PicoCSS
      const css = '';
      
      // Save card to database
      const result = await db.run(
        'INSERT INTO cards (user_id, image_path, description, css, rarity, character) VALUES (?, ?, ?, ?, ?, ?)',
        [safe_user_id, image_path, description, css, normalizedRarity, characterName]
      );
      
      const card_id = result.lastID;
      
      // Log successful card generation
      logger.info('Card generated successfully', { card_id, user_id, character, rarity: normalizedRarity });
      
      // Create response object with pity information
      const responseData = {
        card_id,
        image_path,
        description,
        css,
        rarity: normalizedRarity,
        character,
        pity_info: {
          rolls_until_rare: rollsUntilPity.rare,
          rolls_until_epic: rollsUntilPity.epic,
          rolls_until_legendary: rollsUntilPity.legendary,
          rolls_until_mythic: rollsUntilPity.mythic,
          common_streak: updatedPity.commonStreak,
          total_rolls: updatedPity.totalRolls,
          guaranteed_next_rarity: updatedPity.guaranteedNextRarity || null
        },
        debug_info: {
          requested_rarity: forced_rarity,
          final_rarity: normalizedRarity,
          was_forced: !!forced_rarity
        }
      };
      
      // Debug log the response
      console.log('SENDING RESPONSE WITH RARITY:', normalizedRarity);
      console.log('FULL RESPONSE:', responseData);
      
      // Return card data
      res.json(responseData);
    } catch (error: any) {
      // Check if this is a 503 error from Hugging Face
      const is503Error = error.response && error.response.status === 503;
      // Check for timeout errors
      const isTimeoutError = error.message && (error.message.includes('timeout') || error.code === 'ECONNABORTED');
      
      if (isTimeoutError) {
        logger.warn('Card generation timed out', { user_id, username, error: error.message });
        res.status(503).json({ 
          error: 'The image generation API took longer than expected. Please try again shortly.',
          serverOverloaded: true,
          isTimeout: true
        });
      } else if (is503Error) {
        logger.warn('Card generation affected by Hugging Face API overload', { user_id, username, status: 503 });
        res.status(503).json({ 
          error: 'Image servers are currently busy. Please try again in a few minutes!',
          serverOverloaded: true
        });
      } else {
        logger.error('Card generation error', { error: error.message, user_id, username });
        res.status(500).json({ error: 'The AI is recalibrating—try again!' });
      }
    }
  });
  
  // Endpoint to get a user's card collection - no authentication required
  app.get('/collection/:user_id', (req, res, next) => {
    // Special handling for OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  }, async (req, res) => {
    const user_id = req.params.user_id;
    
    try {
      logger.info('Collection request', { user_id });
      
      const cards = await db.all('SELECT * FROM cards WHERE user_id = ?', [user_id]);
      
      logger.info('Collection retrieved', { user_id, count: cards.length });
      res.json(cards);
    } catch (error: any) {
      // Check if this is a 503 error from Hugging Face
      const is503Error = error.response && error.response.status === 503;
      
      if (is503Error) {
        logger.warn('Collection retrieval affected by Hugging Face API overload', { user_id, status: 503 });
        res.status(503).json({ 
          error: 'Image servers are currently busy. Please try again in a few minutes.',
          serverOverloaded: true
        });
      } else {
        logger.error('Collection retrieval error', { error: error.message, user_id });
        res.status(500).json({ error: 'Could not retrieve collection' });
      }
    }
  });
  
  // Endpoint to get the leaderboard
  app.get('/leaderboard', async (req, res) => {
    try {
      logger.info('Leaderboard request');
      
      const leaderboard = await db.all(`
        SELECT u.username, SUM(CASE c.rarity 
          WHEN 'common' THEN 1 
          WHEN 'rare' THEN 10 
          WHEN 'epic' THEN 100 
          WHEN 'legendary' THEN 1000 
          WHEN 'mythic' THEN 10000 
          ELSE 0 END) as points,
          COUNT(c.card_id) as total_cards
        FROM users u LEFT JOIN cards c ON u.user_id = c.user_id
        GROUP BY u.user_id, u.username
        ORDER BY points DESC LIMIT 10
      `);
      
      logger.info('Leaderboard retrieved', { count: leaderboard.length });
      res.json(leaderboard);
    } catch (error: any) {
      // Check if this is a 503 error from Hugging Face
      const is503Error = error.response && error.response.status === 503;
      
      if (is503Error) {
        logger.warn('Leaderboard retrieval affected by Hugging Face API overload', { status: 503 });
        res.status(503).json({ 
          error: 'Image servers are currently busy. Leaderboard is available but some data may be incomplete.',
          serverOverloaded: true
        });
      } else {
        logger.error('Leaderboard retrieval error', { error: error.message });
        res.status(500).json({ error: 'Could not retrieve leaderboard' });
      }
    }
  });
  
  // Endpoint to get a user's pity information - no authentication required
  app.get('/pity/:user_id', (req, res, next) => {
    // Special handling for OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  }, async (req, res) => {
    const user_id = req.params.user_id;
    
    try {
      logger.info('Pity info request', { user_id });
      
      // Import pity system functions
      const { getUserPity, getRollsUntilPity, ensurePityData } = require('./pityTracker');
      
      // Ensure the user has pity data
      ensurePityData(user_id);
      
      // Get the user's pity data
      const pityData = getUserPity(user_id);
      const rollsUntilPity = getRollsUntilPity(user_id);
      
      // Create response with pity information
      const pityInfo = {
        rolls_until_rare: rollsUntilPity.rare,
        rolls_until_epic: rollsUntilPity.epic,
        rolls_until_legendary: rollsUntilPity.legendary,
        rolls_until_mythic: rollsUntilPity.mythic,
        common_streak: pityData.commonStreak,
        total_rolls: pityData.totalRolls,
        guaranteed_next_rarity: pityData.guaranteedNextRarity || null
      };
      
      logger.info('Pity info retrieved', { user_id });
      res.json(pityInfo);
    } catch (error: any) {
      logger.error('Pity info retrieval error', { error: error.message, user_id });
      res.status(500).json({ error: 'Could not retrieve pity information' });
    }
  });
  
  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Check if this is a 503 error
    const is503Error = err.response && err.response.status === 503;
    
    if (is503Error) {
      logger.warn('Unhandled 503 error - service overloaded', { 
        url: req.url, 
        method: req.method, 
        status: 503 
      });
      
      res.status(503).json({ 
        error: 'Image generation servers are currently busy. Please try again in a few minutes.',
        serverOverloaded: true
      });
    } else {
      logger.error('Unhandled error', { 
        error: err.message || err, 
        url: req.url, 
        method: req.method 
      });
      
      res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
  });
  
  return app;
}