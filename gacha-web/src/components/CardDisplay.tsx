// src/components/CardDisplay.tsx
import { motion } from 'framer-motion';

// Import API URL from store
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type PityInfo = {
  rolls_until_rare: number;
  rolls_until_epic: number;
  rolls_until_legendary: number;
  rolls_until_mythic: number;
  common_streak: number;
  total_rolls: number;
  guaranteed_next_rarity: string | null;
};

type CardProps = {
  card: {
    card_id: number;
    image_path: string;
    description: string;
    css: string;
    rarity: string;
    character: string;
    pity_info?: PityInfo;
  };
  onClose: () => void;
};

// Map rarity to custom styling
const rarityConfig = {
  common: { 
    border: '1px solid var(--rarity-common)', 
    textColor: 'var(--rarity-common)', 
    background: 'var(--bg-card)',
    glow: 'var(--glow-common)'
  },
  rare: { 
    border: '1px solid var(--rarity-rare)', 
    textColor: 'var(--rarity-rare)', 
    background: 'linear-gradient(to bottom, rgba(23, 37, 84, 0.7), var(--bg-card))',
    glow: 'var(--glow-rare)'
  },
  epic: { 
    border: '1px solid var(--rarity-epic)', 
    textColor: 'var(--rarity-epic)', 
    background: 'linear-gradient(to bottom, rgba(74, 29, 150, 0.6), var(--bg-card))',
    glow: 'var(--glow-epic)'
  },
  legendary: { 
    border: '1px solid var(--rarity-legendary)', 
    textColor: 'var(--rarity-legendary)', 
    background: 'linear-gradient(to bottom, rgba(120, 53, 15, 0.6), var(--bg-card))',
    glow: 'var(--glow-legendary)'
  },
  mythic: { 
    border: '1px solid var(--rarity-mythic)', 
    textColor: 'var(--rarity-mythic)', 
    background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.7), rgba(131, 24, 67, 0.7), var(--bg-card))',
    glow: 'var(--glow-mythic)'
  },
};

