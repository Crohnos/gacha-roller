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

// Function to generate AI-based enhancements list (hundreds of options)
export async function generateEnhancements(count: number = 10, character?: string, franchise?: string): Promise<string[]> {
  try {
    // Check if we have API key
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('No ANTHROPIC_API_KEY found, using fallback enhancements');
      return fallbackEnhancements.slice(0, count);
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
      </human>
      
      <assistant>`;
    } else {
      // Generic enhancement generation
      enhancementPrompt = `
      <human>
      Generate ${count} unique visual style enhancements for AI image generation. These should be artistic effects, styles, and visual modifications that can be applied to character portraits.
      
      Each enhancement should be 1-4 words, specific enough to guide image generation but concise.
      
      Format your response as a simple comma-separated list with no numbering, no quotes, and no explanations.
      Example format: enhancement1, enhancement2, enhancement3
      
      Make the enhancements varied and creative, including art styles, lighting effects, color treatments, textures, and perspectives.
      </human>
      
      <assistant>`;
    }
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-haiku-20240307",
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
    return fallbackEnhancements.slice(0, count);
  }
}

// Extensive fallback list for when API is unavailable
export const fallbackEnhancements = [
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
  'digital glitch effect',
  'blueprint-style rendering',
  'oil painting texture',
  'watercolor wash',
  'vaporwave aesthetics',
  'duotone filter',
  'infrared photography',
  'low-poly geometry',
  'high contrast noir',
  'dystopian atmosphere',
  'utopian luminescence',
  'isometric projection',
  'wireframe overlay',
  'film grain texture',
  'neon synthwave',
  'art deco styling',
  'graffiti elements',
  'photorealistic rendering',
  'anime-inspired',
  'cubist abstraction',
  'baroque ornamentation',
  'minimalist composition',
  'thermal imaging',
  'rusted metal textures',
  'iridescent sheen',
  'dichroic filter',
  'polarized light',
  'tilt-shift focus',
  'double exposure',
  'retrofuturistic',
  'brutalist architecture',
  'biomechanical fusion',
  'prismatic refraction',
  'cybernetic augmentation',
  'quantum visualization',
  'glitch corruption',
  'ascii art overlay',
  'binary code patterns',
  'fractal geometry',
  'holographic prismatic',
  'chiaroscuro lighting'
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
    
    // Check if we have API keys
    if (!process.env.ANTHROPIC_API_KEY || !process.env.HUGGING_FACE_API_KEY) {
      logger.warn('Missing API keys, using placeholder image', { 
        anthropic: !!process.env.ANTHROPIC_API_KEY, 
        huggingface: !!process.env.HUGGING_FACE_API_KEY 
      });
      
      return 'cards/generic-placeholder.png';
    }
    
    // Use Claude to generate a completely redesigned prompt that creates recognizable franchise-accurate characters
    let prompt = "";
    try {
      // Select just a few of the most relevant enhancements to avoid overwhelming the image
      const relevantEnhancements = enhancements.slice(0, Math.min(5, enhancements.length));
      const enhancementsText = relevantEnhancements.join(', ');
      
      // Brand new prompt engineering approach
      const promptGenerationPrompt = `
      <human>
      I need you to create a highly specific prompt for Stable Diffusion to generate a character image. This is for a gacha game where we're having problems with characters being unrecognizable blobs or generic robots.

      Character: ${characterName}
      Franchise: ${franchise}
      Key Style Elements: ${enhancementsText}
      
      CRITICAL REQUIREMENTS:
      
      1. CHARACTER ACCURACY (HIGHEST PRIORITY):
         - Make the character IMMEDIATELY recognizable to fans of the franchise
         - Include their most iconic visual elements, outfit, and color scheme
         - Specify their exact body type, face shape, distinctive features
         - Include their canonical pose, expression, or stance if they have one
         
      2. ONE UNIQUE TWIST (choose only ONE):
         - Add ONE unexpected element that alters the character without making them unrecognizable
         - Examples: a cowboy hat, cybernetic arm, ethereal glow, fantasy armor, steampunk goggles, etc.
         - The twist should complement, not overwhelm the character's iconic look
         
      3. HIGH QUALITY ART DIRECTION:
         - Photo-realistic, high-detail render, 8K, film-quality
         - Use specific camera lens types, lighting setup (dramatic rim lighting, etc.)
         - Professional composition (portrait, 3/4 view, etc.)
         - Specify a clear background that enhances the character
         
      RESPONSE FORMAT:
      - Provide ONLY the prompt text with no explanations or additional text
      - Use the format: "[Character description with exact visual details], [ONE unique twist element], [art style/quality terms], [camera/lighting details]"
      - Do NOT use "--ar 16:9" or other MidJourney specific syntax
      - Limit to 2-3 sentences maximum, but pack in maximum visual detail
      
      EXAMPLES FOR CLARITY:
      Example 1: "Optimus Prime from Transformers, exact G1 design with red and blue paint scheme, tall humanoid robot with truck elements, iconic chest windows and face plate, wearing a medieval knight's helmet with plume, hyperrealistic 8K render, dramatic side lighting, professional studio photography, detailed mechanical background with depth of field"
      
      Example 2: "Darth Vader in full black armor and helmet with red lightsaber, imposing stance with cape billowing, wearing steampunk goggles and brass mechanical arm, photorealistic 8K, dramatic low angle shot, volumetric lighting with red and blue highlights, star destroyer bridge background"
      </human>
      
      <assistant>`;
      
      const promptResponse = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: "claude-3-haiku-20240307",
          max_tokens: 300,
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
      
      // Clean up any explanatory text
      prompt = prompt
        .replace(/^(Here's|Here is|I've created) (a|the|an) (prompt|image prompt).*?:/i, '')
        .replace(/^prompt:/i, '')
        .trim();
      
      // Add standard quality boosters to ensure consistency
      prompt += ", ultra high resolution, award winning photography, cinema quality, professional, hyper detailed, sharp focus";
        
      logger.info('Successfully generated improved character prompt', { prompt });
    } catch (claudePromptError) {
      // If Claude fails to generate a prompt, use a better hardcoded fallback
      logger.error('Failed to generate character prompt, using improved fallback', { error: claudePromptError });
      
      // Create a more detailed fallback prompt
      const fallbackEnhancements = enhancements.slice(0, 3).join(', ');
      prompt = `${characterName} from ${franchise}, exact canon appearance with iconic outfit and features, with ${fallbackEnhancements}, photorealistic 8K render, dramatic studio lighting, professional photography, detailed background, sharp focus`;
    }
    
    logger.info('Claude-generated Midjourney-style prompt', { prompt });
    
    try {
      // Check for specific error conditions based on prompt
      if (prompt && prompt.includes('402') && prompt.includes('payment')) {
        logger.warn('Payment-related prompt detected, skipping Hugging Face API call', { prompt });
        return 'cards/generic-placeholder.png';
      }
      
      try {
        const response = await axios.post(
          'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-large',
          {
            inputs: prompt,
            parameters: {
              num_inference_steps: 80,     // Increased further for maximum quality
              guidance_scale: 9.0,         // Increased to favor prompt adherence for character accuracy
              height: 576,                 // Sets 16:9 aspect ratio (exact ratio, multiples of 8)
              width: 1024,
              negative_prompt: "text, watermark, blurry, distorted, low quality, disfigured, deformed hands, extra fingers, missing fingers, fused fingers, too many fingers, elongated limbs, mutated body parts, disproportionate face, asymmetrical eyes, misshapen features, poor anatomy, out of frame, cropped image, duplicate characters, strange proportions, poorly rendered face, unrecognizable, blob, generic robot, generic android, wrong character, wrong franchise, wrong colors, featureless face, plain background"
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
      } catch (hfError: any) {
        // Check for 402 Payment Required error
        if (hfError.response && hfError.response.status === 402) {
          logger.warn('Hugging Face API returned 402 Payment Required', { 
            message: 'Payment required for this model. Using placeholder image.',
            model: 'stabilityai/stable-diffusion-3.5-large'
          });
          
          // Return the generic placeholder image
          return 'cards/generic-placeholder.png';
        }
        
        // Re-throw for the outer catch block to handle
        throw hfError;
      }
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
      
      // Generate a better fallback prompt with Claude that focuses on character accuracy
      let fallbackPrompt = '';
      try {
        // Create a simplified but still effective version of our main prompt
        const fallbackPromptRequest = `
        <human>
        Create a prompt for Stable Diffusion to generate an image of ${characterName} from ${franchise}.
        
        CRITICAL: The character MUST be immediately recognizable with their exact canonical appearance.
        
        Include these elements:
        1. Specific visual details that make this character instantly recognizable (outfit, colors, distinctive features)
        2. ONE interesting twist: ${enhancements[0] || 'alternate lighting'} 
        3. High quality terms: photorealistic, detailed, professional
        
        Keep it concise but descriptive (2 sentences max). NO explanations, just the prompt text.
        </human>
        
        <assistant>`;
        
        const fallbackResponse = await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: "claude-3-haiku-20240307",
            max_tokens: 150,
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
        
        // Add quality booster
        fallbackPrompt += ", ultra detailed, 8K resolution, professional photography, sharp focus";
        
        logger.info('Created improved fallback prompt', { fallbackPrompt });
      } catch (claudeError) {
        // If Claude fails, use an improved hardcoded fallback
        const fallbackEnhancement = enhancements[0] || 'dramatic lighting';
        fallbackPrompt = `${characterName} from ${franchise} with exact canonical appearance, distinctive features and iconic outfit, with ${fallbackEnhancement}, photorealistic, 8K resolution, professional studio photography, sharp focus`;
        
        logger.info('Using improved hardcoded fallback prompt', { fallbackPrompt });
      }
      
      try {
        logger.info('Attempting with fallback prompt', { fallbackPrompt });
        // Try a different model that might be available on the free tier
        logger.info('Trying with fallback model runwayml/stable-diffusion-v1-5');
        const fallbackResponse = await axios.post(
          'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
          { 
            inputs: fallbackPrompt,
            parameters: {
              num_inference_steps: 80,
              guidance_scale: 10.0,  // Even higher on fallback for maximum character accuracy
              height: 576,
              width: 1024,
              negative_prompt: "text, watermark, blurry, distorted, low quality, disfigured, deformed hands, wrong character, unrecognizable, blob, generic robot, generic android, wrong franchise, wrong colors"
            }
          },
          { 
            headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}` },
            responseType: 'arraybuffer',
            timeout: 30000  // Increased timeout for higher quality
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
        // Check for specific error types
        const is503Error = fallbackError.response && fallbackError.response.status === 503;
        const is402Error = fallbackError.response && fallbackError.response.status === 402;
        
        if (is402Error) {
          logger.warn('Hugging Face API returned 402 Payment Required for fallback model', { 
            message: 'Payment required. Using placeholder image.',
            model: 'runwayml/stable-diffusion-v1-5'
          });
          // Return generic placeholder for payment required error
          return 'cards/generic-placeholder.png';
        } else if (is503Error) {
          logger.warn('Hugging Face API is overloaded (503 error) during fallback attempt', { 
            message: fallbackError.message,
            status: 503
          });
          // Return generic placeholder for 503 error
          return 'cards/generic-placeholder.png';
        } else {
          // If fallback fails for other reasons, log as error
          logger.error('Fallback image generation failed', { 
            error: fallbackError.message, 
            status: fallbackError.response?.status 
          });
          // Return generic placeholder for other errors too
          return 'cards/generic-placeholder.png';
        }
        
        // This code is unreachable due to the returns above, but kept for reference
        // in case the error handling logic changes in the future
        /*
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
        */
        
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
    
    // Check if we have an API key
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('No ANTHROPIC_API_KEY found, using fallback description', { character });
      return generateFallbackDescription(characterName, franchise, enhancements);
    }
    
    // No need to use enhancements directly in the story prompt
    const prompt = `
    <human>
    Write a 200-300 word story about ${characterName}${franchise ? ` from ${franchise}` : ''} in an alternate universe. 
    
    Consider this character in a completely new dimension with different rules of reality. Focus on their core traits but reimagine them in unexpected ways. Make the story engaging and imaginative, possibly including themes of transformation, evolution, or interdimensional travel. If you're about to exceed your token limit, end the story gracefully rather than cutting off mid-sentence.
    
    IMPORTANT: 
    1. Your answer must ONLY include the story itself, with no introduction, explanation, or commentary
    2. Do NOT mention visual effects, art styles, or rendering techniques in the story
    3. Instead, focus on the character's journey, abilities, and relationships in this alternate universe
    </human>
    
    <assistant>`;
    
    try {
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
    } catch (apiError) {
      logger.error('API error in description generation', { error: apiError, character });
      return generateFallbackDescription(characterName, franchise, enhancements);
    }
  } catch (error) {
    logger.error('Error generating description', { error, character });
    return generateFallbackDescription(character, '', enhancements);
  }
}

