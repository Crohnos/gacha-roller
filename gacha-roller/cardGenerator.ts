// cardGenerator.ts
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import logger from './logger';

// Define rarity tiers and character pools with franchise information
export const rarityTiers = {
  common: { 
    probability: 0.9, 
    enhancements: 15, // Increased from 2
    characters: ['C-3PO (Star Wars)', 'R2-D2 (Star Wars)', 'Data (Star Trek)', 'TARS (Interstellar)', 'Baymax (Big Hero 6)'] 
  },
  rare: { 
    probability: 0.09, 
    enhancements: 20, // Increased from 3
    characters: ['HAL 9000 (2001: A Space Odyssey)', 'T-800 (The Terminator)', 'WALL-E (WALL-E)', 'Optimus Prime (Transformers)', 'EVE (WALL-E)'] 
  },
  epic: { 
    probability: 0.009, 
    enhancements: 25, // Increased from 4
    characters: ['Ultron (Marvel)', 'Vision (Marvel)', 'Sentinels (X-Men)', 'Hosts (Westworld)', 'Robocop (Robocop)'] 
  },
  legendary: { 
    probability: 0.001, 
    enhancements: 30, // Increased from 5 
    characters: ['GLaDOS (Portal)', 'T-1000 (Terminator 2)', 'VIKI (I, Robot)', 'Ava (Ex Machina)', 'Samantha (Her)'] 
  },
  mythic: { 
    probability: 0.000001, 
    enhancements: 40, // Increased from 6
    characters: ['Skynet (Terminator)', 'Agent Smith (The Matrix)', 'SHODAN (System Shock)', 'AM (I Have No Mouth and I Must Scream)', 'Wintermute (Neuromancer)'] 
  },
};

// Function to generate AI-based enhancements list
export async function generateEnhancements(count: number = 10, character?: string, franchise?: string): Promise<string[]> {
  try {
    // Check if we have API key
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('No ANTHROPIC_API_KEY found, returning default options');
      return [
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
      ].slice(0, count);
    }
    
    let enhancementPrompt;
    
    if (character && franchise) {
      // If character info is provided, generate character-appropriate enhancements
      enhancementPrompt = `
      <human>
      Generate ${count} unique visual style enhancements for AI image generation of ${character} from ${franchise}.
      
      These should be artistic effects, styles, and visual modifications that would complement this specific character.
      Focus on enhancements that would match the character's:
      - Personality and powers
      - Thematic elements from their franchise
      - Iconic visual traits
      - Era and technological/aesthetic context
      
      Each enhancement should be 1-4 words, specific enough to guide image generation but concise.
      
      Format your response as a simple comma-separated list with no numbering, no quotes, and no explanations.
      Example format: enhancement1, enhancement2, enhancement3
      
      Make the enhancements varied and creative, but thematically appropriate for this character.
      </human>`;
    } else {
      // Generic enhancement generation
      enhancementPrompt = `
      <human>
      Generate ${count} unique visual style enhancements for AI image generation. These should be artistic effects, styles, and visual modifications that can be applied to character portraits.
      
      Each enhancement should be 1-4 words, specific enough to guide image generation but concise.
      
      Format your response as a simple comma-separated list with no numbering, no quotes, and no explanations.
      Example format: enhancement1, enhancement2, enhancement3
      
      Make the enhancements varied and creative, including art styles, lighting effects, color treatments, textures, and perspectives.
      </human>`;
    }
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 500,
        messages: [
          { role: "user", content: enhancementPrompt }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        timeout: 15000
      }
    );
    
    const enhancementsList = response.data.content[0].text.trim().split(', ');
    
    // Clean up any formatting issues
    const cleanedEnhancements = enhancementsList
      .map(e => e.trim())
      .filter(e => e.length > 0)
      .map(e => e.toLowerCase())
      .slice(0, count);
    
    logger.info('Generated enhancements list', { count: cleanedEnhancements.length, character });
    
    return cleanedEnhancements;
  } catch (error) {
    logger.error('Error generating enhancements list', { error, character });
    // Return a simple default set instead of using a huge fallback list
    return [
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
    ].slice(0, count);
  }
}

