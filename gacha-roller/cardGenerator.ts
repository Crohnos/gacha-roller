// cardGenerator.ts
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import logger from './logger';

// Define rarity tiers and character pools with franchise information
export const rarityTiers = {
  common: { 
    probability: 0.9, 
    enhancements: 2, 
    characters: ['C-3PO (Star Wars)', 'R2-D2 (Star Wars)', 'Data (Star Trek)', 'TARS (Interstellar)', 'Baymax (Big Hero 6)'] 
  },
  rare: { 
    probability: 0.09, 
    enhancements: 3, 
    characters: ['HAL 9000 (2001: A Space Odyssey)', 'T-800 (The Terminator)', 'WALL-E (WALL-E)', 'Optimus Prime (Transformers)', 'EVE (WALL-E)'] 
  },
  epic: { 
    probability: 0.009, 
    enhancements: 4, 
    characters: ['Ultron (Marvel)', 'Vision (Marvel)', 'Sentinels (X-Men)', 'Hosts (Westworld)', 'Robocop (Robocop)'] 
  },
  legendary: { 
    probability: 0.001, 
    enhancements: 5, 
    characters: ['GLaDOS (Portal)', 'T-1000 (Terminator 2)', 'VIKI (I, Robot)', 'Ava (Ex Machina)', 'Samantha (Her)'] 
  },
  mythic: { 
    probability: 0.000001, 
    enhancements: 6, 
    characters: ['Skynet (Terminator)', 'Agent Smith (The Matrix)', 'SHODAN (System Shock)', 'AM (I Have No Mouth and I Must Scream)', 'Wintermute (Neuromancer)'] 
  },
};

export const enhancementsList = [
  'inverted colors', 
  '3D rendering', 
  'cinematic perspective', 
  'neon glow', 
  'battle-scarred',
  'steampunk aesthetics',
  'cyberpunk design',
  'holographic overlay',
  'retro pixelated style',
  'cosmic background',
  'digital glitch effect'
];