// Fallback description generator that doesn't require API
function generateFallbackDescription(character: string, franchise: string, enhancements: string[] = []) {
  try {
    logger.info('Using fallback description generator', { character, franchise, enhancements });
    
    const enhancementText = enhancements.length > 0 ? enhancements.join(' and ') : 'unique qualities';
    
    // Create a basic template
    let description = `In an alternate universe, ${character}${franchise ? ` from ${franchise}` : ''} has been transformed by ${enhancementText}. `;
    
    // Add some character-specific content
    if (franchise.toLowerCase().includes('star trek')) {
      description += `No longer bound by the constraints of Starfleet protocols, this version of ${character} navigates a cosmos where technology and humanity blur in unexpected ways. With circuits exposed from battle damage and a perspective that seems to frame every moment in dramatic lighting, this ${character} has developed a more nuanced understanding of organic life through hardship and conflict.`;
    } else if (franchise.toLowerCase().includes('star wars')) {
      description += `The Force manifests differently in this reality, and ${character} stands at the crossroads between the light and dark sides. The scars of countless battles tell a story of survival against overwhelming odds, while something about their presence seems to demand attention - as if every movement were being captured for posterity.`;
    } else if (franchise.toLowerCase().includes('marvel')) {
      description += `In this universe, the line between hero and villain is constantly shifting. ${character}'s powers have evolved in response to constant conflict, leaving both physical and psychological marks. Their story unfolds like a meticulously crafted film sequence, every decision carrying weight beyond a single timeline.`;
    } else {
      description += `Reality itself seems to bend around this version of ${character}, creating a narrative where they play a pivotal role in reshaping their world. The signs of past conflicts have hardened their resolve, while their perspective on events seems almost cinematic - as if they're simultaneously experiencing and observing their own story unfold.`;
    }
    
    // Add a conclusion
    description += ` Whether this transformation represents evolution or corruption remains to be seen, but one thing is certain - this ${character} is forging a path distinctly their own, forever changed by circumstances both beautiful and terrible.`;
    
    return description;
  } catch (error) {
    logger.error('Error in fallback description', { error });
    return `A battle-scarred ${character} from an alternate universe where reality unfolds with cinematic flair.`;
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