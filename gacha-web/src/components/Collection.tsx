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
  onDeleteCard: (cardId: number) => void;
};

// Rarity config for collection styling
const rarityGlow = {
  common: 'var(--glow-common)',
  rare: 'var(--glow-rare)',
  epic: 'var(--glow-epic)',
  legendary: 'var(--glow-legendary)',
  mythic: 'var(--glow-mythic)',
};

const Collection = ({ cards, isOpen, onClose, onDeleteCard }: CollectionProps) => {
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
                        className="tcg-grid-card"
                        style={{
                          background: 'black',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          boxShadow: `0 5px 15px rgba(0,0,0,0.4), ${(rarityGlow as any)[card.rarity] || rarityGlow.common}`,
                          border: `2px solid var(--rarity-${card.rarity})`,
                          position: 'relative',
                          aspectRatio: '5/7',
                        }}
                        whileHover={{ 
                          y: -8,
                          scale: 1.05,
                          boxShadow: `0 15px 30px rgba(0,0,0,0.6), ${(rarityGlow as any)[card.rarity] || rarityGlow.common}`,
                          rotate: '2deg',
                          transition: { duration: 0.2 }
                        }}
                        onClick={() => setSelectedCard(card)}
                      >
                        {/* Card Frame */}
                        <div style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '24px',
                          background: card.rarity === 'common' ? 'linear-gradient(to right, #555, #777)' :
                                      card.rarity === 'rare' ? 'linear-gradient(to right, #1e40af, #3b82f6)' :
                                      card.rarity === 'epic' ? 'linear-gradient(to right, #7e22ce, #a855f7)' :
                                      card.rarity === 'legendary' ? 'linear-gradient(to right, #b45309, #eab308)' :
                                      'linear-gradient(to right, #7f1d1d, #ef4444)',
                          zIndex: 1,
                          borderBottom: '1px solid rgba(255,255,255,0.3)'
                        }} />
                        
                        {/* Card Image */}
                        <div style={{ 
                          padding: '28px 6px 6px 6px',
                          height: '70%',
                          position: 'relative',
                          background: '#000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <div style={{
                            width: '100%',
                            height: '100%',
                            overflow: 'hidden',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            position: 'relative',
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <img 
                              src={`${API_URL}/${card.image_path}`} 
                              alt={card.character}
                              style={{ 
                                maxHeight: '100%',
                                maxWidth: '100%',
                                objectFit: 'contain'
                              }} 
                            />
                          </div>
                          
                          {/* Rarity Stars */}
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            right: '8px',
                            zIndex: 2,
                            display: 'flex',
                            gap: '2px'
                          }}>
                            {Array.from({ length: 
                              card.rarity === 'common' ? 1 :
                              card.rarity === 'rare' ? 2 :
                              card.rarity === 'epic' ? 3 :
                              card.rarity === 'legendary' ? 4 : 5 
                            }).map((_, i) => (
                              <div key={i} style={{
                                width: '8px',
                                height: '8px',
                                background: card.rarity === 'mythic' ? 
                                  'linear-gradient(to bottom right, #ef4444, #fef08a, #ef4444)' : 
                                  'linear-gradient(to bottom right, #facc15, #fef08a, #facc15)',
                                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                                boxShadow: '0 0 2px rgba(255,255,255,0.7)'
                              }} />
                            ))}
                          </div>
                        </div>
                        
                        {/* Card Name */}
                        <div style={{
                          padding: '4px 6px',
                          background: 'rgba(0,0,0,0.8)',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          color: card.rarity === 'common' ? '#ddd' :
                                card.rarity === 'rare' ? '#60a5fa' :
                                card.rarity === 'epic' ? '#c084fc' :
                                card.rarity === 'legendary' ? '#facc15' : '#ef4444',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                          borderTop: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          {card.character.replace(/\s*\(.*?\)\s*/, '')}
                        </div>
                        
                        {/* Card ID */}
                        <div style={{
                          position: 'absolute',
                          bottom: '4px',
                          left: '6px',
                          fontSize: '0.6rem',
                          color: 'rgba(255,255,255,0.5)',
                        }}>
                          #{card.card_id}
                        </div>
                        
                        {/* Delete button */}
                        <button 
                          className="delete-card-btn"
                          aria-label="Delete card"
                          style={{
                            position: 'absolute',
                            top: '30px',
                            right: '8px',
                            background: 'rgba(220, 38, 38, 0.8)',
                            color: 'white',
                            border: 'none',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            zIndex: 10,
                            fontSize: '12px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete this ${card.rarity} ${card.character} card?`)) {
                              onDeleteCard(card.card_id);
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                          </svg>
                        </button>
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