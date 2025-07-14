
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

const LandingPage = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Aurora Background */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        <div className="aurora-animation absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20"></div>
      </div>

      {/* Gooey Navigation */}
      <nav className="relative z-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="gooey-nav bg-white/10 backdrop-blur-md rounded-full px-8 py-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full"></div>
                <span className="text-white font-bold text-xl">InvoiceApp</span>
              </div>
              
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="text-white/80 hover:text-white transition-colors">Pricing</a>
                <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
                <Link to="/login">
                  <Button variant="ghost" className="text-white border-white/20 hover:bg-white/10">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text Content */}
          <div className="space-y-8">
            {/* Blur Text Headline */}
            <div className="blur-text-container">
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                <span className="blur-text-word inline-block opacity-0 animate-fade-in" style={{ animationDelay: '0.1s' }}>Simplify</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>Your</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in" style={{ animationDelay: '0.3s' }}>Invoicing</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in" style={{ animationDelay: '0.4s' }}>&</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent" style={{ animationDelay: '0.5s' }}>Payment</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" style={{ animationDelay: '0.6s' }}>Tracking</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in" style={{ animationDelay: '0.7s' }}>with</span>{' '}
                <span className="blur-text-word inline-block opacity-0 animate-fade-in" style={{ animationDelay: '0.8s' }}>Ease</span>
              </h1>
            </div>

            {/* Blur Text Subheadline */}
            <div className="blur-text-container">
              <h2 className="text-xl lg:text-2xl text-white/80 leading-relaxed">
                <span className="blur-text-word inline opacity-0 animate-fade-in" style={{ animationDelay: '1s' }}>A complete Invoice Management System to effortlessly generate invoices, monitor payments, manage clients, and maintain control of your business finances—anytime, anywhere.</span>
              </h2>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 opacity-0 animate-fade-in" style={{ animationDelay: '1.5s' }}>
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg group">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg"
                onClick={() => setIsVideoPlaying(!isVideoPlaying)}
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Right Side - Video */}
          <div className="relative opacity-0 animate-fade-in" style={{ animationDelay: '1.2s' }}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-1">
              <div className="rounded-xl overflow-hidden bg-black">
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
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 animate-pulse animation-delay-2000"></div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .gooey-nav {
          filter: url('#gooey');
        }
        
        .aurora-animation {
          animation: aurora 20s ease-in-out infinite;
        }
        
        @keyframes aurora {
          0%, 100% { transform: rotate(0deg) scale(1); }
          33% { transform: rotate(120deg) scale(1.1); }
          66% { transform: rotate(240deg) scale(0.9); }
        }
        
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
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* SVG Filter for Gooey Effect */}
      <svg className="absolute" width="0" height="0">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop"/>
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default LandingPage;
