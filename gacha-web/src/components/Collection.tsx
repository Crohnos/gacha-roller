// src/components/Collection.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import CardDisplay from './CardDisplay';

// Import API URL from store
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type Card = {
  card_id: number;
  image_path: string;
  description: string;
  css: string;
  rarity: string;
  character: string;
  enhancements?: string[];
};

type CollectionProps = {
  cards: Card[];
  isOpen: boolean;
  onClose: () => void;
};

// Rarity config for collection styling
const rarityGlow = {
  common: 'var(--glow-common)',
  rare: 'var(--glow-rare)',
  epic: 'var(--glow-epic)',
  legendary: 'var(--glow-legendary)',
  mythic: 'var(--glow-mythic)',
};

const Collection = ({ cards, isOpen, onClose }: CollectionProps) => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  
  // Group cards by rarity for display
  const cardsByRarity = cards.reduce((acc, card) => {
    if (!acc[card.rarity]) {
      acc[card.rarity] = [];
    }
    acc[card.rarity].push(card);
    return acc;
  }, {} as Record<string, Card[]>);
  
  // Order rarities from highest to lowest
  const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'common'];
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      className="modal-overlay"
      style={{
        backdropFilter: 'blur(8px)',
        zIndex: 40,
        alignItems: 'flex-start',
        overflowY: 'auto',
        padding: 'var(--space-xl) 0'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="container">
        <motion.div
          className="ui-card mb-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex justify-between items-center">
            <h2 className="mb-sm">Your Collection</h2>
            <motion.button 
              className="btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              style={{ marginBottom: 0 }}
              aria-label="Close collection"
            >
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1.25rem', height: '1.25rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
          
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${Math.min(100, (cards.length / 25) * 100)}%` }} />
          </div>
          <p className="mb-sm" style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>
            {cards.length} {cards.length === 1 ? 'card' : 'cards'} collected
          </p>
        </motion.div>
        
        {cards.length === 0 ? (
          <motion.div 
            className="ui-card text-center"
            style={{ padding: 'var(--space-2xl) var(--space-xl)' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" 
              style={{ 
                width: '4rem', 
                height: '4rem', 
                margin: '0 auto var(--space-lg)', 
                opacity: 0.6,
                color: 'var(--gray-400)'
              }} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mb-md">Your collection is empty</h3>
            <p style={{ color: 'var(--gray-400)', marginBottom: 'var(--space-lg)' }}>
              Roll your first card to start your collection!
            </p>
            <motion.button 
              className="roll-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
            >
              Roll Your First Card
            </motion.button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-lg">
            {rarityOrder.map(rarity => {
              if (!cardsByRarity[rarity]?.length) return null;
              
              return (
                <motion.div 
                  key={rarity}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rarityOrder.indexOf(rarity) * 0.1 + 0.2 }}
                >
                  <div className="flex justify-between items-center mb-md">
                    <h3 className={`section-title rarity-${rarity}`} style={{ 
                      fontSize: '1.25rem',
                      textTransform: 'capitalize',
                      marginBottom: 0
                    }}>
                      {rarity} Cards <span className="glass-effect" style={{ 
                        fontSize: '0.75rem',
                        padding: '0 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        marginLeft: 'var(--space-xs)'
                      }}>
                        {cardsByRarity[rarity].length}
                      </span>
                    </h3>
                  </div>
                  
                  <div className="card-grid">
                    {cardsByRarity[rarity].map(card => (
                      <motion.div
                        key={card.card_id}
                        className="card-grid-item"
                        style={{
                          boxShadow: (rarityGlow as any)[card.rarity] || rarityGlow.common,
                          border: `1px solid var(--rarity-${card.rarity})`,
                        }}
                        whileHover={{ 
                          y: -5,
                          boxShadow: `0 15px 25px -3px rgba(0, 0, 0, 0.6), ${(rarityGlow as any)[card.rarity] || rarityGlow.common}`
                        }}
                        onClick={() => setSelectedCard(card)}
                      >
                        <div className="card-image-container" style={{ paddingTop: '100%' }}>
                          <img 
                            className="card-image"
                            src={`${API_URL}/${card.image_path}`} 
                            alt={card.character}
                          />
                          <div className="card-info-overlay">
                            <div>
                              <h4 className={`rarity-${card.rarity}`} style={{
                                fontSize: '0.95rem',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginBottom: 'var(--space-xs)'
                              }}>
                                {card.character}
                              </h4>
                              <div className="flex justify-between items-center">
                                <span className="glass-effect" style={{
                                  fontSize: '0.7rem',
                                  padding: '1px 6px',
                                  borderRadius: 'var(--radius-full)'
                                }}>
                                  #{card.card_id}
                                </span>
                                
                                <span className={`rarity-${card.rarity}`} style={{ 
                                  fontSize: '0.7rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}>
                                  {card.rarity}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      
      {selectedCard && (
        <CardDisplay card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </motion.div>
  );
};

export default Collection;