// Image Generation with simplified 4-element prompt approach
export async function generateImage(character: string, enhancements: string[], description: string = '') {
  try {
    logger.info('Generating image', { character, enhancements });
    
    // Extract character name and franchise
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
    
    // Element 1: Character Name (e.g. T-800)
    // Element 2: Character's Franchise (e.g. The Terminator) 
    // Already extracted above
    
    // Element 3: Single Wacky Alternate-Universe Twist
    const possibleTwists = [
      "wearing a cowboy hat",
      "with glowing neon accents",
      "made of cardboard",
      "as a steampunk version",
      "with a medieval knight armor",
      "wearing a space suit",
      "in samurai gear",
      "with cyberpunk augmentations",
      "as an ancient statue",
      "wearing formal business attire",
      "made of crystal",
      "as a ghostly apparition",
      "with fairy wings",
      "in pirate clothing",
      "as a wild west sheriff"
    ];
    
    // Use first enhancement as a twist or pick a random one from our list
    let twist = '';
    if (enhancements && enhancements.length > 0) {
      twist = enhancements[0];
    } else {
      twist = possibleTwists[Math.floor(Math.random() * possibleTwists.length)];
    }
    
    // Element 4: Positive/Negative Language
    const positivePrompts = "highly detailed, ultra realistic, professional quality";
    const negativePrompts = "not cartoonish, not colorful, not blurry, not distorted";
    
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
            height: 576,
            width: 1024,
            negative_prompt: "text, watermark, blurry, distorted, low quality, disfigured"
          }
        },
        { 
          headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}` },
          responseType: 'arraybuffer',
          timeout: 90000 // 90 seconds
        }
      );
      
      const timestamp = Date.now();
      const imagePath = `cards/card-${timestamp}.png`;
      const cardsDir = process.env.RENDER ? '/opt/render/project/src/gacha-roller/cards' : path.join(__dirname, 'cards');
      const absolutePath = process.env.RENDER ? path.join(cardsDir, `card-${timestamp}.png`) : path.join(__dirname, imagePath);
      fs.writeFileSync(absolutePath, Buffer.from(response.data));
      
      logger.info('Image generated successfully', { imagePath });
      return imagePath;
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
              height: 576,
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
        const cardsDir = process.env.RENDER ? '/opt/render/project/src/gacha-roller/cards' : path.join(__dirname, 'cards');
        const absolutePath = process.env.RENDER ? path.join(cardsDir, `card-${timestamp}.png`) : path.join(__dirname, imagePath);
        fs.writeFileSync(absolutePath, Buffer.from(fallbackResponse.data));
        
        logger.info('Image generated with fallback model', { imagePath });
        return imagePath;
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
    }
    
    const absolutePath = process.env.RENDER ? path.join(cardsDir, `error-${timestamp}.png`) : path.join(__dirname, errorImagePath);
    
    // Create error image with Canvas
    const canvas = createCanvas(1024, 576); // Match the regular image dimensions
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1024, 576);
    gradient.addColorStop(0, '#1a1625');
    gradient.addColorStop(1, '#2d1b33');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 576);
    
    // Error border
    ctx.strokeStyle = '#e53e3e';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 1024 - 40, 576 - 40);
    
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
    
    logger.info('Created error image', { errorImagePath });
    return errorImagePath;
  } catch (error) {
    logger.error('Error creating error image', { error });
    return 'cards/generic-placeholder.png'; // Last resort fallback
  }
}

// Keywords extraction is now handled by Claude in the prompt generation

// Text Description Generation (Anthropic)
export async function generateDescription(character: string, enhancements: string[] = []) {
  try {
    logger.info('Generating description', { character, enhancements });
    
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
    
    // Enhanced creative writing prompt using Claude Sonnet 3.5
    // Using techniques from Anthropic's creative writing guide
    const prompt = `
    <human>
    Write a vivid, unexpected, and emotionally rich micro-fiction (200-300 words) about ${characterName} from ${franchise} in an alternate universe. 
    
    First, imagine three unusual concepts or settings that would create an interesting contrast with this character's established traits and abilities. Choose the most surprising and creative option.
    
    Your micro-fiction should:
    - Place the character in this unexpected alternate reality with dramatically different physical laws or social structures
    - Transform key aspects of their identity while preserving their essential nature
    - Include sensory details that make this world feel tangible and strange
    - Create meaningful conflict that reveals something new about the character
    - Use figurative language (metaphor, simile) to highlight their emotional experience
    - End with a striking image or revelation that lingers in the reader's mind
    
    Aim for a specific emotional tone - perhaps melancholy, wonder, or existential humor. Experiment with unusual narrative perspectives or structures if appropriate.
    
    IMPORTANT:
    - Your response must ONLY include the micro-fiction with no introduction, explanation, or commentary
    - Avoid clichés, predictable plots, and standard "what if" scenarios  
    - Focus on original imagery and unexpected developments
    - Do NOT include "</assistant>" or any other message formatting in your response
    </human>`;
    
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: "claude-3-5-sonnet-20240620",  // Updated to Sonnet 3.5
          max_tokens: 600,
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

// Placeholder CSS for PicoCSS
export async function generateCss() {
  // Just return an empty string as we're not using TailwindCSS anymore
  return '';
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