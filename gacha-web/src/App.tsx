// src/App.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store';
import LoadingScreen from './components/LoadingScreen';
import CardDisplay from './components/CardDisplay';
import Collection from './components/Collection';
import PityDisplay from './components/PityDisplay';

const App = () => {
  const { 
    loading, 
    card, 
    collection, 
    error, 
    rollCard, 
    fetchCollection, 
    fetchPityInfo, 
    clearCard, 
    lastPityInfo 
  } = useStore();
  
  const [showCollection, setShowCollection] = useState(false);
  
  // Initialize local storage user and fetch collection on mount
  useEffect(() => {
    // Create a temporary user ID if needed and fetch data
    const initializeLocalData = async () => {
      try {
        // Initialize collection from localStorage
        fetchCollection();
        
        // Fetch pity info from backend
        await fetchPityInfo();
      } catch (error) {
        console.error('Failed to initialize local data:', error);
      }
    };
    
    initializeLocalData();
  }, [fetchCollection, fetchPityInfo]);
  
  // No need to check for reset token since we removed auth
  
  return (
    <div className="container">
      {/* Logo and header */}
      <header>
        <div className="header-content">
          <h1 className="logo">
            Gacha Roller
          </h1>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              className="btn-secondary"
              onClick={() => setShowCollection(true)}
            >
              My Collection ({collection.length})
            </button>
            
            {/* Collection expires in 24 hours */}
            <small style={{ opacity: 0.7 }}>
              Collection stored for 24 hours
            </small>
          </div>
        </div>
      </header>
      
      <main>
        <div className="text-center" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <hgroup className="mb-lg">
              <h2>Roll for AI Characters</h2>
              <p>Collect unique AI-generated cards featuring famous AI characters reimagined in alternate universes.</p>
            </hgroup>
            
            {error && (
              <article 
                style={{ 
                  background: error.includes('servers are currently busy') || error.includes('service might be temporarily overloaded') 
                    ? 'rgba(126, 87, 0, 0.3)' // Amber for 503 or overload messages
                    : 'rgba(127, 29, 29, 0.4)', // Red for other errors
                  color: error.includes('servers are currently busy') || error.includes('service might be temporarily overloaded')
                    ? '#fef3c7' // Light amber text
                    : '#fecaca', // Light red text
                  border: error.includes('servers are currently busy') || error.includes('service might be temporarily overloaded')
                    ? '1px solid rgba(217, 119, 6, 0.4)' 
                    : '1px solid rgba(220, 38, 38, 0.3)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  margin: '0 0 20px 0',
                  position: 'relative'
                }}
              >
                {/* Display an icon for API overload errors */}
                {(error.includes('servers are currently busy') || error.includes('service might be temporarily overloaded')) && (
                  <span style={{ marginRight: '6px', fontSize: '16px' }}>⚠️</span>
                )}
                {error}
              </article>
            )}
            
            {/* Roll button */}
            <motion.button
              className="roll-button w-full mb-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              onClick={() => {
                // Call rollCard with no parameters for random rarity
                console.log('Roll button clicked - using random rarity');
                rollCard();
              }}
            >
              {loading ? 'Rolling...' : 'Roll a Card'}
            </motion.button>
            
            {/* Pity display - always show if we have info */}
            {lastPityInfo && (
              <div className="mb-lg">
                <PityDisplay pityInfo={lastPityInfo} />
              </div>
            )}
            
            {/* Rarity tiers card */}
            <div className="ui-card" style={{ textAlign: 'left', position: 'relative' }}>
              <h3 className="section-title mb-md">Rarity Tiers</h3>
              
              {/* Developer Test Mode Note */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                background: '#FEF9C3',
                border: '1px solid #ca8a04',
                borderRadius: '8px',
                padding: '8px 12px',
                maxWidth: '180px',
                fontSize: '0.8rem',
                color: '#854d0e',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                transform: 'rotate(2deg)',
                zIndex: 2
              }}>
                <strong>Dev Test:</strong> Click any rarity to force roll that tier!
              </div>
              
              <dl className="flex flex-col gap-sm">
                <div className="flex justify-between items-center">
                  <dt className="rarity-common" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Common clicked - forcing common rarity');
                      
                      // Explicit string
                      const rarityValue = "common";
                      rollCard(rarityValue);
                    }} 
                    style={{ 
                      cursor: 'pointer', 
                      textDecoration: 'underline', 
                      textDecorationStyle: 'dotted',
                      padding: '2px 6px'
                    }}>
                    Common
                  </dt>
                  <dd className="glass-effect" style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}>90%</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="rarity-rare"
                    onClick={() => rollCard('rare')} 
                    style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                    Rare
                  </dt>
                  <dd className="glass-effect" style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}>9%</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="rarity-epic"
                    onClick={() => rollCard('epic')} 
                    style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                    Epic
                  </dt>
                  <dd className="glass-effect" style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}>0.9%</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="rarity-legendary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Legendary clicked - forcing legendary rarity');
                      
                      // Explicit string
                      const rarityValue = "legendary";
                      setTimeout(() => {
                        console.log('Calling rollCard with legendary string:', rarityValue);
                        rollCard(rarityValue);
                      }, 50);
                    }} 
                    style={{ 
                      cursor: 'pointer', 
                      textDecoration: 'underline', 
                      textDecorationStyle: 'dotted',
                      backgroundColor: 'rgba(204, 143, 12, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                    Legendary
                  </dt>
                  <dd className="glass-effect" style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}>0.1%</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="rarity-mythic"
                    onClick={(e) => {
                      // Prevent default behavior
                      e.preventDefault();
                      e.stopPropagation();
                      
                      console.log('Mythic clicked! This should force a mythic rarity roll');
                      
                      // Explicitly pass a string, not the event
                      const rarityValue = "mythic";
                      
                      // Force a sync delay to ensure the click is registered
                      setTimeout(() => {
                        // Extra debugging
                        console.log('Calling rollCard with mythic string:', rarityValue);
                        rollCard(rarityValue);
                      }, 50);
                    }} 
                    style={{ 
                      cursor: 'pointer', 
                      textDecoration: 'underline', 
                      textDecorationStyle: 'dotted', 
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(217, 70, 239, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                    Mythic
                  </dt>
                  <dd className="glass-effect" style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}>0.0001%</dd>
                </div>
              </dl>
            </div>
          </motion.div>
        </div>
      </main>
      
      {/* Loading screen */}
      <AnimatePresence>
        {loading && <LoadingScreen />}
      </AnimatePresence>
      
      {/* Card display */}
      <AnimatePresence>
        {!loading && card && <CardDisplay card={card} onClose={clearCard} />}
      </AnimatePresence>
      
      {/* Collection modal */}
      <AnimatePresence>
        {showCollection && (
          <Collection
            cards={collection}
            isOpen={showCollection}
            onClose={() => setShowCollection(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Footer */}
      <footer>
        <p>
          &copy; 2025 Gacha Roller · All rights reserved
        </p>
      </footer>
      
      {/* Auth removed - collection stored in localStorage */}
    </div>
  );
};

export default App;