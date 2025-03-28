// cardGenerator.ts
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import logger from './logger';

// Define rarity tiers and character pools with franchise information
export const rarityTiers = {
  common: { 
    probability: 0.9, 
    characters: ['C-3PO (Star Wars)', 'R2-D2 (Star Wars)', 'Data (Star Trek)', 'TARS (Interstellar)', 'Baymax (Big Hero 6)'] 
  },
  rare: { 
    probability: 0.09, 
    characters: ['HAL 9000 (2001: A Space Odyssey)', 'T-800 (The Terminator)', 'WALL-E (WALL-E)', 'Optimus Prime (Transformers)', 'EVE (WALL-E)'] 
  },
  epic: { 
    probability: 0.009, 
    characters: ['Ultron (Marvel)', 'Vision (Marvel)', 'Sentinels (X-Men)', 'Hosts (Westworld)', 'Robocop (Robocop)'] 
  },
  legendary: { 
    probability: 0.001, 
    characters: ['GLaDOS (Portal)', 'T-1000 (Terminator 2)', 'VIKI (I, Robot)', 'Ava (Ex Machina)', 'Samantha (Her)'] 
  },
  mythic: { 
    probability: 0.000001, 
    characters: ['Skynet (Terminator)', 'Agent Smith (The Matrix)', 'SHODAN (System Shock)', 'AM (I Have No Mouth and I Must Scream)', 'Wintermute (Neuromancer)'] 
  },
};

