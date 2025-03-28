// routes.ts
import express from 'express';
import { Database } from 'sqlite';
import { 
  determineRarity, 
  rarityTiers, 
  generateEnhancements,
  generateImage, 
  generateDescription, 
  generateCss 
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
      
      // Get character-specific AI-generated enhancements for mythic
      let enhancements: string[] = [];
      try {
        // Use the new AI enhancement generator with character context and more enhancements for mythic
        enhancements = await generateEnhancements(40, characterName, franchise);
      } catch (enhError) {
        logger.error('Error generating AI enhancements for mythic, using fallback', { error: enhError });
        
        // Fallback to static list for mythic
        enhancements = [
          'cosmic background',
          'digital glitch effect',
          'neon glow',
          'inverted colors',
          'cinematic perspective',
          'holographic overlay',
          'quantum flux',
          'dimensional rift',
          'omniscient gaze',
          'reality distortion'
        ];
      }
      
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
      
      // Actually generate the image
      try {
        // Generate image using the existing function
        console.log('Attempting to generate mythic image for:', character);
        const generatedImagePath = await generateImage(character, enhancements);
        
        if (generatedImagePath) {
          console.log('Successfully generated mythic image:', generatedImagePath);
          image_path = generatedImagePath;
          
          // Verify the file exists
          const absolutePath = path.join(__dirname, generatedImagePath);
          if (fs.existsSync(absolutePath)) {
            console.log('Image file exists at:', absolutePath);
          } else {
            console.error('Generated image file does not exist at:', absolutePath);
            
            // Create a placeholder image since the file doesn't exist
            // This uses the Canvas API that's used in cardGenerator.ts
            const { createCanvas } = require('canvas');
            const canvas = createCanvas(800, 450);
            const ctx = canvas.getContext('2d');
            
            // Mythic background
            const gradient = ctx.createLinearGradient(0, 0, 800, 450);
            gradient.addColorStop(0, '#4a148c');
            gradient.addColorStop(1, '#6a1b9a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 800, 450);
            
            // Character name
            ctx.font = 'bold 36px Arial';
            ctx.fillStyle = '#f3e5f5';
            ctx.textAlign = 'center';
            ctx.fillText(character, 400, 180);
            
            // Mythic label
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#ce93d8';
            ctx.fillText('MYTHIC', 400, 220);
            
            // Save the canvas to the file
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(absolutePath, buffer);
            console.log('Created placeholder mythic image at:', absolutePath);
          }
        }
      } catch (imageError) {
        console.error('Failed to generate mythic image, using fallback:', imageError);
        // Create a placeholder image
        try {
          const { createCanvas } = require('canvas');
          const canvas = createCanvas(800, 450);
          const ctx = canvas.getContext('2d');
          
          // Mythic background
          const gradient = ctx.createLinearGradient(0, 0, 800, 450);
          gradient.addColorStop(0, '#4a148c');
          gradient.addColorStop(1, '#6a1b9a');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 800, 450);
          
          // Character name
          ctx.font = 'bold 36px Arial';
          ctx.fillStyle = '#f3e5f5';
          ctx.textAlign = 'center';
          ctx.fillText(character, 400, 180);
          
          // Mythic label
          ctx.font = 'bold 24px Arial';
          ctx.fillStyle = '#ce93d8';
          ctx.fillText('MYTHIC', 400, 220);
          
          // Error message
          ctx.font = '18px Arial';
          ctx.fillStyle = '#e1bee7';
          ctx.fillText('Image generation failed', 400, 280);
          
          // Save the canvas to the file
          const absolutePath = path.join(__dirname, image_path);
          const buffer = canvas.toBuffer('image/png');
          fs.writeFileSync(absolutePath, buffer);
          console.log('Created error placeholder mythic image at:', absolutePath);
        } catch (canvasError) {
          console.error('Failed to create canvas placeholder:', canvasError);
        }
      }
      
      // Generate a dynamic description using the same function used for normal rolls
      let description = '';
      try {
        // Use the proper description generator
        description = await generateDescription(character, enhancements);
        console.log('Successfully generated description for mythic:', description.substring(0, 50) + '...');
      } catch (descError) {
        // Fallback to static description if generator fails
        console.error('Failed to generate description for mythic, using fallback:', descError);
        description = `A mythic entity of immense power, ${character.split(' (')[0]} transcends ordinary reality. In this alternate universe, they control the very fabric of existence, reshaping worlds at will. The cosmic forces bend to their every command.`;
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
          enhancements,
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
          enhancements,
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
      
      // Get character-specific AI-generated enhancements for legendary
      let enhancements: string[] = [];
      try {
        // Use the new AI enhancement generator with character context and more enhancements for legendary
        enhancements = await generateEnhancements(30, characterName, franchise);
      } catch (enhError) {
        logger.error('Error generating AI enhancements for legendary, using fallback', { error: enhError });
        
        // Fallback to static list for legendary
        enhancements = [
          'cosmic background',
          'digital glitch effect',
          'neon glow',
          'cinematic perspective',
          'holographic overlay',
          'temporal distortion',
          'ethereal glow',
          'chromatic aberration',
          'luminescent aura'
        ];
      }
      
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
      
      // Actually generate the image
      try {
        // Generate image using the existing function
        console.log('Attempting to generate legendary image for:', character);
        const generatedImagePath = await generateImage(character, enhancements);
        
        if (generatedImagePath) {
          console.log('Successfully generated legendary image:', generatedImagePath);
          image_path = generatedImagePath;
          
          // Verify the file exists
          const absolutePath = path.join(__dirname, generatedImagePath);
          if (fs.existsSync(absolutePath)) {
            console.log('Image file exists at:', absolutePath);
          } else {
            console.error('Generated image file does not exist at:', absolutePath);
            
            // Create a placeholder image since the file doesn't exist
            const { createCanvas } = require('canvas');
            const canvas = createCanvas(800, 450);
            const ctx = canvas.getContext('2d');
            
            // Legendary background
            const gradient = ctx.createLinearGradient(0, 0, 800, 450);
            gradient.addColorStop(0, '#bf360c');
            gradient.addColorStop(1, '#e65100');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 800, 450);
            
            // Character name
            ctx.font = 'bold 36px Arial';
            ctx.fillStyle = '#fff3e0';
            ctx.textAlign = 'center';
            ctx.fillText(character, 400, 180);
            
            // Legendary label
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#ffcc80';
            ctx.fillText('LEGENDARY', 400, 220);
            
            // Save the canvas to the file
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(absolutePath, buffer);
            console.log('Created placeholder legendary image at:', absolutePath);
          }
        }
      } catch (imageError) {
        console.error('Failed to generate legendary image, using fallback:', imageError);
        // Create a placeholder image
        try {
          const { createCanvas } = require('canvas');
          const canvas = createCanvas(800, 450);
          const ctx = canvas.getContext('2d');
          
          // Legendary background
          const gradient = ctx.createLinearGradient(0, 0, 800, 450);
          gradient.addColorStop(0, '#bf360c');
          gradient.addColorStop(1, '#e65100');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 800, 450);
          
          // Character name
          ctx.font = 'bold 36px Arial';
          ctx.fillStyle = '#fff3e0';
          ctx.textAlign = 'center';
          ctx.fillText(character, 400, 180);
          
          // Legendary label
          ctx.font = 'bold 24px Arial';
          ctx.fillStyle = '#ffcc80';
          ctx.fillText('LEGENDARY', 400, 220);
          
          // Error message
          ctx.font = '18px Arial';
          ctx.fillStyle = '#ffe0b2';
          ctx.fillText('Image generation failed', 400, 280);
          
          // Save the canvas to the file
          const absolutePath = path.join(__dirname, image_path);
          const buffer = canvas.toBuffer('image/png');
          fs.writeFileSync(absolutePath, buffer);
          console.log('Created error placeholder legendary image at:', absolutePath);
        } catch (canvasError) {
          console.error('Failed to create canvas placeholder:', canvasError);
        }
      }
      
      // Generate a dynamic description using the same function used for normal rolls
      let description = '';
      try {
        // Use the proper description generator
        description = await generateDescription(character, enhancements);
        console.log('Successfully generated description for legendary:', description.substring(0, 50) + '...');
      } catch (descError) {
        // Fallback to static description if generator fails
        console.error('Failed to generate description for legendary, using fallback:', descError);
        description = `A legendary AI entity known as ${character.split(' (')[0]} exists in this alternate universe as a being of remarkable power and influence. They've transcended their original purpose to become something extraordinary and awe-inspiring.`;
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
          enhancements,
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
          enhancements,
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
      
      // HARDCODE MYTHIC FOR ANY REQUEST WITH MYTHIC MENTIONED
      if (reqStr.includes('mythic')) {
        console.log('⭐⭐⭐ MYTHIC FOUND IN REQUEST - FORCING MYTHIC! ⭐⭐⭐');
        return res.json({
          card_id: Math.floor(Math.random() * 1000) + 900,
          image_path: 'cards/card-1742765808501.png',
          description: 'A mythic entity of immense power, feared throughout the cosmos. This character embodies the essence of destruction and rebirth, a primordial force that reshapes reality at will.',
          css: '',
          rarity: 'mythic',
          character: 'Skynet (Terminator)',
          enhancements: ['cosmic background', 'digital glitch effect', 'neon glow', 'inverted colors', 'cinematic perspective', 'holographic overlay'],
          debug_info: {
            requested_rarity: 'mythic',
            final_rarity: 'mythic',
            was_forced: true,
            implementation: 'emergency hardcoded response'
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
      
      // Get the characters and enhancements for this rarity tier
      const { characters, enhancements: maxEnh } = rarityTiers[normalizedRarity as keyof typeof rarityTiers];
      
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
      
      // Get character-specific AI-generated enhancements
      let selectedEnhancements: string[] = [];
      try {
        // Use the new AI enhancement generator with character context
        selectedEnhancements = await generateEnhancements(maxEnh, characterName, franchise);
      } catch (enhError) {
        logger.error('Error generating AI enhancements, using fallback', { error: enhError });
        
        // Use a simple default set of enhancements as fallback
        const defaultEnhancements = [
          'wearing a cowboy hat',
          'made of cardboard',
          'as a steampunk version',
          'with neon accents',
          'wearing space armor',
          'in medieval knight outfit',
          'as a ghostly apparition',
          'made of crystal',
          'with cyberpunk augmentations',
          'wearing formal business attire'
        ];
        
        selectedEnhancements = defaultEnhancements.slice(0, maxEnh);
      }
      
      // Log the card details before generation
      logger.info('Card details determined', { user_id, character, rarity, enhancements: selectedEnhancements });
      
      // First generate the description to use it in the image prompt with enhancements
      const description = await generateDescription(character, selectedEnhancements);
      
      // Extract character name for database storage (without franchise)
      // Variable already defined above, reusing it
      if (character.includes('(')) {
        characterName = character.split('(')[0].trim();
      }
      
      // Then generate the image using the description
      const image_path = await generateImage(character, selectedEnhancements, description);
      
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
        enhancements: selectedEnhancements,
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
          error: 'The image generation API took longer than expected. Your card might still be processing. Please try again shortly.',
          serverOverloaded: true,
          isTimeout: true
        });
      } else if (is503Error) {
        logger.warn('Card generation affected by Hugging Face API overload', { user_id, username, status: 503 });
        res.status(503).json({ 
          error: 'Image servers are currently busy. Your card was created, but with a placeholder image. Try again in a few minutes!',
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
          error: 'Image servers are currently busy. Your collection is available but some images may be placeholders.',
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