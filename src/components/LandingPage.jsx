import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

// Custom Cinematic Preloader Component
function Preloader({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3500); // 3.5 seconds preloader
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: '#0a0a0a', color: '#f4f4f0',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        fontFamily: "'Playfair Display', serif"
      }}
    >
      <div style={{ overflow: 'hidden' }}>
        <motion.h1 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
          style={{ fontSize: '2.5rem', fontWeight: 400, margin: 0, fontStyle: 'italic' }}
        >
          Your neighborhood
        </motion.h1>
      </div>
      <div style={{ overflow: 'hidden', marginTop: '1rem' }}>
        <motion.p 
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 1.2, ease: [0.76, 0, 0.24, 1] }}
          style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: "'Inter', sans-serif", color: '#888' }}
        >
          Deserves better.
        </motion.p>
      </div>
    </motion.div>
  );
}

// Crisp, character-based circular text component
const CircularText = ({ text: baseText, radius, fontSize, color, duration, direction }) => {
  // Dynamically calculate how many times to repeat the text based on circumference
  // This guarantees perfect letter spacing without any overlapping or ugly clustering!
  const charWidth = fontSize * 0.65; // Approx monospace width
  const circumference = 2 * Math.PI * radius;
  const charsToFit = Math.floor(circumference / charWidth);
  const repeats = Math.max(1, Math.floor(charsToFit / baseText.length));
  const finalText = baseText.repeat(repeats);

  const characters = finalText.split("");
  const totalCharacters = characters.length;
  const anglePerChar = 360 / totalCharacters;

  return (
    <motion.div
      animate={{ rotate: direction === 1 ? 360 : -360 }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
      style={{
        position: "absolute",
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        top: "50%",
        left: "50%",
        marginTop: `-${radius}px`,
        marginLeft: `-${radius}px`,
      }}
    >
      {characters.map((char, index) => (
        <span
          key={index}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) rotate(${index * anglePerChar}deg) translateY(-${radius}px)`,
            fontSize: `${fontSize}px`,
            fontFamily: "monospace",
            color: color,
            fontWeight: "bold",
            opacity: 0.8
          }}
        >
          {char}
        </span>
      ))}
    </motion.div>
  );
};

// Canvas-based Dense Data Background Component
const DataGridBackground = () => {
  const canvasRef = React.useRef(null);
  const mouseRef = React.useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize by disabling alpha on context if possible, but we need dark background
    
    let cols = 0;
    let rows = 0;
    const fontSize = 12; // Denser matrix
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-=<>•/\\".split("");

    const drawCell = (x, y, isHighlight = false) => {
      const char = chars[Math.floor(Math.random() * chars.length)];
      
      // Clear the specific cell
      ctx.fillStyle = "#050505";
      ctx.fillRect(x * fontSize, y * fontSize, fontSize, fontSize);
      
      // Draw the new character
      if (isHighlight) {
        ctx.fillStyle = `rgba(212, 175, 55, 0.95)`; // Bright gold for cursor trace
      } else {
        const alpha = Math.random() * 0.4 + 0.1;
        ctx.fillStyle = Math.random() > 0.95 ? `rgba(212, 175, 55, ${alpha})` : `rgba(100, 100, 100, ${alpha * 0.5})`;
      }
      ctx.fillText(char, x * fontSize + (fontSize/2), y * fontSize + fontSize - 2);
    };

    const drawInitialGrid = () => {
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = fontSize + "px monospace";
      ctx.textAlign = "center";
      
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (Math.random() > 0.15) { // Highly dense
            drawCell(x, y);
          }
        }
      }
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / fontSize);
      rows = Math.ceil(canvas.height / fontSize);
      drawInitialGrid();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const drawFlicker = () => {
      if (!ctx || cols === 0 || rows === 0) return;
      
      ctx.font = fontSize + "px monospace";
      ctx.textAlign = "center";

      // Background decay (overwrites cells, eroding the cursor trail over time)
      for (let i = 0; i < 200; i++) {
        const x = Math.floor(Math.random() * cols);
        const y = Math.floor(Math.random() * rows);
        drawCell(x, y);
      }

      // Cursor tracing logic
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      if (mx >= 0 && my >= 0) {
        const cx = Math.floor(mx / fontSize);
        const cy = Math.floor(my / fontSize);
        // Draw a cluster around the cursor
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            // Distance check for circular brush
            if (dx*dx + dy*dy <= 5 && Math.random() > 0.4) {
              const nx = cx + dx;
              const ny = cy + dy;
              if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                drawCell(nx, ny, true);
              }
            }
          }
        }
      }
    };

    const interval = setInterval(drawFlicker, 50); // 20fps

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%', zIndex: 0 }} />;
};

function LandingPage() {
  const [loading, setLoading] = useState(true);

  // Disable scroll while loading
  useEffect(() => {
    if (loading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [loading]);

  return (
    <div style={{ backgroundColor: '#121212', color: '#f4f4f0', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      <AnimatePresence>
        {loading && <Preloader onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {/* Ultra-minimal Header */}
      <motion.nav 
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 1.5, delay: 1 }}
        style={{
          position: 'fixed', top: 0, width: '100%', zIndex: 100,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '2rem 4rem',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)'
        }}
      >
        <div style={{ fontSize: '1rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          Local Fix
        </div>
        <Link 
          to="/app" 
          onClick={() => window.scrollTo(0, 0)}
          style={{ 
            fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', 
            color: '#f4f4f0', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.4)', 
            padding: '0.75rem 1.5rem', borderRadius: '4px', transition: 'all 0.3s',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)', backgroundColor: 'rgba(0,0,0,0.2)'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f4f4f0'; e.currentTarget.style.color = '#121212'; e.currentTarget.style.textShadow = 'none'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'; e.currentTarget.style.color = '#f4f4f0'; e.currentTarget.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)'; }}
        >
          Enter Platform
        </Link>
      </motion.nav>

      {/* Cyber/Data Full-Bleed Hero */}
      <section style={{ height: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#050505' }}>
        
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Great+Vibes&display=swap');
            
            .text-glitch {
              font-family: 'Oswald', sans-serif;
              font-weight: 700;
              font-size: clamp(6rem, 15vw, 15rem);
              line-height: 0.95;
              color: #FFD700;
              margin: 0;
              text-transform: uppercase;
              text-shadow: 0 8px 24px rgba(0,0,0,0.8);
              position: relative;
              z-index: 10;
              letter-spacing: -0.01em;
            }

            .script-accent {
              font-family: 'Great Vibes', cursive;
              font-size: clamp(3rem, 7vw, 7rem);
              color: #f4f4f0;
              position: absolute;
              top: -15%;
              left: 50%;
              transform: translateX(-50%) rotate(-8deg);
              z-index: 20;
              white-space: nowrap;
              text-shadow: 0 4px 16px rgba(0,0,0,1);
            }
          `}
        </style>

        {/* Dense ASCII Grid Background */}
        <DataGridBackground />
        
        {/* Cinematic Vignette Overlay */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'radial-gradient(circle at center, transparent 0%, rgba(5,5,5,0.85) 65%, rgba(5,5,5,1) 100%)', pointerEvents: 'none' }} />

        <div style={{ zIndex: 10, textAlign: 'center', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ position: 'relative' }}>
            <motion.h2 
              initial={{ opacity: 0, y: -20, rotate: -5, x: '-50%' }}
              animate={{ opacity: loading ? 0 : 1, y: 0, rotate: -5, x: '-50%' }}
              transition={{ duration: 1.5, delay: 1 }}
              className="script-accent"
            >
              The Platform
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: loading ? 0 : 1, scale: 1 }}
              transition={{ duration: 1.5, delay: 0.5, ease: [0.76, 0, 0.24, 1] }}
            >
              <h1 className="text-glitch">EMPOWER</h1>
              <h1 className="text-glitch" style={{ color: '#E5C100' }}>YOUR CITY</h1>
            </motion.div>
          </div>

        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: loading ? 0 : 1 }}
          transition={{ duration: 1, delay: 2 }}
          style={{ position: 'absolute', bottom: '3rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', zIndex: 10, color: '#FFD700' }}
        >
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: "'Inter', sans-serif" }}>Scroll to Explore</span>
          <div style={{ width: '1px', height: '40px', backgroundColor: 'rgba(255,215,0,0.5)' }} />
        </motion.div>

        {/* Bottom Gradient Fade for smooth section transition */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '25vh',
          background: 'linear-gradient(to bottom, rgba(18,18,18,0) 0%, rgba(18,18,18,1) 100%)',
          zIndex: 15,
          pointerEvents: 'none'
        }} />
      </section>

      {/* Centered Typography Section (The Movement) */}
      <section style={{ position: 'relative', padding: '12rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#121212' }}>
        
        {/* Modern Dot-Grid / Nodes Background (Aligns with tech/community theme) */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.4 }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(rgba(212,175,55,0.15) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            WebkitMaskImage: 'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,1) 100%)',
            maskImage: 'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,1) 100%)',
            pointerEvents: 'none', zIndex: 0
          }}
        />

        <div style={{ zIndex: 10, maxWidth: '1000px', padding: '0 2rem' }}>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#b0a484', marginBottom: '3rem' }}
          >
            ✦ ✦ ✦ THE MOVEMENT ✦ ✦ ✦
          </motion.p>
          
          <motion.h2 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.2 }}
            style={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', 
              fontWeight: 400, 
              lineHeight: 1.4, 
              color: '#f4f4f0', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            "A city is not just concrete and steel, where the streets become a voice and communities guard the wisdom of the collective. The urban heritage comes alive—a primal force that reconnects people with their neighborhoods and <span style={{ color: 'rgba(244,244,240,0.4)' }}>empowers them to bring a smarter, safer tomorrow to life."</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
            style={{ marginTop: '4rem' }}
          >
            <Link 
              to="/app/report" 
              onClick={() => window.scrollTo(0, 0)}
              style={{ 
                display: 'inline-block',
                fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', 
                color: '#f4f4f0', backgroundColor: 'transparent', textDecoration: 'none', 
                border: '1px solid rgba(244,244,240,0.2)', borderRadius: '32px',
                padding: '1rem 3rem', transition: 'all 0.3s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f4f4f0'; e.currentTarget.style.color = '#121212'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#f4f4f0'; }}
            >
              Report Issue
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Massive Call to Action with Concentric Circles */}
      <section style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', backgroundColor: '#121212', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        
        {/* Animated Background Container - Concentric Typography */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.25, pointerEvents: 'none' }}>
          
          <CircularText 
            text="LOCAL FIX • COMMUNITY HERO • EMPOWER YOUR CITY • "
            radius={450} fontSize={16} color="#ffffff" duration={100} direction={1} 
          />
          <CircularText 
            text="THE PLATFORM FOR CIVIC ENGAGEMENT • TRACK YOUR IMPACT • "
            radius={360} fontSize={14} color="#ffffff" duration={80} direction={-1} 
          />
          <CircularText 
            text="REPORT ISSUES • JOIN GROUPS • MAKE A DIFFERENCE • "
            radius={270} fontSize={14} color="#ffffff" duration={60} direction={1} 
          />
          <CircularText 
            text="REAL-TIME MAPS • AI ANALYSIS • CIVIC DATA • "
            radius={180} fontSize={12} color="#ffffff" duration={40} direction={-1} 
          />
          <CircularText 
            text="LOCAL FIX • V1.0.0 • ACTIVE • "
            radius={90} fontSize={12} color="#ffffff" duration={30} direction={1} 
          />

        </div>

        <div style={{ zIndex: 10, position: 'relative' }}>
          <motion.h2 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(4rem, 8vw, 6.5rem)', fontWeight: 400, marginBottom: '3rem', color: '#f4f4f0', textShadow: '0 4px 24px rgba(0,0,0,0.8)' }}
          >
            Be the Local Hero.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
          >
            <Link 
              to="/app" 
              onClick={() => window.scrollTo(0, 0)}
              style={{ 
                display: 'inline-block',
                fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', 
                color: '#121212', backgroundColor: '#f4f4f0', textDecoration: 'none', 
                padding: '1.25rem 3rem', transition: 'all 0.5s cubic-bezier(0.76, 0, 0.24, 1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#d4af37'; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f4f4f0'; e.currentTarget.style.color = '#121212'; }}
            >
              Enter Dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '3rem 4rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666' }}>
        <div>&copy; {new Date().getFullYear()} Local Fix Platform.</div>
        <div>Crafted for the Future.</div>
      </footer>
    </div>
  );
}

export default LandingPage;