// Function to generate a single twist enhancement for the 4-element prompt
export async function generateTwist(character?: string, franchise?: string): Promise<string> {
  try {
    // Check if we have API key
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('No ANTHROPIC_API_KEY found, returning default twist');
      // Default twists that work well with most characters
      const defaultTwists = [
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
      // Get a truly random twist from the array
      const randomIndex = Math.floor(Math.random() * defaultTwists.length);
      const selectedTwist = defaultTwists[randomIndex];
      
      logger.info('Using random default twist due to missing API key', { 
        twist: selectedTwist, 
        character,
        randomIndex,
        totalTwists: defaultTwists.length
      });
      
      return selectedTwist;
    }
    
    // Prompt specifically for a single wacky twist
    const twistPrompt = `
    <human>
    Generate ONE unique, wacky "alternate universe" twist for ${character} from ${franchise}.
    
    This should be a creative, unexpected modification to the character that would be interesting to see in an AI-generated image.
    
    Examples:
    - "wearing a cowboy hat"
    - "made entirely of cardboard"
    - "as a 1980s aerobics instructor"
    - "reimagined as a Victorian gentleman"
    - "transformed into a pizza delivery person"
    
    Your response must be ONLY the twist itself (3-6 words), with no explanation, introduction, or additional text.
    Make it unexpected but recognizable as the character.
    </human>`;
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 50,
        messages: [
          { role: "user", content: twistPrompt }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        timeout: 10000
      }
    );
    
    let twist = response.data.content[0].text.trim();
    
    // Clean up the response
    twist = twist
      .replace(/^"/, '') // Remove starting quote if present
      .replace(/"$/, '') // Remove ending quote if present
      .toLowerCase();
    
    // Critical check: If the response is empty or suspicious, use a default twist
    if (!twist || twist.length < 3 || twist === 'groovy') {
      logger.warn('Received invalid twist from API, using fallback', { 
        receivedTwist: twist,
        character 
      });
      
      const fallbackTwists = [
        'wearing a cowboy hat',
        'made of cardboard',
        'as a steampunk version',
        'with neon accents',
        'in a superhero costume',
        'as a pirate captain',
        'in a tuxedo',
        'as a chef',
        'reimagined as an astronaut',
        'made of glass',
        'in a hawaiian shirt'
      ];
      
      // Get a truly random twist from the array
      const randomIndex = Math.floor(Math.random() * fallbackTwists.length);
      twist = fallbackTwists[randomIndex];
    }
    
    logger.info('Generated twist for character', { twist, character });
    
    return twist;
  } catch (error) {
    logger.error('Error generating twist', { error, character });
    // Default twists if API call fails
    const fallbackTwists = [
      'wearing a cowboy hat',
      'made of cardboard',
      'as a steampunk version',
      'with neon accents',
      'in a superhero costume',
      'as a pirate captain',
      'in a tuxedo',
      'as a chef',
      'reimagined as an astronaut',
      'made of glass',
      'in a hawaiian shirt'
    ];
    
    // Get a truly random twist from the array using a different method to ensure randomness
    const timestamp = Date.now();
    const randomIndex = timestamp % fallbackTwists.length;
    const selectedTwist = fallbackTwists[randomIndex];
    
    logger.info('Using error fallback twist', { 
      twist: selectedTwist, 
      method: 'timestamp-modulus',
      timestamp,
      randomIndex
    });
    
    return selectedTwist;
  }
}


// Image Generation with simplified 4-element prompt approach
export async function generateImage(character: string, description: string = '') {
  try {
    // Extract character name and franchise (Elements 1 & 2)
    const characterMatch = character.match(/^(.*?)\s*\((.*?)\)$/);
    let characterName = character;
    let franchise = '';
    
    if (characterMatch) {
      characterName = characterMatch[1].trim();
      franchise = characterMatch[2].trim();
    }
    
    // Check if we have API keys
    if (!process.env.HUGGING_FACE_API_KEY) {
      logger.warn('Missing API key, creating error image', { 
        huggingface: !!process.env.HUGGING_FACE_API_KEY 
      });
      
      // Create an error image instead of using a generic placeholder
      const errorImagePath = await createErrorImage(characterName, franchise, "API key not configured");
      return errorImagePath;
    }
    
    // Element 3: Single Wacky Alternate-Universe Twist
    const twist = await generateTwist(characterName, franchise);
    
    // Element 4: Positive/Negative Language
    const positivePrompts = "highly detailed, ultra realistic, professional quality";
    // Add aspect ratio to match the card's image frame (width/height ratio for 100% width and 62% height of a 5:7 card)
    // This gives us approximately a 16:10 or 1.6:1 aspect ratio
    const negativePrompts = "not cartoonish, not colorful, not blurry, not distorted, aspect ratio 16:10";
    
    // Construct the simplified prompt with the 4 elements
    const prompt = `${characterName} from ${franchise} ${twist}, ${positivePrompts}, ${negativePrompts}`;
    
    logger.info('Generated simplified 4-element prompt', { prompt });
    
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-large',
        {
          inputs: prompt,
          parameters: {
            num_inference_steps: 80,
            guidance_scale: 9.0,
            // Adjusted dimensions to match 16:10 aspect ratio for better fit in card frame
            height: 640,
            width: 1024,
            negative_prompt: "text, watermark, blurry, distorted, low quality, disfigured"
          }
        },
        { 
          headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}` },
          responseType: 'arraybuffer',
          timeout: 120000 // 120 seconds
        }
      );
      
      const timestamp = Date.now();
      const imagePath = `cards/card-${timestamp}.png`;
      
      // For Render deployment, use persistent disk storage
      const cardsDir = process.env.RENDER ? '/opt/render/project/src/gacha-roller/cards' : path.join(__dirname, 'cards');
      
      // Create directory if needed
      if (!fs.existsSync(cardsDir)) {
        fs.mkdirSync(cardsDir, { recursive: true });
        logger.info('Created cards directory', { cardsDir });
      }
      
      const absolutePath = process.env.RENDER ? path.join(cardsDir, `card-${timestamp}.png`) : path.join(__dirname, imagePath);
      fs.writeFileSync(absolutePath, Buffer.from(response.data));
      
      // Always use relative path for the API response
      const returnPath = `cards/card-${timestamp}.png`;
      logger.info('Image generated successfully', { imagePath: returnPath, absolutePath });
      return returnPath;
    } catch (error: any) {
      // Log the error
      logger.error('Error generating image', { error: error.message });
      
      // Try with fallback model
      try {
        logger.info('Trying with fallback model runwayml/stable-diffusion-v1-5');
        const fallbackResponse = await axios.post(
          'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
          { 
            inputs: prompt,
            parameters: {
              num_inference_steps: 50,
              guidance_scale: 8.0,
              // Adjusted dimensions to match 16:10 aspect ratio for better fit in card frame
              height: 640,
              width: 1024,
              negative_prompt: "text, watermark, blurry, distorted, low quality"
            }
          },
          { 
            headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}` },
            responseType: 'arraybuffer',
            timeout: 90000
          }
        );
        
        const timestamp = Date.now();
        const imagePath = `cards/card-${timestamp}.png`;
        
        // For Render deployment, use persistent disk storage
        const cardsDir = process.env.RENDER ? '/opt/render/project/src/gacha-roller/cards' : path.join(__dirname, 'cards');
        
        // Create directory if needed
        if (!fs.existsSync(cardsDir)) {
          fs.mkdirSync(cardsDir, { recursive: true });
          logger.info('Created cards directory for fallback', { cardsDir });
        }
        
        const absolutePath = process.env.RENDER ? path.join(cardsDir, `card-${timestamp}.png`) : path.join(__dirname, imagePath);
        fs.writeFileSync(absolutePath, Buffer.from(fallbackResponse.data));
        
        // Always use relative path for the API response
        const returnPath = `cards/card-${timestamp}.png`;
        logger.info('Image generated with fallback model', { imagePath: returnPath, absolutePath });
        return returnPath;
      } catch (fallbackError) {
        // If fallback fails, create an error image
        logger.error('Fallback image generation failed', { error: fallbackError });
        const errorReason = error.response?.status === 503 ? "Service Overloaded" : "Image API Failed";
        const errorImagePath = await createErrorImage(characterName, franchise, errorReason);
        return errorImagePath;
      }
    }
  } catch (error) {
    logger.error('Fatal error in image generation process', { error });
    const errorImagePath = await createErrorImage(character, "", "Image Generation Error");
    return errorImagePath;
  }
}

