// src/components/CardDisplay.tsx
import { motion } from 'framer-motion';
import PityDisplay from './PityDisplay';

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
    enhancements?: string[];
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
  
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="card-modal"
        style={{
          border: rarityStyle.border,
          background: rarityStyle.background,
          boxShadow: rarityStyle.glow
        }}
        initial={{ scale: 0.8, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        {/* Rarity badge */}
        <div className={`rarity-badge rarity-${card.rarity}`}>
          {card.rarity}
        </div>
        
        {/* Full-size card image */}
        <div className="card-image-container" style={{ paddingTop: '75%' }}>  {/* 4:3 aspect ratio for better fit */}
          <img 
            className="card-image"
            src={`${API_URL}/${card.image_path}`} 
            alt={card.character}
            style={{ objectFit: 'contain' }} /* Changed from cover to contain to show full image */
          />
        </div>
        
        {/* Card content */}
        <div style={{ padding: 'var(--space-lg)' }}>
          <h3 className={`rarity-${card.rarity} mb-sm`} style={{ 
            fontSize: '1.5rem',
            fontFamily: 'var(--font-display)'
          }}>
            {card.character}
          </h3>
          
          <p className="mb-md" style={{ 
            fontSize: '0.9rem',
            lineHeight: '1.6', 
            color: 'var(--gray-200)',
            maxHeight: '200px', /* Increased height */
            overflow: 'auto'
          }}>
            {card.description}
          </p>
          
          {/* Enhancements - Condensed Display */}
          {card.enhancements && card.enhancements.length > 0 && (
            <div className="mb-sm">
              <h4 className="section-title mb-sm" style={{ 
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                color: 'var(--gray-400)'
              }}>
                Key Enhancements ({card.enhancements.length} total)
              </h4>
              
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: 'var(--space-xs)',
                maxHeight: '80px',
                overflow: 'auto'
              }}>
                {/* Show only first 5 enhancements */}
                {card.enhancements.slice(0, 5).map((enhancement, index) => (
                  <span 
                    key={index}
                    className="enhancement-tag"
                    style={{
                      color: rarityStyle.textColor,
                      borderColor: rarityStyle.border.replace(/1px solid /, ''),
                    }}
                  >
                    {enhancement}
                  </span>
                ))}
                {card.enhancements.length > 5 && (
                  <span 
                    className="enhancement-tag"
                    style={{
                      color: rarityStyle.textColor,
                      borderColor: rarityStyle.border.replace(/1px solid /, ''),
                    }}
                  >
                    +{card.enhancements.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Pity information */}
          {card.pity_info && (
            <div style={{ marginTop: 'var(--space-md)' }}>
              <PityDisplay pityInfo={card.pity_info} />
            </div>
          )}
          
          {/* Card ID with fancy styling */}
          <div className="flex justify-between items-center" style={{ 
            marginTop: 'var(--space-md)',
            paddingTop: 'var(--space-sm)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span className="glass-effect" style={{ 
              fontSize: '0.75rem',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--gray-300)'
            }}>
              ID #{card.card_id}
            </span>

            <motion.button
              className="btn-secondary"
              style={{ 
                margin: 0, 
                padding: '4px 12px', 
                fontSize: '0.875rem' 
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
            >
              Close
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CardDisplay;