import React from 'react';
import { motion } from 'framer-motion';
import GooeyNav from './GooeyNav';
import './GooeyNav.css';
import BlurText from './BlurText';
import TiltedCard from './TiltedCard';
import Explore from './Explore'; // Import the Explore component
// Removed Aurora import
// Removed Aurora.css import

const LandingPage: React.FC = () => {
  const navItems = [
    { label: "Home", href: "#home" },
    { label: "Explore", "href": "#explore" }, // Ensure this href matches the Explore section's ID
    { label: "Features", href: "#features" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
    { label: "Login", href: "#login" },
    { label: "Get Started", href: "#get-started" },
  ];

  const navbarHeight = '4em';

  return (
    // Removed position: 'relative' from here as Aurora is gone
    <div style={{ background: 'black', minHeight: '100vh', width: '100vw', overflowX: 'hidden' }}>
      {/* Removed Aurora Background div */}

      {/* Main content layer - Removed position: 'relative', zIndex: 1 as Aurora is gone */}
      <div>
        <GooeyNav
          items={navItems}
          particleCount={15}
          particleDistances={[90, 10]}
          particleR={100}
          initialActiveIndex={0}
          animationTime={600}
          timeVariance={300}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
        />

        <div style={{ paddingTop: navbarHeight }}>
          <section
            id="home"
            style={{
              minHeight: `calc(100vh - ${navbarHeight})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              padding: '2em',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                maxWidth: '1400px',
                width: '100%',
                gap: '4em',
              }}
              className="hero-section-content"
            >
              {/* Left: Text Content */}
              <div style={{ flex: 1, textAlign: 'left', maxWidth: '600px' }}>
                <BlurText
                  text="Simplify Your Invoicing & Payment Tracking with Ease"
                  delay={50}
                  animateBy="words"
                  direction="top"
                  className="text-gradient"
                  style={{
                    fontSize: '3.5rem',
                    marginBottom: '0.75em',
                    lineHeight: '1.2',
                    fontWeight: '700',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                  animationFrom={{ filter: 'blur(12px)', opacity: 0, y: -30 }}
                  animationTo={[
                    { filter: 'blur(6px)', opacity: 0.6, y: 5 },
                    { filter: 'blur(0px)', opacity: 1, y: 0 }
                  ]}
                  hoverScale={1.05}
                  hoverColor="#00f2fe"
                  hoverTransition={{ duration: 0.15, ease: "easeOut" }}
                />

                <BlurText
                  text="Your all-in-one Invoice Management System to create professional invoices, track payments, manage clients, and stay in control of your finances—anytime, anywhere."
                  delay={30}
                  animateBy="words"
                  direction="bottom"
                  className="subtitle-text"
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: '300',
                    lineHeight: '1.6',
                    marginBottom: '2em',
                    color: '#cccccc',
                    cursor: 'pointer',
                  }}
                  animationFrom={{ filter: 'blur(8px)', opacity: 0, y: 20 }}
                  animationTo={[
                    { filter: 'blur(4px)', opacity: 0.4, y: -5 },
                    { filter: 'blur(0px)', opacity: 1, y: 0 }
                  ]}
                  hoverScale={1.01}
                  hoverColor="#FFFFFF"
                  hoverTransition={{ duration: 0.15, ease: "easeOut" }}
                />

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  style={{
                    padding: '1em 2em',
                    fontSize: '1rem',
                    fontWeight: '600',
                    background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                    border: 'none',
                    borderRadius: '50px',
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)',
                  }}
                  whileHover={{
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0, 242, 254, 0.4)',
                    transition: { duration: 0.3 }
                  }}
                >
                  Get Started Now
                </motion.button>
              </div>

              {/* Right: Video Content with TiltedCard */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                style={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  maxWidth: '650px',
                  width: '100%',
                  height: 'auto',
                  aspectRatio: '16 / 9',
                }}
              >
                <TiltedCard
                  imageSrc=""
                  altText="Invoice Management System Video"
                  captionText="Your Invoice Management System"
                  containerHeight="100%"
                  containerWidth="100%"
                  imageHeight="100%"
                  imageWidth="100%"
                  rotateAmplitude={8}
                  scaleOnHover={1.05}
                  showMobileWarning={false}
                  showTooltip={true}
                  displayOverlayContent={true}
                  overlayContent={
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0,0,0,0.5)',
                      boxShadow: 'inset 0 0 20px rgba(79, 172, 254, 0.2)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          mixBlendMode: 'normal',
                          filter: 'none'
                        }}
                      >
                        <source src="/videos/invoice_Landing_video.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  }
                />
              </motion.div>
            </div>
          </section>

          {/* Integrated Explore Component */}
          <Explore />

          {/* Other sections of your landing page */}
          <section id="features" style={{ height: '500px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#222' }}>
            <h2>Key Features</h2>
          </section>
          <section id="about" style={{ height: '500px', backgroundColor: '#333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h2>About Us</h2>
          </section>
          <section id="contact" style={{ height: '500px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h2>Contact</h2>
          </section>
          <section id="login" style={{ height: '500px', backgroundColor: '#333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h2>Login</h2>
          </section>
          <section id="get-started" style={{ height: '500px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h2>Get Started Now!</h2>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;