// Helper function to create error images instead of using placeholders
async function createErrorImage(character: string, franchise: string, errorMessage: string): Promise<string> {
  try {
    const { createCanvas } = require('canvas');
    const timestamp = Date.now();
    const errorImagePath = `cards/error-${timestamp}.png`;
    const cardsDir = process.env.RENDER ? '/opt/render/project/src/gacha-roller/cards' : path.join(__dirname, 'cards');
    
    // Create directory if needed
    if (!fs.existsSync(cardsDir)) {
      fs.mkdirSync(cardsDir, { recursive: true });
      logger.info('Created cards directory for error images', { cardsDir });
    }
    
    const absolutePath = process.env.RENDER ? path.join(cardsDir, `error-${timestamp}.png`) : path.join(__dirname, errorImagePath);
    // Always use relative path for returning to the API
    
    // Create error image with Canvas
    const canvas = createCanvas(1024, 640); // Match the updated 16:10 aspect ratio image dimensions
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1024, 640);
    gradient.addColorStop(0, '#1a1625');
    gradient.addColorStop(1, '#2d1b33');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 640);
    
    // Error border
    ctx.strokeStyle = '#e53e3e';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 1024 - 40, 640 - 40);
    
    // Error text
    ctx.textAlign = 'center';
    
    // "Image API Failed" header
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#e53e3e';
    ctx.fillText(errorMessage, 512, 130);
    
    // Character info
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(character, 512, 220);
    
    if (franchise) {
      ctx.font = 'italic 28px Arial';
      ctx.fillText(`from ${franchise}`, 512, 270);
    }
    
    // Additional explanation
    ctx.font = '24px Arial';
    ctx.fillText('Unable to generate image from AI service.', 512, 350);
    ctx.fillText('Please try again later.', 512, 390);
    
    // Save the canvas to a file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(absolutePath, buffer);
    
    // Always use relative path for API response
    const returnPath = `cards/error-${timestamp}.png`;
    logger.info('Created error image', { errorImagePath: returnPath, absolutePath });
    return returnPath;
  } catch (error) {
    logger.error('Error creating error image', { error });
    return 'cards/generic-placeholder.png'; // Last resort fallback
  }
}

