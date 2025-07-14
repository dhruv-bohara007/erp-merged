
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
    { label: "Login", href: "/login" },
    { label: "Get Started", href: "/register" },
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
      <nav className="relative z-50 pt-4 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full"></div>
              <span className="text-white font-semibold text-lg">InvoiceApp</span>
            </div>
            
            {/* Gooey Navigation */}
            <div className="flex-1 flex justify-center">
              <div style={{ height: '40px', position: 'relative' }}>
                <GooeyNav
                  items={navItems}
                  particleCount={12}
                  particleDistances={[60, 8]}
                  particleR={80}
                  initialActiveIndex={0}
                  animationTime={500}
                  timeVariance={200}
                  colors={[1, 2, 3, 1, 2]}
                />
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 border-none">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-white text-black hover:bg-white/90 font-medium">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-200px)]">
          {/* Left Side - Text Content */}
          <div className="flex flex-col justify-center space-y-8">
            {/* Blur Text Headline */}
            <div className="blur-text-container">
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                <span className="blur-text-word inline-block opacity-0 animate-fade-in" style={{ animationDelay: '0.1s' }}>Simplify</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>Your</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in" style={{ animationDelay: '0.3s' }}>Invoicing</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in" style={{ animationDelay: '0.4s' }}>&</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent" style={{ animationDelay: '0.5s' }}>Payment</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" style={{ animationDelay: '0.6s' }}>Tracking</span>
              </h1>
            </div>

            {/* Blur Text Subheadline */}
            <div className="blur-text-container">
              <p className="text-lg lg:text-xl text-white/70 leading-relaxed max-w-lg">
                <span className="blur-text-word inline opacity-0 animate-fade-in" style={{ animationDelay: '0.8s' }}>
                  A complete Invoice Management System to effortlessly generate invoices, monitor payments, and maintain control of your business finances.
                </span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 opacity-0 animate-fade-in" style={{ animationDelay: '1.2s' }}>
              <Link to="/register">
                <Button size="lg" className="bg-white text-black hover:bg-white/90 px-8 py-3 text-base font-medium group">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 px-8 py-3 text-base font-medium"
                onClick={() => setIsVideoPlaying(!isVideoPlaying)}
              >
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Right Side - Video */}
          <div className="flex justify-center lg:justify-end opacity-0 animate-fade-in" style={{ animationDelay: '1s' }}>
            <div className="relative max-w-lg w-full">
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-1">
                <div className="rounded-lg overflow-hidden bg-black/50 backdrop-blur-sm">
                  <video
                    className="w-full h-auto"
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
              
              {/* Floating accent elements */}
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-full blur-sm"></div>
              <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-gradient-to-r from-purple-400/20 to-pink-600/20 rounded-full blur-sm"></div>
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
