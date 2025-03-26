// src/components/LoadingScreen.tsx
import { motion } from 'framer-motion';

const pulseMessages = [
  "Scanning alternate universes",
  "Analyzing character variations",
  "Calculating rarity probabilities",
  "Rendering digital manifestation",
  "Creating unique narrative",
  "Assembling visual components",
  "Converting quantum fluctuations"
];

const LoadingScreen = () => {
  // Pick a random message
  const randomMessage = pulseMessages[Math.floor(Math.random() * pulseMessages.length)];

  return (
    <div className="modal-overlay">
      <motion.div
        className="ui-card"
        style={{ 
          width: '90%', 
          maxWidth: '30rem', 
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          background: 'rgba(26, 22, 37, 0.9)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          overflow: 'hidden',
          position: 'relative'
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated decorative orbs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
          <motion.div 
            style={{
              position: 'absolute',
              top: '10%',
              left: '10%',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05) 70%)',
              filter: 'blur(20px)'
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              repeatType: 'reverse'
            }}
          />
          
          <motion.div 
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '10%',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15), rgba(236, 72, 153, 0.05) 70%)',
              filter: 'blur(20px)'
            }}
            animate={{
              x: [0, -20, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              repeatType: 'reverse'
            }}
          />
        </div>
        
        <div style={{ 
          padding: 'var(--space-xl) var(--space-lg)', 
          position: 'relative', 
          zIndex: 1
        }}>
          {/* Spinner animation */}
          <div style={{ position: 'relative', width: '8rem', height: '8rem', margin: '0 auto var(--space-lg)' }}>
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                border: '3px solid transparent',
                borderTop: '3px solid var(--purple-500)',
                borderBottom: '3px solid var(--purple-500)',
                borderRadius: '50%'
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            
            <motion.div
              style={{
                position: 'absolute',
                inset: '10px',
                border: '3px solid transparent',
                borderLeft: '3px solid var(--pink-500)',
                borderRight: '3px solid var(--pink-500)',
                borderRadius: '50%'
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            
            <motion.div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '40%',
                height: '40%',
                marginTop: '-20%',
                marginLeft: '-20%',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.6), rgba(236, 72, 153, 0.6))',
                borderRadius: '50%',
                filter: 'blur(10px)'
              }}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </div>
          
          {/* Progress bar */}
          <div className="progress-container mb-lg">
            <motion.div
              className="progress-bar"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                repeatType: "loop",
                ease: [0.34, 1.56, 0.64, 1] // Custom spring ease
              }}
            />
          </div>
          
          {/* Main text */}
          <motion.h3
            className="mb-sm"
            style={{
              fontSize: '1.5rem',
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(to right, var(--purple-400), var(--pink-400))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
            animate={{ 
              opacity: [0.8, 1, 0.8],
              scale: [0.98, 1.02, 0.98]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          >
            Generating your unique AI card
          </motion.h3>
          
          {/* Random status message */}
          <div style={{ 
            height: '1.5rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <motion.span
              style={{
                fontSize: '0.875rem',
                fontFamily: 'var(--font-display)',
                color: 'var(--purple-300)',
                letterSpacing: '0.025em'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ 
                duration: 2,
                repeat: Infinity
              }}
            >
              {randomMessage}...
            </motion.span>
          </div>
          
          {/* API delay message */}
          <motion.p
            style={{
              fontSize: '0.75rem',
              color: 'var(--gray-400)',
              marginTop: '1.5rem',
              maxWidth: '90%',
              margin: '1.5rem auto 0'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }} // Show after a delay
          >
            We appreciate your patience. The image generation API may take longer during high-traffic periods.
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;