// Image Generation (Stable Diffusion with Claude-generated Midjourney-style prompts)
export async function generateImage(character: string, enhancements: string[], description: string = '') {
  try {
    logger.info('Generating image', { character, enhancements, description });
    
    // Extract character name and franchise
    const characterMatch = character.match(/^(.*?)\s*\((.*?)\)$/);
    let characterName = character;
    let franchise = '';
    
    if (characterMatch) {
      characterName = characterMatch[1].trim();
      franchise = characterMatch[2].trim();
    }
    
    // Use Claude to generate a Midjourney-style prompt
    let prompt = "";
    try {
      const enhancementsText = enhancements.join(', ');
      const promptGenerationPrompt = `
      <human>
      You are an expert at creating Midjourney-style prompts for image generation. I need a prompt for Stable Diffusion to generate an image of a fictional character.
      
      Character: ${characterName}
      Franchise: ${franchise}
      Enhancements to include: ${enhancementsText}
      
      Story description: ${description}
      
      Please create a detailed prompt that will:
      1. Make the character the main focus/subject of the image
      2. Include artistic elements like lighting and perspective
      3. Incorporate the enhancements listed above
      4. Draw inspiration from the story description
      5. Use Midjourney syntax and style (including parameters like --ar 16:9)
      
      VERY IMPORTANT: Your response should ONLY include the prompt text itself, with no explanations, introductions, or other text. The prompt should be 1-3 sentences maximum.
      </human>
      
      <assistant>`;
      
      const promptResponse = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: "claude-3-haiku-20240307",
          max_tokens: 250,
          messages: [
            { role: "user", content: promptGenerationPrompt }
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
      
      prompt = promptResponse.data.content[0].text.trim();
      
      // Clean up the prompt if needed (remove any explanatory text Claude might have added)
      prompt = prompt
        .replace(/^(Here's|Here is|I've created) (a|the|an) (prompt|image prompt).*?:/i, '')
        .replace(/^prompt:/i, '')
        .trim();
        
      logger.info('Successfully generated Claude prompt', { prompt });
    } catch (claudePromptError) {
      // If Claude fails to generate a prompt, use a basic hardcoded one
      logger.error('Failed to generate Claude prompt, using fallback', { error: claudePromptError });
      prompt = `portrait of ${characterName} from ${franchise}, ${enhancements.join(', ')}, highly detailed, dramatic lighting, 8k --ar 16:9`;
    }
    
    logger.info('Claude-generated Midjourney-style prompt', { prompt });
    
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-large',
        {
          inputs: prompt,
          parameters: {
            num_inference_steps: 50,     // Increases detail and quality
            guidance_scale: 7.5,         // Balances adherence to prompt vs. creativity
            height: 576,                 // Sets 16:9 aspect ratio (exact ratio, multiples of 8)
            width: 1024,
            negative_prompt: "text, watermark, blurry, distorted, low quality, disfigured"
          }
        },
        { 
          headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}` },
          responseType: 'arraybuffer',
          timeout: 30000 // Add 30 second timeout
        }
      );
      
      const timestamp = Date.now();
      const imagePath = `cards/card-${timestamp}.png`;
      const cardsDir = process.env.RENDER ? '/opt/render/project/src/gacha-roller/cards' : path.join(__dirname, 'cards');
      const absolutePath = process.env.RENDER ? path.join(cardsDir, `card-${timestamp}.png`) : path.join(__dirname, imagePath);
      fs.writeFileSync(absolutePath, Buffer.from(response.data));
      
      logger.info('Image generated successfully', { imagePath });
      return imagePath;
    } catch (apiError: any) {
      // Check for 503 error specifically (service unavailable/overloaded)
      const is503Error = apiError.response && apiError.response.status === 503;
      
      if (is503Error) {
        logger.warn('Hugging Face API is overloaded (503 error)', { 
          message: apiError.message,
          status: 503
        });
      } else {
        // Log the error but continue with fallback
        logger.error('API error generating image', { 
          error: apiError.message, 
          status: apiError.response?.status,
          prompt 
        });
      }
      
      // Try with a simpler prompt as fallback, also using Claude
      // Extract character and franchise if not already done
      if (!characterName || characterName === character) {
        const characterMatch = character.match(/^(.*?)\s*\((.*?)\)$/);
        if (characterMatch) {
          characterName = characterMatch[1].trim();
          franchise = characterMatch[2].trim();
        } else {
          characterName = character;
          franchise = '';
        }
      }
      
      // Generate a simpler fallback prompt with Claude
      let fallbackPrompt = '';
      try {
        const fallbackPromptRequest = `
        <human>
        Create a very simple, concise image generation prompt for Stable Diffusion. 
        I need an image of ${characterName}${franchise ? ` from ${franchise}` : ''}.
        Make the character clearly recognizable. Include "${enhancements[0] || 'digital art'}" as a style element.
        Keep it under 15 words total. No explanations or comments, just the prompt text.
        </human>
        
        <assistant>`;
        
        const fallbackResponse = await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: "claude-3-haiku-20240307",
            max_tokens: 100,
            messages: [
              { role: "user", content: fallbackPromptRequest }
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
        
        fallbackPrompt = fallbackResponse.data.content[0].text.trim();
        fallbackPrompt = fallbackPrompt
          .replace(/^(Here's|Here is|I've created) (a|the|an) (prompt|image prompt).*?:/i, '')
          .replace(/^prompt:/i, '')
          .trim();
        
        logger.info('Created Claude-generated fallback prompt', { fallbackPrompt });
      } catch (claudeError) {
        // If Claude fails, use a basic hardcoded fallback
        fallbackPrompt = franchise 
          ? `portrait of ${characterName} from ${franchise}, ${enhancements[0] || 'digital art'}, detailed, high quality`
          : `portrait of ${characterName}, ${enhancements[0] || 'digital art'}, detailed, high quality`;
        
        logger.info('Using hardcoded fallback prompt', { fallbackPrompt });
      }
      
      try {
        logger.info('Attempting with fallback prompt', { fallbackPrompt });
        const fallbackResponse = await axios.post(
          'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
          { inputs: fallbackPrompt },
          { 
            headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}` },
            responseType: 'arraybuffer',
            timeout: 20000
          }
        );
        
        const timestamp = Date.now();
        const imagePath = `cards/card-${timestamp}.png`;
        const cardsDir = process.env.RENDER ? '/opt/render/project/src/gacha-roller/cards' : path.join(__dirname, 'cards');
        const absolutePath = process.env.RENDER ? path.join(cardsDir, `card-${timestamp}.png`) : path.join(__dirname, imagePath);
        fs.writeFileSync(absolutePath, Buffer.from(fallbackResponse.data));
        
        logger.info('Image generated with fallback prompt', { imagePath });
        return imagePath;
      } catch (fallbackError: any) {
        // Check for 503 error specifically (service unavailable/overloaded)
        const is503Error = fallbackError.response && fallbackError.response.status === 503;
        
        if (is503Error) {
          logger.warn('Hugging Face API is overloaded (503 error) during fallback attempt', { 
            message: fallbackError.message,
            status: 503
          });
        } else {
          // If fallback fails for other reasons, log as error
          logger.error('Fallback image generation failed', { 
            error: fallbackError.message, 
            status: fallbackError.response?.status 
          });
        }
        
        // Extract character and franchise if not already done
        if (!characterName || characterName === character) {
          const characterMatch = character.match(/^(.*?)\s*\((.*?)\)$/);
          if (characterMatch) {
            characterName = characterMatch[1].trim();
            franchise = characterMatch[2].trim();
          } else {
            characterName = character;
            franchise = '';
          }
        }
        
        // Look for existing placeholder or create directory if needed
        const sanitizedCharacter = characterName.toLowerCase().replace(/\s+/g, '-');
        const placeholderPath = `cards/placeholder-${sanitizedCharacter}.png`;
        const absolutePlaceholderPath = path.join(__dirname, placeholderPath);
        
        // Check if we already have a placeholder for this character
        if (fs.existsSync(absolutePlaceholderPath)) {
          logger.info('Using existing placeholder image', { placeholderPath });
          return placeholderPath;
        }
        
        // Otherwise use a generic placeholder
        const genericPlaceholderPath = 'cards/generic-placeholder.png';
        const absoluteGenericPath = path.join(__dirname, genericPlaceholderPath);
        
        // Create a simple placeholder if it doesn't exist
        if (!fs.existsSync(absoluteGenericPath)) {
          // Create a very basic colored rectangle as placeholder
          const { createCanvas, loadImage } = require('canvas');
          
          try {
            // Create a more attractive placeholder with a gradient and character info
            const canvas = createCanvas(800, 450); // 16:9 aspect ratio
            const ctx = canvas.getContext('2d');
            
            // Create a background that matches the character's franchise
            let gradientStart = '#304352';
            let gradientEnd = '#d7d2cc';
            
            // Select colors based on franchise (if known)
            if (franchise) {
              const franchiseLower = franchise.toLowerCase();
              if (franchiseLower.includes('star wars')) {
                gradientStart = '#000000';
                gradientEnd = '#3d1c00';
              } else if (franchiseLower.includes('star trek')) {
                gradientStart = '#01579b';
                gradientEnd = '#000000';
              } else if (franchiseLower.includes('marvel')) {
                gradientStart = '#7b1fa2';
                gradientEnd = '#e91e63';
              } else if (franchiseLower.includes('terminator')) {
                gradientStart = '#263238';
                gradientEnd = '#b71c1c';
              }
            }
            
            // Fill with gradient background
            const gradient = ctx.createLinearGradient(0, 0, 800, 450);
            gradient.addColorStop(0, gradientStart);
            gradient.addColorStop(1, gradientEnd);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 800, 450);
            
            // Add decorative elements
            ctx.beginPath();
            ctx.arc(400, 160, 100, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 5;
            ctx.stroke();
            
            // Add character icon placeholder (circle)
            ctx.beginPath();
            ctx.arc(400, 160, 80, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fill();
            
            // Add text with shadow for better readability
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            // Character name
            ctx.font = 'bold 36px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(`${characterName}`, 400, 280);
            
            // Franchise
            if (franchise) {
              ctx.font = 'italic 24px Arial';
              ctx.fillText(`from ${franchise}`, 400, 320);
            }
            
            // Status message
            ctx.font = '20px Arial';
            ctx.fillText('Image Generation Service Unavailable', 400, 380);
            
            // Enhancements as small text
            if (enhancements.length > 0) {
              ctx.font = '16px Arial';
              ctx.fillText(`Enhancements: ${enhancements.join(', ')}`, 400, 410);
            }
            
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(absoluteGenericPath, buffer);
            logger.info('Created enhanced placeholder image', { genericPlaceholderPath });
          } catch (canvasError) {
            // If canvas creation fails, create a very basic placeholder
            logger.error('Error creating canvas placeholder', { canvasError });
            
            // Create a basic solid color canvas as fallback
            const basicCanvas = createCanvas(800, 450);
            const basicCtx = basicCanvas.getContext('2d');
            basicCtx.fillStyle = '#263238';
            basicCtx.fillRect(0, 0, 800, 450);
            basicCtx.fillStyle = 'white';
            basicCtx.font = 'bold 24px Arial';
            basicCtx.textAlign = 'center';
            basicCtx.fillText(`${characterName}`, 400, 200);
            basicCtx.font = '18px Arial';
            basicCtx.fillText('Image Unavailable', 400, 240);
            
            const basicBuffer = basicCanvas.toBuffer('image/png');
            fs.writeFileSync(absoluteGenericPath, basicBuffer);
            logger.info('Created basic placeholder image', { genericPlaceholderPath });
          }
        }
        
        return genericPlaceholderPath;
      }
    }
  } catch (error) {
    logger.error('Error in image generation process', { error, character, enhancements });
    
    // Return a path to a placeholder image as last resort
    const placeholderPath = 'cards/error-placeholder.png';
    const absolutePlaceholderPath = path.join(__dirname, placeholderPath);
    
    if (!fs.existsSync(absolutePlaceholderPath)) {
      // Create error placeholder directory if needed
      const cardsDir = path.join(__dirname, 'cards');
      if (!fs.existsSync(cardsDir)) {
        fs.mkdirSync(cardsDir, { recursive: true });
      }
      
      // Extract character and franchise if not already done
      if (!characterName || characterName === character) {
        const characterMatch = character.match(/^(.*?)\s*\((.*?)\)$/);
        if (characterMatch) {
          characterName = characterMatch[1].trim();
          franchise = characterMatch[2].trim();
        } else {
          characterName = character;
          franchise = '';
        }
      }
      
      // Create a simple error placeholder
      const { createCanvas } = require('canvas');
      const canvas = createCanvas(800, 450);
      const ctx = canvas.getContext('2d');
      
      // Check if this was a 503 error
      const is503Error = error.response && error.response.status === 503;
      
      // Background color (light red for general errors, light amber for 503)
      ctx.fillStyle = is503Error ? '#fff8e1' : '#ffebee';
      ctx.fillRect(0, 0, 800, 450);
      
      // Border color (amber for 503, red for other errors)
      ctx.strokeStyle = is503Error ? '#ff8f00' : '#c62828';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, 780, 430);
      
      // Error text
      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = is503Error ? '#ff8f00' : '#c62828';
      ctx.textAlign = 'center';
      
      // Different messages based on error type
      if (is503Error) {
        ctx.fillText('Image Generation Service Busy', 400, 150);
        
        ctx.font = '20px Arial';
        ctx.fillText('Servers are currently overloaded.', 400, 190);
        ctx.fillText('Please try again in a few minutes.', 400, 220);
      } else {
        ctx.fillText('Image Generation Error', 400, 180);
      }
      
      // Character info
      ctx.font = '24px Arial';
      ctx.fillText(`Character: ${characterName}`, 400, is503Error ? 280 : 230);
      
      if (franchise) {
        ctx.fillText(`Franchise: ${franchise}`, 400, is503Error ? 320 : 270);
      }
      
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(absolutePlaceholderPath, buffer);
    }
    
    logger.info('Using error placeholder image', { placeholderPath });
    return placeholderPath;
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
    
    const enhancementsText = enhancements.join(', ');
    const prompt = `
    <human>
    Write a 200-300 word story about ${characterName}${franchise ? ` from ${franchise}` : ''} in an alternate universe where the following enhancements significantly alter their role, appearance, or backstory: ${enhancementsText || 'alternate universe elements'}. 
    
    Describe how these enhancements change the character and their world. Make it engaging and imaginative. If you're about to exceed your token limit, end the story gracefully rather than cutting off mid-sentence. 
    
    IMPORTANT: Your answer must ONLY include the story itself, with no introduction, explanation, or commentary.
    </human>
    
    <assistant>`;
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
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
    
    // Clean up the description to remove any explanatory text
    description = description
      .replace(/^(Here is|Here's|I've written) a (short |brief |100-word |)(story|tale) about .*?:\s*/i, '')
      .replace(/^In this (alternate universe|story|world|scenario),?\s*/i, '')
      .replace(/^Here goes:?\s*/i, '')
      .trim();
    
    logger.info('Description generated successfully', { description: description.substring(0, 50) + '...' });
    
    return description;
  } catch (error) {
    logger.error('Error generating description', { error, character });
    throw new Error('Failed to generate description');
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
export function determineRarity(userId?: string) {
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