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
    characters: ['Ultron (Marvel)', 'Vision (Marvel)', 'Sentinels (X-Men)', 'Robocop (Robocop)'] 
  },
  legendary: { 
    probability: 0.001, 
    characters: ['GLaDOS (Portal)', 'T-1000 (Terminator 2)', 'VIKI (I, Robot)', 'Ava (Ex Machina)'] 
  },
  mythic: { 
    probability: 0.000001, 
    characters: ['Skynet (Terminator)', 'Agent Smith (The Matrix)'] 
  },
};

// Consolidated list of all static twists for character image generation
export const staticTwists = [
  // Original default twists
  'wearing a cowboy hat',
  'made of cardboard',
  'as a steampunk version',
  'with neon accents',
  'wearing space armor',
  'in medieval knight outfit',
  'as a ghostly apparition',
  'made of crystal',
  'with cyberpunk augmentations',
  'wearing formal business attire',
  
  // Fallback twists
  'in a superhero costume',
  'as a pirate captain',
  'in a tuxedo',
  'as a chef',
  'reimagined as an astronaut',
  'made of glass',
  'in a hawaiian shirt',
  
  // Additional twists from examples and expanded options
  'as a 1980s aerobics instructor',
  'reimagined as a Victorian gentleman',
  'transformed into a pizza delivery person',
  'in a post-apocalyptic wasteland',
  'as a fairy tale character',
  'playing a musical instrument',
  'in a noir detective style',
  'with magical glowing elements',
  'floating in zero gravity',
  'in a chibi anime style',
  'surrounded by cute animals',
  'in a fantasy RPG class outfit',
  'with retro 80s synthwave aesthetics',
  'as a cyberpunk street samurai',
  'in ancient Egyptian attire',
  'with clockwork mechanical parts',
  'as a deep sea diver',
  'in traditional Japanese clothing',
  'drawn in a comic book style',
  'as a barista at a coffee shop',
  'riding a dinosaur',
  'in a neon-lit cityscape',
  'reimagined as a plant hybrid',
  'as a rock band frontperson',
  'made entirely of paper origami',
  'with holographic projection effects',
  'as a circus performer',
  'in a professional sports uniform',
  'in a western cowboy setting'
];

// Function to get a random twist from the static list
export function generateTwist(character?: string, franchise?: string): string {
  // Get a random twist from the array
  const randomIndex = Math.floor(Math.random() * staticTwists.length);
  const selectedTwist = staticTwists[randomIndex];
  
  logger.info('Selected random static twist', { 
    twist: selectedTwist, 
    character,
    randomIndex,
    totalTwists: staticTwists.length
  });
  
  return selectedTwist;
}


