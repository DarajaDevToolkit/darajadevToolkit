"use client";

import React, { useState } from "react";
import { Mail, CheckCircle, AlertCircle, ArrowRight, Code, Zap, Shield, Clock, Users, TrendingUp } from 'lucide-react';
import { errorToast, successToast } from "@/utils/helpers";

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('loading');

    //TODO: Simulate API call - replace with actual implementation
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus('success');
      setMessage('Welcome to the waitlist! We\'ll notify you when we launch.');
      setEmail('');
      successToast("Successfully subscribed");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
      errorToast(errorMessage);
    }
  };

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Never Lose Webhooks",
      description: "Bulletproof proxy ensures M-Pesa callbacks always reach your app"
    },
    {
      icon: <ArrowRight className="w-6 h-6" />,
      title: "Environment Routing",
      description: "Switch between dev, staging, and production with one click"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Intelligent Retries",
      description: "Automatic retry logic with exponential backoff for failed deliveries"
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Developer-Friendly",
      description: "Simple SDK integration and CLI tools built for Kenyan developers"
    }
  ];

  const stats = [
    { label: "Developers Waiting", value: "1,200+", icon: <Users className="w-5 h-5" /> },
    { label: "Webhook Reliability", value: "99.9%", icon: <TrendingUp className="w-5 h-5" /> },
    { label: "Response Time", value: "<30s", icon: <Zap className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="relative container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">D</span>
            </div>
            <span className="text-2xl font-bold text-white">Daraja Toolkit</span>
          </div>
          <div className="text-sm text-gray-300">
            Made with ❤️ in Kenya 🇰🇪
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-500/30 text-purple-200 rounded-full text-sm font-medium animate-bounce">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-ping"></div>
              Currently in Development
            </div>
          </div>

          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Never Lose
              </span>
              <br />
              <span className="text-white">Another M-Pesa Webhook</span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
              A reliable webhook proxy service that sits between M-Pesa and your application,
              solving the most common pain points in Kenyan fintech development.
            </p>

            <div className="max-w-md mx-auto mb-12">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email for early access"
                    className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    disabled={status === 'loading' || status === 'success'}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={status === 'loading' || status === 'success'}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {status === 'loading' ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Joining...
                    </div>
                  ) : status === 'success' ? (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      You're In!
                    </div>
                  ) : (
                    'Join the Waitlist'
                  )}
                </button>
              </div>

              {/* Status Message */}
              {message && (
                <div className={`mt-4 p-4 rounded-lg flex items-center ${status === 'success'
                    ? 'bg-green-500/20 border border-green-500/30 text-green-200'
                    : 'bg-red-500/20 border border-red-500/30 text-red-200'
                  }`}>
                  {status === 'success' ? (
                    <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  )}
                  {message}
                </div>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-center mb-3 text-purple-400">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 h-full transform group-hover:scale-105 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Architecture Preview */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-6">How It Works</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <div className="font-mono text-sm text-gray-300 mb-4">
                <div className="text-green-400">// The Magic Flow</div>
              </div>
              <div className="flex items-center justify-center space-x-4 text-white font-medium">
                <span className="bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-500/30">M-Pesa</span>
                <ArrowRight className="w-5 h-5 text-gray-400" />
                <span className="bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/30">Daraja Proxy</span>
                <ArrowRight className="w-5 h-5 text-gray-400" />
                <span className="bg-green-500/20 px-4 py-2 rounded-lg border border-green-500/30">Your App</span>
              </div>
              <div className="text-gray-400 text-sm mt-4">
                One permanent URL • Smart routing • Never lose webhooks
              </div>
            </div>
          </div>
        </div>

        {/* Floating Code Snippets */}
        <div className="absolute top-20 right-10 hidden lg:block">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 font-mono text-xs text-gray-300 animate-float">
            <div className="text-green-400">// webhook-proxy.js</div>
            <div>const proxy = new WebhookProxy()</div>
            <div className="text-blue-400">proxy.route('dev', endpoint)</div>
          </div>
        </div>

        <div className="absolute bottom-20 left-10 hidden lg:block">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 font-mono text-xs text-gray-300 animate-float" style={{ animationDelay: '3s' }}>
            <div className="text-purple-400">// daraja-cli</div>
            <div>$ daraja logs --tail</div>
            <div className="text-green-400">✓ webhook delivered</div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
