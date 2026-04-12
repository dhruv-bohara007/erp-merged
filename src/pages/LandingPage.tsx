import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GooeyNav from './GooeyNav';
import './GooeyNav.css';
import BlurText from './BlurText';
import TiltedCard from './TiltedCard';
import { 
  FileText, 
  Users, 
  CreditCard, 
  BarChart3, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  PenLine,
  Send,
  Wallet,
  Globe,
  Receipt,
  Package,
  TrendingUp,
  Lock,
  UserCog,
  AlertTriangle,
  ClipboardCheck,
  HeartHandshake,
  type LucideIcon
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  const navItems = [
    { label: "Home", href: "#home" },
    { label: "Features", href: "#features" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
    { label: "Login", href: "#login" },
    { label: "Get Started", href: "#get-started" },
  ];

  const navbarHeight = '4em';

  const featureCategories: { 
    title: string; 
    icon: LucideIcon; 
    features: string[] 
  }[] = [
    {
      title: "Invoicing & Payments",
      icon: CreditCard,
      features: [
        "Multi-currency support with real-time exchange rates",
        "International tax handling (GST, VAT, IGST)",
        "PDF invoice & purchase order generation with company branding",
        "Partial and full payment tracking"
      ]
    },
    {
      title: "Client & Supplier Management",
      icon: Users,
      features: [
        "CRUD operations with validations",
        "Contact details, tax info, and status tracking",
        "Real-time metrics on revenue, outstanding amounts, and purchases"
      ]
    },
    {
      title: "Purchases & Inventory",
      icon: Package,
      features: [
        "End-to-end purchase workflow (request → approval → PO → stock update)",
        "Real-time stock tracking with low-stock alerts",
        "Priority-based purchase requests with admin approvals"
      ]
    },
    {
      title: "Analytics & Reporting",
      icon: BarChart3,
      features: [
        "Revenue trends, overdue invoices, client performance",
        "Aging reports with collection risk monitoring",
        "Interactive charts for financial insights"
      ]
    },
    {
      title: "Security & Access",
      icon: Shield,
      features: [
        "Role-based access control (Admin, Employee)",
        "Firebase authentication with secure CRUD operations",
        "Enterprise-grade data protection"
      ]
    },
    {
      title: "Customer Trust & Support",
      icon: HeartHandshake,
      features: [
        "24/7 dedicated customer support team",
        "99.9% uptime guarantee with data backups",
        "GDPR & SOC 2 compliance for data privacy",
        "Transparent pricing with no hidden fees"
      ]
    }
  ];

  const benefits = [
    "Save hours on manual invoicing",
    "Get paid faster with payment reminders",
    "Professional templates for every industry",
    "Multi-currency support for global business",
    "Real-time payment notifications",
    "Cloud-based access from anywhere"
  ];

  const workflowSections = [
    {
      title: "Financial Flow",
      icon: CreditCard,
      color: "#4facfe",
      steps: ["Clients", "Invoices", "Payments", "Financial Reporting"],
      secondarySteps: ["Suppliers", "Purchase Orders", "Purchase Records"]
    },
    {
      title: "Purchase Flow", 
      icon: Package,
      color: "#00f2fe",
      steps: ["Employees", "Purchase Requests", "Stock Details (updates)", "Purchase Orders", "Purchase Records", "Stock Details (final)"]
    },
    {
      title: "Inventory Flow",
      icon: ClipboardCheck,
      color: "#4facfe",
      steps: ["Inventory (definitions)", "Stock Details (live)", "Employee Visibility", "Purchase Requests"]
    }
  ];

  return (
    <div style={{ background: 'black', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
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
          {/* Hero Section */}
          <section
            id="home"
            className="min-h-screen flex items-center justify-center text-white px-4 sm:px-6 lg:px-8 box-border"
            style={{
              minHeight: `calc(100vh - ${navbarHeight})`,
            }}
          >
            <div className="flex flex-col lg:flex-row items-center justify-between max-w-7xl w-full gap-8 lg:gap-16">
              <div className="flex-1 text-center lg:text-left max-w-2xl lg:max-w-none">
                <BlurText
                  text="Simplify Your Invoicing & Payment Tracking with Ease"
                  delay={50}
                  animateBy="words"
                  direction="top"
                  className="text-gradient text-3xl sm:text-4xl lg:text-5xl xl:text-6xl mb-4 lg:mb-6 leading-tight font-bold text-white cursor-pointer"
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
                  className="subtitle-text text-base sm:text-lg lg:text-xl font-light leading-relaxed mb-8 lg:mb-12 text-gray-300 cursor-pointer"
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
                  onClick={() => navigate('/register')}
                  className="px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold border-none rounded-full text-white cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
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

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="flex-1 flex justify-center items-center w-full max-w-2xl lg:max-w-none"
                style={{
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

          {/* Features Section */}
          <section 
            id="features" 
            className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8"
            style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)' }}
          >
            <div className="max-w-7xl mx-auto">
              <motion.div 
                className="text-center mb-16"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                  Powerful Features for Your Business
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Everything you need to streamline your invoicing workflow and grow your business.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {featureCategories.map((category, index) => (
                  <motion.div
                    key={category.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="group p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-cyan-500/50 transition-all duration-300"
                    style={{
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                        style={{
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)',
                        }}
                      >
                        <category.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">{category.title}</h3>
                    </div>
                    <ul className="space-y-3">
                      {category.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* About Section */}
          <section 
            id="about" 
            className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8"
            style={{ background: '#000000' }}
          >
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                    Why Choose InvoiceApp?
                  </h2>
                  <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                    We built InvoiceApp to help businesses of all sizes manage their finances with ease. 
                    Our platform combines powerful features with an intuitive interface, so you can focus 
                    on what matters most—growing your business.
                  </p>
                  <div className="space-y-4">
                    {benefits.map((benefit, index) => (
                      <motion.div
                        key={benefit}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                        <span className="text-gray-300">{benefit}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* How It Works Section - Workflow Diagrams */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div 
                    className="rounded-2xl p-6 lg:p-8 border border-white/10"
                    style={{
                      background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.05) 100%)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <h3 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h3>
                    <div className="space-y-6">
                      {workflowSections.map((workflow, index) => (
                        <motion.div
                          key={workflow.title}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.15 }}
                          viewport={{ once: true }}
                          className="p-4 rounded-xl bg-black/30 border border-white/5"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{
                                background: `linear-gradient(135deg, ${workflow.color} 0%, #00f2fe 100%)`,
                              }}
                            >
                              <workflow.icon className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="text-base font-semibold text-white">{workflow.title}</h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {workflow.steps.map((step, stepIndex) => (
                              <React.Fragment key={step}>
                                <span className="px-3 py-1.5 rounded-lg bg-white/10 text-cyan-300 text-xs font-medium">
                                  {step}
                                </span>
                                {stepIndex < workflow.steps.length - 1 && (
                                  <ArrowRight className="w-4 h-4 text-cyan-500/60" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                          {workflow.secondarySteps && (
                            <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-white/10">
                              {workflow.secondarySteps.map((step, stepIndex) => (
                                <React.Fragment key={step}>
                                  <span className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs font-medium">
                                    {step}
                                  </span>
                                  {stepIndex < workflow.secondarySteps.length - 1 && (
                                    <ArrowRight className="w-4 h-4 text-gray-600" />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section 
            id="contact" 
            className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8"
            style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)' }}
          >
            <div className="max-w-7xl mx-auto">
              <motion.div 
                className="text-center mb-16"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                  Get In Touch
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {[
                  { icon: Mail, title: "Email Us", info: "support@invoiceapp.com", subtext: "We reply within 24 hours" },
                  { icon: Phone, title: "Call Us", info: "+1 (555) 123-4567", subtext: "Mon-Fri 9am-6pm EST" },
                  { icon: MapPin, title: "Visit Us", info: "123 Business Ave", subtext: "New York, NY 10001" }
                ].map((contact, index) => (
                  <motion.div
                    key={contact.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                  >
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6"
                      style={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)',
                      }}
                    >
                      <contact.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{contact.title}</h3>
                    <p className="text-cyan-400 mb-1">{contact.info}</p>
                    <p className="text-gray-500 text-sm">{contact.subtext}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Login Section */}
          <section 
            id="login" 
            className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8"
            style={{ background: '#000000' }}
          >
            <div className="max-w-md mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-10"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Welcome Back
                </h2>
                <p className="text-gray-400">
                  Sign in to access your dashboard and manage your invoices.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl border border-white/10"
                style={{
                  background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.02) 100%)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div className="space-y-6">
                  <motion.button
                    onClick={() => navigate('/login')}
                    className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                      boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)',
                    }}
                    whileHover={{
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0, 242, 254, 0.4)',
                    }}
                  >
                    Sign In to Your Account
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>

                  <div className="text-center text-gray-500">
                    Don't have an account?{' '}
                    <button 
                      onClick={() => navigate('/register')}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Sign up free
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Get Started Section */}
          <section 
            id="get-started" 
            className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8"
            style={{ 
              background: 'linear-gradient(180deg, #0a0a0a 0%, #000000 100%)',
            }}
          >
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                  Ready to Transform Your Invoicing?
                </h2>
                <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
                  Join thousands of businesses who have streamlined their invoicing workflow. 
                  Start your free trial today—no credit card required.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    onClick={() => navigate('/register')}
                    className="px-8 py-4 rounded-full font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                      boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)',
                    }}
                    whileHover={{
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0, 242, 254, 0.4)',
                    }}
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    onClick={() => {
                      const featuresSection = document.getElementById('features');
                      featuresSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-8 py-4 rounded-full font-semibold text-white border border-white/20 hover:bg-white/10 transition-all duration-300"
                    whileHover={{
                      transform: 'translateY(-2px)',
                    }}
                  >
                    Learn More
                  </motion.button>
                </div>
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="mt-20 pt-10 border-t border-white/10"
              >
                <p className="text-gray-500 text-sm">
                  © 2024 InvoiceApp. All rights reserved. Built with ❤️ for businesses worldwide.
                </p>
              </motion.div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;