const CardDisplay = ({ card, onClose }: CardProps) => {
  const rarityStyle = rarityConfig[card.rarity as keyof typeof rarityConfig] || rarityConfig.common;
  
  // TCG styling - reference colors and styles based on rarity
  const tcgStyles = {
    common: {
      frameGradient: 'linear-gradient(to bottom, #777, #333)',
      textShadow: '0 1px 2px rgba(0,0,0,0.8)',
      typeBackground: 'linear-gradient(to right, #555, #777)'
    },
    rare: {
      frameGradient: 'linear-gradient(to bottom, #60a5fa, #1e40af)',
      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
      typeBackground: 'linear-gradient(to right, #1e40af, #3b82f6)'
    },
    epic: {
      frameGradient: 'linear-gradient(to bottom, #c084fc, #7e22ce)',
      textShadow: '0 1px 4px rgba(0,0,0,0.8)',
      typeBackground: 'linear-gradient(to right, #7e22ce, #a855f7)'
    },
    legendary: {
      frameGradient: 'linear-gradient(to bottom, #facc15, #b45309)',
      textShadow: '0 1px 4px rgba(0,0,0,0.9)',
      typeBackground: 'linear-gradient(to right, #b45309, #eab308)'
    },
    mythic: {
      frameGradient: 'linear-gradient(to bottom, #ef4444, #7f1d1d)',
      textShadow: '0 1px 5px rgba(0,0,0,0.9)',
      typeBackground: 'linear-gradient(to right, #7f1d1d, #ef4444)'
    }
  };
  
  const currentStyle = tcgStyles[card.rarity as keyof typeof tcgStyles] || tcgStyles.common;
  
  // No need for flavor text anymore as we're using a shorter description
    
  // Get franchise from character name if it includes parentheses
  const franchiseMatch = card.character.match(/\((.*?)\)/);
  const franchise = franchiseMatch ? franchiseMatch[1] : "Robot Universe";
  
  // Clean character name (remove franchise in parentheses)
  const cleanName = card.character.replace(/\s*\(.*?\)\s*/, '');
  
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="tcg-card-container"
        initial={{ scale: 0.8, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <div className="tcg-card" style={{
          background: '#000',
          borderRadius: '16px',
          boxShadow: rarityStyle.glow + ', 0 0 30px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          maxWidth: '500px', // Proper size for a TCG card display
          aspectRatio: '5/7', // Standard TCG card ratio
          display: 'flex',
          flexDirection: 'column',
          padding: '10px',
          border: `2px solid ${rarityStyle.border.replace('1px solid ', '')}`
        }}>
          {/* Card Title Bar */}
          <div style={{
            background: currentStyle.frameGradient,
            borderRadius: '8px 8px 0 0',
            padding: '6px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            position: 'relative',
            zIndex: 2,
            height: '40px'
          }}>
            <h2 style={{
              fontSize: '1.2rem',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontWeight: 'bold',
              margin: 0,
              textShadow: currentStyle.textShadow,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '80%'
            }}>
              {cleanName}
            </h2>
            
            <div className="rarity-stars" style={{
              display: 'flex',
              gap: '2px'
            }}>
              {/* Show stars based on rarity (similar to Yu-Gi-Oh) */}
              {Array.from({ length: 
                card.rarity === 'common' ? 1 :
                card.rarity === 'rare' ? 2 :
                card.rarity === 'epic' ? 3 :
                card.rarity === 'legendary' ? 4 : 5 
              }).map((_, i) => (
                <div key={i} style={{
                  width: '12px',
                  height: '12px',
                  background: card.rarity === 'mythic' ? 
                    'linear-gradient(to bottom right, #ef4444, #fef08a, #ef4444)' : 
                    'linear-gradient(to bottom right, #facc15, #fef08a, #facc15)',
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  boxShadow: '0 0 3px rgba(255,255,255,0.7)'
                }} />
              ))}
            </div>
          </div>
          
          {/* Main Card Image - The centerpiece of the card */}
          <div style={{
            width: '100%',
            height: '60%', // Dominant part of the card (like in MTG or Yu-Gi-Oh)
            position: 'relative',
            overflow: 'hidden',
            background: '#000',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '3px 0',
            padding: '0'
          }}>
            <img 
              src={`${API_URL}/${card.image_path}`} 
              alt={card.character}
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '4px'
              }} 
            />
          </div>
          
          {/* Card Type Bar - Similar to MTG type line */}
          <div style={{
            background: currentStyle.typeBackground,
            padding: '3px 8px',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#fff',
            fontWeight: 'bold',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            margin: '2px 0 3px 0'
          }}>
            {franchise} • {card.rarity.toUpperCase()}
          </div>
          
          {/* Card Text Box - For description/abilities */}
          <div style={{
            background: 'rgba(0,0,0,0.7)',
            flex: 1,
            padding: '6px 8px',
            margin: '2px 0',
            fontSize: '0.8rem',
            color: '#eee',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '3px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxHeight: '25%', // Fixed percentage of card height
            overflow: 'hidden' // Ensure text doesn't overflow
          }}>
            <div style={{
              fontSize: '0.85rem',
              lineHeight: '1.2',
              textAlign: 'left',
              padding: '0 2px',
              maxHeight: '100%',
              overflow: 'hidden'
            }}>
              {card.description}
            </div>
          </div>
          
          {/* Card Footer - Like the collector info on MTG cards */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.6)',
            background: 'rgba(0,0,0,0.4)',
            padding: '3px 8px',
            marginTop: '2px',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <span>#{card.card_id}</span>
            <span>★ AI GACHA TCG ★</span>
          </div>
        </div>
        
        {/* Close button outside card */}
        <motion.button
          className="tcg-close-button"
          style={{ 
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '18px',
            zIndex: 10,
            boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default CardDisplay;