// Function to generate dynamic prompt modifiers based on character
function generatePromptModifiers(characterName: string, franchise: string): { positivePrompts: string, negativePrompts: string } {
  // Default prompts for fallback
  const defaultPositive = "highly detailed, ultra realistic, professional quality";
  const defaultNegative = "not cartoonish, not blurry, not distorted";
  
  // Normalize inputs for matching
  const normalizedCharacter = characterName.toLowerCase();
  const normalizedFranchise = franchise.toLowerCase();
  
  // Set up prompt modifiers based on character/franchise attributes
  // Sci-fi characters
  if (normalizedFranchise.includes('star wars') || 
      normalizedFranchise.includes('star trek') || 
      normalizedFranchise.includes('terminator') ||
      normalizedFranchise.includes('interstellar')) {
    return {
      positivePrompts: "highly detailed, sci-fi lighting, futuristic, metallic textures, cinematic quality",
      negativePrompts: "not cartoonish, not blurry, not distorted, no bright colors"
    };
  }
  
  // Animation characters
  if (normalizedFranchise.includes('wall-e') || 
      normalizedFranchise.includes('big hero') ||
      normalizedCharacter.includes('baymax')) {
    return {
      positivePrompts: "highly detailed, clean lines, soft lighting, character-accurate, expressive",
      negativePrompts: "not hyper-realistic, not gritty, not human-like, no dark shadows"
    };
  }
  
  // Marvel & superhero characters
  if (normalizedFranchise.includes('marvel') || 
      normalizedCharacter.includes('ultron') || 
      normalizedCharacter.includes('vision')) {
    return {
      positivePrompts: "highly detailed, dramatic lighting, powerful pose, vibrant, heroic",
      negativePrompts: "not cartoon, not anime, not sketch-like, no bright backgrounds"
    };
  }
  
  // Horror/creepy AI
  if (normalizedCharacter.includes('shodan') || 
      normalizedCharacter.includes('am') || 
      normalizedFranchise.includes('system shock') || 
      normalizedFranchise.includes('i have no mouth')) {
    return {
      positivePrompts: "highly detailed, dark atmosphere, ominous lighting, eerie, unsettling",
      negativePrompts: "not cartoon, not bright, not cheerful, no vibrant colors"
    };
  }
  
  // Transformers and mechanical entities
  if (normalizedFranchise.includes('transformers') || 
      normalizedCharacter.includes('optimus prime')) {
    return {
      positivePrompts: "highly detailed, metallic finish, dynamic pose, mechanical parts, robotic details",
      negativePrompts: "not cartoon, not flat, not simplistic"
    };
  }
  
  // AI/Virtual characters
  if (normalizedFranchise.includes('her') || 
      normalizedFranchise.includes('ex machina') || 
      normalizedFranchise.includes('westworld') ||
      normalizedFranchise.includes('neuromancer')) {
    return {
      positivePrompts: "ethereal lighting, digital aesthetics, translucent elements, clean design",
      negativePrompts: "not fully robotic, not overly mechanical, no rough textures"
    };
  }
  
  // Portal/GLaDOS
  if (normalizedFranchise.includes('portal') || 
      normalizedCharacter.includes('glados')) {
    return {
      positivePrompts: "clean white aesthetic, minimalist design, clinical lighting, institutional",
      negativePrompts: "not dirty, not gritty, not colorful, no warm colors"
    };
  }
  
  // Matrix
  if (normalizedFranchise.includes('matrix') || 
      normalizedCharacter.includes('agent smith')) {
    return {
      positivePrompts: "green tint, digital rain effect, glossy black, high contrast, cyberpunk",
      negativePrompts: "not colorful, no bright colors except green, not cartoon"
    };
  }
  
  // HAL 9000
  if (normalizedCharacter.includes('hal')) {
    return {
      positivePrompts: "minimal, single red light, symmetrical composition, deep space background",
      negativePrompts: "not humanoid, not mechanical body, no arms, no legs"
    };
  }
  
  // If no specific match, return default prompts
  return {
    positivePrompts: defaultPositive,
    negativePrompts: defaultNegative
  };
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
    
    // Element 3: Single Wacky Alternate-Universe Twist from static list
    const twist = generateTwist(characterName, franchise);
    
    // Log the twist in detail
    logger.info('IMAGE TWIST DEBUG', {
      generatedTwist: twist,
      character: characterName,
      franchise: franchise,
      twistType: typeof twist,
      twistLength: twist.length,
      twistContainsGroovy: twist.includes('groovy'),
      timestamp: Date.now(),
      requestId: `img-twist-${Date.now()}`
    });
    
    // Element 4: Generate dynamic Positive/Negative Language based on character
    const { positivePrompts, negativePrompts } = generatePromptModifiers(characterName, franchise);
    
    // Add aspect ratio to match the card's image frame (width/height ratio for 100% width and 62% height of a 5:7 card)
    // This gives us approximately a 16:10 or 1.6:1 aspect ratio
    const aspectRatio = "aspect ratio 16:10";
    
    // Construct the simplified prompt with the 4 elements
    const prompt = `${characterName} from ${franchise} ${twist}, ${positivePrompts}, ${negativePrompts}, ${aspectRatio}`;
    
    // Extensive logging for debugging the image prompt
    logger.info('IMAGE PROMPT DEBUG', {
      characterInput: characterName,
      franchiseInput: franchise,
      twistUsed: twist,
      positivePrompts,
      negativePrompts,
      aspectRatio,
      fullPrompt: prompt,
      apiKey: process.env.HUGGING_FACE_API_KEY ? 'present (truncated)' : 'missing',
      timestamp: Date.now(),
      requestId: `img-req-${Date.now()}`
    });
    
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
            negative_prompt: `text, watermark, low quality, disfigured, ${negativePrompts.replace(/not /g, 'no ')}`
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
              negative_prompt: `text, watermark, low quality, ${negativePrompts.replace(/not /g, 'no ')}`
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
      twist = generateTwist(characterName, franchise);
      logger.info('Generated static twist for description because none was provided', { twist, character });
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
    
    // Extensive logging for debugging the description prompt
    logger.info('DESCRIPTION PROMPT DEBUG', {
      characterInput: characterName,
      franchiseInput: franchise,
      twistProvided: twist,
      wasProvidedExternally: !!providedTwist,
      promptContent: prompt,
      apiKey: process.env.ANTHROPIC_API_KEY ? 'present (truncated)' : 'missing',
      timestamp: Date.now(),
      requestId: `desc-req-${Date.now()}`
    });
    
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
      
      // Log the raw API response for debugging
      logger.info('DESCRIPTION API RESPONSE', {
        responseStatus: response.status,
        responseHeaders: response.headers,
        responseRole: response.data.content[0].role,
        responseTextRaw: response.data.content[0].text,
        model: response.data.model,
        twistUsed: twist,
        characterName,
        franchise,
        requestId: `desc-resp-${Date.now()}`
      });
      
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