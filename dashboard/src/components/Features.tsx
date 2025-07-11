import React from 'react';
import Image from 'next/image';
import {
  Terminal,
  Webhook,
  Eye,
  Shield,
  Activity,
  Code,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: <Terminal className="w-8 h-8" />,
    title: 'CLI Developer Tools',
    description: 'Powerful CLI for instant setup, testing, and automation.',
  },
  {
    icon: <Webhook className="w-8 h-8" />,
    title: 'Smart Webhook Proxy',
    description:
      'Intelligent routing to never lose a webhook in your workflow.',
  },
  {
    icon: <Eye className="w-8 h-8" />,
    title: 'Real-time Monitoring',
    description: 'Live dashboard with transaction monitoring and analytics.',
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'Enterprise Security',
    description:
      'Bank-grade security with end-to-end encryption and compliance.',
  },
  {
    icon: <Activity className="w-8 h-8" />,
    title: '99.9% Uptime SLA',
    description: 'Mission-critical reliability with redundant infrastructure.',
  },
  {
    icon: <Code className="w-8 h-8" />,
    title: 'Developer Experience',
    description: 'Intuitive APIs, comprehensive docs, and multi-language SDKs.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 relative ">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Everything you need{' '}
            <span className="bg-gradient-to-r from-red-400 to-green-400 bg-clip-text text-transparent">
              kujenga na M-Pesa
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From <span className="font-semibold">development</span> to{' '}
            <span className="font-semibold">production</span>, we&#39;ve got you
            covered with enterprise-grade tools and infrastructure.
          </p>
        </div>
        {/* Orbital Design Container - Desktop Only */}
        <div
          className="hidden lg:block relative w-full max-w-5xl mx-auto"
          style={{ height: '600px' }}
        >
          {/* Orbital Rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[600px] h-[600px] border border-white/10 rounded-full animate-[spin_45s_linear_infinite]"></div>
            <div className="absolute w-[450px] h-[450px] border border-white/10 rounded-full animate-[spin_35s_linear_infinite_reverse]"></div>
          </div>
          {/* Central Hub */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-red-500/20 to-green-500/20 rounded-full border-2 border-red-500/30 flex items-center justify-center backdrop-blur-sm animate-[pulse_3s_ease-in-out_infinite]">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-green-500 rounded-full flex items-center justify-center animate-[spin_20s_linear_infinite]">
                {/* <Smartphone className="w-10 h-10 text-white" /> */}
                <Image
                  src="/ddtklogo.png"
                  alt="Daraja Toolkit"
                  width={64}
                  height={64}
                  className="w-16 h-16"
                />
              </div>
            </div>
          </div>
          {/* Feature Nodes */}
          {features.map((feature, index) => {
            // const angle = (index / features.length) * 360;
            const radius = 275; // Orbit radius in pixels
            const rawAngle = (index / features.length) * 360;
            const rawX = Math.cos((rawAngle * Math.PI) / 180) * radius;
            const rawY = Math.sin((rawAngle * Math.PI) / 180) * radius;

            // then stabilize them
            const x = Math.round(rawX); // nearest pixel
            const y = Math.round(rawY);

            return (
              <div
                key={index}
                className="group absolute top-1/2 left-1/2"
                style={{
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                }}
              >
                <div className="relative flex flex-col items-center">
                  {/* Node Core */}
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-white/20 rounded-full flex items-center justify-center text-white cursor-pointer transition-all duration-300 group-hover:scale-110 group-hover:border-red-500/50">
                    {feature.icon}
                  </div>
                  {/* Feature Info Panel on Hover */}
                  <div className="absolute bottom-full mb-4 w-52 bg-slate-900/95 backdrop-blur-lg border border-red-500/30 rounded-lg p-4 text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:-translate-y-2">
                    <h3 className="text-md font-bold text-red-400 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Feature Grid for Mobile and Tablet */}
        <div className="block lg:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg mb-6">
                  {React.cloneElement(feature.icon, {
                    className: 'w-8 h-8',
                  })}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
        {/* Bottom CTA */}
        <div className="mt-20 text-center relative z-10">
          <div className="inline-flex items-center bg-gradient-to-r from-red-500/10 to-green-500/10 backdrop-blur-sm border border-red-500/20 rounded-full px-6 py-3 text-sm text-gray-300">
            <Zap className="w-4 h-4 mr-2 text-yellow-400" />
            <span>All features included in every plan</span>
          </div>
        </div>
      </div>
    </section>
  );
}
