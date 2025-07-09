import React, { useEffect } from 'react';
import anime from 'animejs';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiStar } from 'react-icons/fi';
import { IoRocketOutline, IoPeopleOutline, IoStatsChartOutline } from 'react-icons/io5';
import { RiSparklingLine } from 'react-icons/ri';

const Home = () => {
  useEffect(() => {
    const container = document.querySelector('.relative');
    const blockCount = 20; // Reduced number of blocks
    
    const existingBlocks = container.querySelectorAll('.geometric-block');
    existingBlocks.forEach(block => block.remove());
    
    for (let i = 0; i < blockCount; i++) {
      const block = document.createElement('div');
      block.className = 'geometric-block';
      
      const sizes = ['small', 'medium', 'large'];
      const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
      block.classList.add(randomSize);
      
      block.style.left = `${Math.random() * 100}%`;
      block.style.top = `${Math.random() * 100}%`;
      
      container.appendChild(block);
    }

    const blocks = document.querySelectorAll('.geometric-block');
    blocks.forEach((block, index) => {
      anime({
        targets: block,
        translateX: () => anime.random(-120, 120),
        translateY: () => anime.random(-120, 120),
        scale: [
          {value: 1.2, duration: 3000, easing: 'easeInOutQuad'},
          {value: 0.9, duration: 3000, easing: 'easeInOutQuad'}
        ],
        rotate: () => anime.random(-25, 25),
        opacity: [
          {value: 0.7, duration: 2000, easing: 'easeInOutQuad'},
          {value: 0.3, duration: 2000, easing: 'easeInOutQuad'}
        ],
        delay: index * 100,
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutSine'
      });
    });
  }, []);

  const stats = [
    { name: 'Total Tasks', value: '2,500+', icon: IoStatsChartOutline, color: 'bg-purple-500' },
    { name: 'Active Users', value: '150+', icon: IoPeopleOutline, color: 'bg-blue-500' },
    { name: 'Hours Saved', value: '1,000+', icon: IoRocketOutline, color: 'bg-green-500' },
    { name: 'Projects', value: '200+', icon: RiSparklingLine, color: 'bg-pink-500' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    }
  };

  return (
    <>
    <div className="min-h-screen bg-[#F8F9FF] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/5 to-[#3B82F6]/5"></div>
        {/* Decorative blurred circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center justify-center min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.6, -0.05, 0.01, 0.99] }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-block px-4 py-2 bg-gradient-to-r from-[#8B5CF6]/10 to-[#3B82F6]/10 rounded-lg mb-6"
          >
            <span className="text-sm font-medium text-[#8B5CF6]">#1 Veb Agentlik O'zbekistanda</span>
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] leading-tight">
            Transform your<br />WorkFlow<br />
            <span className="text-[#3B82F6]">From</span> papers to magic
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            Har kuni yuzlab potensial mijozlar Google'dan siz kabi biznesi qidirashadi. Bizning yechimimiz orqali ular aynan sizni topishadi.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              Bepul konsultatsiya olish
              <FiArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-[#8B5CF6]/20 text-gray-800 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Loyiha narxini bilish
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Section */}
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1A1A2E] backdrop-blur-sm rounded-2xl p-8 border border-[#8B5CF6]/10 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#8B5CF6]/10 p-3 rounded-xl">
                <IoStatsChartOutline className="w-8 h-8 text-[#8B5CF6]" />
              </div>
              <div className="text-white">
                <h3 className="text-4xl font-bold mb-1">100+</h3>
                <p className="text-gray-400">Loyihalar</p>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#1A1A2E] backdrop-blur-sm rounded-2xl p-8 border border-[#8B5CF6]/10 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#3B82F6]/10 p-3 rounded-xl">
                <IoPeopleOutline className="w-8 h-8 text-[#3B82F6]" />
              </div>
              <div className="text-white">
                <h3 className="text-4xl font-bold mb-1">50+</h3>
                <p className="text-gray-400">Mijozlar</p>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-[#1A1A2E] backdrop-blur-sm rounded-2xl p-8 border border-[#8B5CF6]/10 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#8B5CF6]/10 p-3 rounded-xl">
                <IoRocketOutline className="w-8 h-8 text-[#8B5CF6]" />
              </div>
              <div className="text-white">
                <h3 className="text-4xl font-bold mb-1">5+</h3>
                <p className="text-gray-400">Yillik Tajriba</p>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </motion.div>
        </div>
      </div>
    </div>

    {/* Information Section */}
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="py-20 bg-[#F8F9FF]"
    >
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]">
          Why Choose InToday?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              title: "Smart Organization",
              description: "Leverage AI-powered insights to optimize your workflow and boost productivity.",
              icon: IoRocketOutline,
              gradient: "from-[#8B5CF6] to-[#3B82F6]"
            },
            {
              title: "Real-time Collaboration",
              description: "Work seamlessly with your team in real-time with instant updates and notifications.",
              icon: IoPeopleOutline,
              gradient: "from-[#3B82F6] to-[#60A5FA]"
            },
            {
              title: "Advanced Analytics",
              description: "Make data-driven decisions with comprehensive analytics and reporting tools.",
              icon: IoStatsChartOutline,
              gradient: "from-[#60A5FA] to-[#8B5CF6]"
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -10 }}
              className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-[#8B5CF6]/10"
            >
              <div className={`mb-6 bg-gradient-to-r ${item.gradient} w-16 h-16 rounded-2xl flex items-center justify-center bg-opacity-10`}>
                <item.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>

    {/* Pricing Section */}
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="py-20 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Choose the perfect plan for your team's needs
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {[
            {
              name: "Starter",
              price: "Free",
              period: "forever",
              features: ["Up to 5 projects", "Basic analytics", "2 team members", "1GB storage"],
              buttonText: "Get Started",
              description: "Perfect for individuals and small projects"
            },
            {
              name: "Pro",
              price: "$12",
              period: "per month",
              features: ["Unlimited projects", "Advanced analytics", "Unlimited team members", "10GB storage", "Priority support", "Custom integrations"],
              popular: true,
              buttonText: "Start Free Trial",
              description: "Best for growing teams and businesses"
            },
            {
              name: "Enterprise",
              price: "Custom",
              period: "contact us",
              features: ["Custom solutions", "Dedicated support", "SLA guarantee", "Unlimited storage", "Advanced security", "Custom branding"],
              buttonText: "Contact Sales",
              description: "For large organizations with specific needs"
            }
          ].map((plan, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -10 }}
              className={`bg-white p-8 rounded-2xl shadow-xl relative ${
                plan.popular ? 'border-2 border-purple-500 shadow-purple-100' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <FiStar className="w-4 h-4" />
                  Most Popular
                </div>
              )}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2 text-gray-800">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-800">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-500 ml-2">/{plan.period}</span>
                  )}
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                plan.popular
                  ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:shadow-lg hover:scale-105'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}>
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>

    {/* Footer */}
    <footer className="bg-[#1A1A2E] text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <RiSparklingLine className="w-8 h-8 text-[#8B5CF6]" />
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]">
                InToday
              </h3>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Making task management simple and efficient for teams worldwide. Join thousands of teams already using our platform.
            </p>
            <div className="flex gap-4">
              {[
                { icon: "ri-twitter-fill", href: "#" },
                { icon: "ri-linkedin-fill", href: "#" },
                { icon: "ri-github-fill", href: "#" }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-[#2A2A3E] flex items-center justify-center text-gray-400 hover:bg-[#8B5CF6] hover:text-white transition-all duration-300"
                >
                  <i className={social.icon}></i>
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/features" className="text-gray-400 hover:text-[#8B5CF6] transition-colors duration-300">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-gray-400 hover:text-[#8B5CF6] transition-colors duration-300">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/integrations" className="text-gray-400 hover:text-[#8B5CF6] transition-colors duration-300">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-[#8B5CF6] transition-colors duration-300">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-gray-400 hover:text-[#8B5CF6] transition-colors duration-300">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-400 hover:text-[#8B5CF6] transition-colors duration-300">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-[#2A2A3E] mt-12 pt-8 text-center">
          <p className="text-gray-500">
            &copy; {new Date().getFullYear()} InToday. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Home;