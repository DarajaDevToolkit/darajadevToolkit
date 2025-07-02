'use client';
import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Users,
  TrendingUp,
  Zap,
  CheckCircle,
  BarChart3,
  Play,
  ChevronRight,
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import Link from 'next/link';
import FeaturesSection from '@/components/Features';
import Image from 'next/image';

export default function HomePage() {
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[id]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const stats = [
    {
      label: 'Active Developers',
      value: '2,500+',
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: 'Webhook Reliability',
      value: '99.9%',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      label: 'Avg Response Time',
      value: '<50ms',
      icon: <Zap className="w-5 h-5" />,
    },
    {
      label: 'Transactions Processed',
      value: '10k+',
      icon: <BarChart3 className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent"></div>

      {/* Animated grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

      {/* Navigation */}
      <NavBar />

      {/* Hero Section */}
      <section id="hero" className="relative pt-20 pb-32">
        {/* Floating Code Snippets */}
        <div className="absolute top-24 left-10 hidden lg:block animate-float">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 font-mono text-xs text-gray-300 shadow-lg">
            <div className="text-green-400">// daraja-kit --init</div>
            <div>$ npm install -g daraja-kit</div>
            <div className="text-blue-400">$ daraja-kit init my-app</div>
            <div className="text-green-400">✓ Project ready!</div>
          </div>
        </div>

        <div
          className="absolute bottom-24 right-10 hidden lg:block animate-float"
          style={{ animationDelay: '2s' }}
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 font-mono text-xs text-gray-300 shadow-lg">
            <div className="text-purple-400">// Smart Webhook Proxy</div>
            <div>proxy.routeTo('dev')</div>
            <div className="text-gray-500">{`// Forwards to http://localhost:3000`}</div>
            <div>proxy.routeTo('prod')</div>
            <div className="text-gray-500">{`// Forwards to https://api.myapp.com`}</div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Announcement Banner */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center bg-gradient-to-r from-red-500/10 to-green-500/10 backdrop-blur-sm border border-red-500/20 rounded-full px-4 py-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
              <span className="text-gray-300">
                Say goodbye to exposing your localhost to the world!
              </span>
              <ChevronRight className="w-4 h-4 ml-2 text-gray-400" />
            </div>
          </div>

          {/* Main Hero Content */}
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-red-400 via-red-500 to-green-400 bg-clip-text text-transparent">
                M-Pesa Integration
              </span>
              <br />
              <span className="text-white">Made Simple</span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              The complete developer toolkit for M-Pesa integration. Build,
              test, and deploy fintech applications with confidence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/login">
                <button className="group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 flex items-center">
                  Anza Kujenga
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/watch-demo">
                <button className="group border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center">
                  <Play className="w-5 h-5 mr-2" />
                  Cheki Demo
                </button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-6 text-gray-400 text-sm">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                <span>5-minute setup</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                <span>Enterprise ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 border-y border-white/10 bg-black/20 backdrop-blur-sm mx-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-3 text-red-400">
                  {stat.icon}
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FeaturesSection />

      {/* Footer */}
      <footer className="relative border-t border-white/10 bg-black/50 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-green-500 rounded-xl flex items-center justify-center">
                  {/* <Smartphone className="w-6 h-6 text-white" /> */}
                  <Image
                    src="/ddtklogo.png"
                    alt="DarajaKit Logo"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                </div>
                <span className="text-xl font-bold text-white">DarajaKit</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Usiachwe nyuma! Build better fintech applications, faster.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API Reference
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 DarajaDevToolKit. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