// Text Description Generation (Anthropic)
export async function generateDescription(character: string, providedTwist?: string) {
  try {
    logger.info('Generating description', { character, providedTwist });
    
    // Extract character name and franchise for better prompt
    const characterMatch = character.match(/^(.*?)\s*\((.*?)\)$/);
    let characterName = character;
    let franchise = '';
    
    if (characterMatch) {
      characterName = characterMatch[1].trim();
      franchise = characterMatch[2].trim();
    }
    
    // Check if we have an API key
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('No ANTHROPIC_API_KEY found, returning error message', { character });
      return `Error: Unable to generate a description for ${characterName} from ${franchise}. API connection failed.`;
    }
    
    // Use the provided twist if available, otherwise generate a new one
    let twist = providedTwist || '';
    if (!twist) {
      try {
        twist = await generateTwist(characterName, franchise);
        logger.info('Generated twist for description because none was provided', { twist, character });
      } catch (twistError) {
        logger.error('Error generating twist for description, using default', { error: twistError });
        twist = 'in an unexpected situation';
      }
    } else {
      logger.info('Using provided twist for description', { twist, character });
    }
    
    // Ultra-concise prompt for creating a 30-word card description with twist
    const prompt = `
    <human>
    Write an EXTREMELY BRIEF trading card description (EXACTLY 30 WORDS MAXIMUM) for ${characterName} from ${franchise} who is "${twist}".
    
    Your description MUST:
    - Be EXACTLY 30 WORDS OR LESS (this is absolutely critical)
    - Be witty and humorous
    - Focus on the character being "${twist}"
    - Include one clever wordplay if possible
    - End with a punchy line
    
    CRITICAL REQUIREMENTS:
    - MUST BE 30 WORDS OR FEWER - COUNT CAREFULLY
    - ONLY include the card description with no explanation
    - NO introduction or commentary
    - NO message formatting
    - Make it FUN and MEMORABLE
    </human>`;
    
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: "claude-3-5-sonnet-20240620",  // Updated to Sonnet 3.5
          max_tokens: 100, // Significantly reduced for 30-word responses
          messages: [
            { role: "user", content: prompt }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      let description = response.data.content[0].text;
      
      // Clean up the description to remove any explanatory text and Claude formatting markers
      description = description
        .replace(/^(Here is|Here's|I've written) a (short |brief |100-word |)(story|tale|micro-fiction) about .*?:\s*/i, '')
        .replace(/^In this (alternate universe|story|world|scenario),?\s*/i, '')
        .replace(/^Here goes:?\s*/i, '')
        .replace(/<\/?assistant>$/i, '')  // Remove any closing assistant tags
        .trim();
      
      logger.info('Description generated successfully', { description: description.substring(0, 50) + '...' });
      
      return description;
    } catch (apiError) {
      logger.error('API error in description generation', { error: apiError, character });
      return `Error: Unable to generate a description for ${characterName} from ${franchise}. API connection failed.`;
    }
  } catch (error) {
    logger.error('Error generating description', { error, character });
    return `Error: Unable to generate a description for ${character}. API connection failed.`;
  }
}

// Import for TypeScript type checking only (to prevent circular dependencies)
import type { checkPityUpgrade as CheckPityUpgradeType } from './pityTracker';

// Determine rarity based on probabilities and pity system
export async function determineRarity(userId?: string) {
  // Standard rarity determination without pity
  const rand = Math.random();
  let cumulative = 0;
  let normalRarity = 'common'; // Default
  
  for (const [rarity, { probability }] of Object.entries(rarityTiers)) {
    cumulative += probability;
    if (rand < cumulative) {
      normalRarity = rarity;
      break;
    }
  }
  
  // If no userId provided, return standard rarity (no pity)
  if (!userId) {
    logger.info('Determined rarity without pity', { rarity: normalRarity, roll: rand });
    return normalRarity;
  }
  
  try {
    // Import pity system (we do it here to avoid circular dependencies)
    // We use a dynamic import inside a try/catch to handle edge cases
    const { checkPityUpgrade } = require('./pityTracker');
    
    // Check if we need to upgrade the rarity due to pity
    const pityUpgrade = checkPityUpgrade(userId);
    
    if (pityUpgrade) {
      const rarityOrder = ['common', 'rare', 'epic', 'legendary', 'mythic'];
      const normalRarityIndex = rarityOrder.indexOf(normalRarity);
      const pityRarityIndex = rarityOrder.indexOf(pityUpgrade);
      
      // Take the higher of the two rarities
      if (pityRarityIndex > normalRarityIndex) {
        logger.info('Pity upgraded rarity', { 
          userId,
          normalRarity, 
          pityUpgrade, 
          roll: rand 
        });
        return pityUpgrade;
      }
    }
  } catch (error) {
    // If there's any issue with the pity system, log it but continue with normal rarity
    logger.error('Error checking pity upgrade, using normal rarity', { error, userId });
  }
  
  logger.info('Determined final rarity', { userId, rarity: normalRarity, roll: rand });
  return normalRarity;
}