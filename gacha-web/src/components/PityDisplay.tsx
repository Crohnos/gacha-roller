import React from 'react';

// Define the pity thresholds (matching backend values)
const PITY_THRESHOLDS = {
  rare: 10,    // Guaranteed rare after 10 commons
  epic: 50,    // Guaranteed epic after 50 rolls without an epic
  legendary: 100, // Guaranteed legendary after 100 rolls
  mythic: 300,  // Guaranteed mythic after 300 rolls
};

type PityInfo = {
  rolls_until_rare: number;
  rolls_until_epic: number;
  rolls_until_legendary: number;
  rolls_until_mythic: number;
  common_streak: number;
  total_rolls: number;
  guaranteed_next_rarity: string | null;
};

type PityDisplayProps = {
  pityInfo?: PityInfo;
};

const PityDisplay: React.FC<PityDisplayProps> = ({ pityInfo }) => {
  if (!pityInfo) return null;

  // Get the next guaranteed rarity
  const guaranteedRarity = pityInfo.guaranteed_next_rarity;
  
  // Find the lowest non-zero roll counter
  const getNextPityMilestone = () => {
    const thresholds = [
      { rarity: 'rare', rolls: pityInfo.rolls_until_rare },
      { rarity: 'epic', rolls: pityInfo.rolls_until_epic },
      { rarity: 'legendary', rolls: pityInfo.rolls_until_legendary },
      { rarity: 'mythic', rolls: pityInfo.rolls_until_mythic }
    ];
    
    // Sort by rolls ascending, but filter out any that are 0
    const nextMilestone = thresholds
      .filter(t => t.rolls > 0)
      .sort((a, b) => a.rolls - b.rolls)[0];
      
    return nextMilestone;
  };
  
  const nextMilestone = getNextPityMilestone();

  // Safe method to calculate percentage
  const calculateProgressPercentage = (current: number, threshold: number) => {
    if (!threshold) return 0;
    return 100 - (current / threshold * 100);
  };
  
  // Get color class based on rarity
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'rare': return 'rarity-rare';
      case 'epic': return 'rarity-epic';
      case 'legendary': return 'rarity-legendary';
      case 'mythic': return 'rarity-mythic';
      default: return '';
    }
  };
  
  return (
    <div className="pity-display" style={{ 
      margin: '10px 0', 
      padding: '15px', 
      borderRadius: 'var(--radius-md)', 
      background: 'rgba(0,0,0,0.05)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>Pity System</h4>
        <span style={{ 
          fontSize: '0.7rem', 
          backgroundColor: 'rgba(0,0,0,0.06)', 
          padding: '2px 6px', 
          borderRadius: '10px',
          color: 'var(--text-muted)'
        }}>
          Rolls: {pityInfo.total_rolls}
        </span>
      </div>
      
      {guaranteedRarity ? (
        <div style={{ 
          marginBottom: '10px',
          backgroundColor: `var(--glow-${guaranteedRarity})`,
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center',
          boxShadow: 'inset 0 0 8px rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontWeight: 'bold', color: 'white' }}>
            Next roll guaranteed: <span className={getRarityColor(guaranteedRarity)} style={{ 
              fontWeight: 'bold',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              {guaranteedRarity.charAt(0).toUpperCase() + guaranteedRarity.slice(1)}
            </span>!
          </span>
        </div>
      ) : nextMilestone ? (
        <div style={{ 
          marginBottom: '10px', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <div style={{ 
            width: '100%', 
            height: '10px', 
            backgroundColor: 'rgba(0,0,0,0.1)', 
            borderRadius: '5px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: nextMilestone.rarity === 'rare' ? `${calculateProgressPercentage(nextMilestone.rolls, 10)}%` :
                     nextMilestone.rarity === 'epic' ? `${calculateProgressPercentage(nextMilestone.rolls, 50)}%` :
                     nextMilestone.rarity === 'legendary' ? `${calculateProgressPercentage(nextMilestone.rolls, 100)}%` :
                     nextMilestone.rarity === 'mythic' ? `${calculateProgressPercentage(nextMilestone.rolls, 300)}%` : '0%',
              height: '100%', 
              backgroundColor: `var(--rarity-${nextMilestone.rarity})` 
            }} />
          </div>
          
          <span style={{ 
            whiteSpace: 'nowrap',
            fontSize: '0.85rem'
          }}>
            <span className={getRarityColor(nextMilestone.rarity)} style={{ fontWeight: 'bold' }}>
              {nextMilestone.rarity.charAt(0).toUpperCase() + nextMilestone.rarity.slice(1)}
            </span> in {nextMilestone.rolls}
          </span>
        </div>
      ) : null}
      
      <div className="pity-stats" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        fontSize: '0.75rem', 
        color: 'var(--text-muted)',
        borderTop: '1px solid rgba(0,0,0,0.05)',
        paddingTop: '8px',
        marginTop: '5px'
      }}>
        <span>
          <span style={{ fontWeight: 'bold' }}>Commons streak:</span> {pityInfo.common_streak || 0}
        </span>
        
        <span>
          <span style={{ fontWeight: 'bold' }}>Rolls since epic:</span> {Math.max(0, PITY_THRESHOLDS.epic - (pityInfo.rolls_until_epic || 0))}
        </span>
      </div>
    </div>
  );
};

export default PityDisplay;