
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import GooeyNav from '@/components/GooeyNav';
import Aurora from '@/components/Aurora';

const LandingPage = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  const navItems = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Features", href: "#features" },
    { label: "Contact Us", href: "#contact" },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Aurora Background */}
      <div className="absolute inset-0 opacity-30">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.3}
          amplitude={0.8}
          speed={0.3}
        />
      </div>

      {/* Compact Navigation */}
      <nav className="relative z-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/5 backdrop-blur-md rounded-full px-6 py-2 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full"></div>
                <span className="text-white font-semibold text-lg">InvoiceApp</span>
              </div>
              
              <div className="hidden md:flex items-center space-x-6">
                <div style={{ height: '40px', position: 'relative' }}>
                  <GooeyNav
                    items={navItems}
                    particleCount={10}
                    particleDistances={[60, 8]}
                    particleR={80}
                    initialActiveIndex={0}
                    animationTime={500}
                    timeVariance={200}
                    colors={[1, 2, 3, 4]}
                  />
                </div>
                <Link to="/login">
                  <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 border-none px-4 py-2 text-sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-white text-black hover:bg-white/90 px-4 py-2 text-sm font-medium">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
          {/* Left Side - Text Content */}
          <div className="space-y-8 flex flex-col justify-center">
            {/* Blur Text Headline */}
            <div className="blur-text-container">
              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
                <span className="blur-text-word inline-block opacity-0 animate-fade-in" style={{ animationDelay: '0.1s' }}>Build</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>the</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in" style={{ animationDelay: '0.3s' }}>future</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in" style={{ animationDelay: '0.4s' }}>of</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent" style={{ animationDelay: '0.5s' }}>invoice</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" style={{ animationDelay: '0.6s' }}>management</span>
              </h1>
            </div>

            {/* Blur Text Subheadline */}
            <div className="blur-text-container">
              <p className="text-xl lg:text-2xl text-white/70 leading-relaxed max-w-2xl">
                <span className="blur-text-word inline opacity-0 animate-fade-in" style={{ animationDelay: '1s' }}>
                  Streamline your business operations with intelligent invoicing, automated payments, and real-time analytics. Built for modern teams.
                </span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 opacity-0 animate-fade-in" style={{ animationDelay: '1.5s' }}>
              <Link to="/register">
                <Button size="lg" className="bg-white text-black hover:bg-white/90 px-8 py-4 text-lg font-medium group">
                  Start building
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/5 px-8 py-4 text-lg font-medium"
                onClick={() => setIsVideoPlaying(!isVideoPlaying)}
              >
                <Play className="mr-2 h-5 w-5" />
                Watch demo
              </Button>
            </div>
          </div>

          {/* Right Side - Video */}
          <div className="relative opacity-0 animate-fade-in flex justify-center lg:justify-end" style={{ animationDelay: '1.2s' }}>
            <div className="relative rounded-xl overflow-hidden shadow-2xl bg-white/5 p-1 backdrop-blur-sm border border-white/10">
              <div className="rounded-lg overflow-hidden bg-black">
                <video
                  className="w-full h-auto max-w-md lg:max-w-lg"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls={false}
                >
                  <source src="/videos/invoice_Landing_video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .blur-text-word {
          filter: blur(8px);
          animation: blur-in 0.8s ease-out forwards;
        }
        
        @keyframes blur-in {
          0% {
            filter: blur(8px);
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            filter: blur(0px);
            opacity: 1;
            transform: translateY(0px);
          }
        }
        
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0px);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
