"use client";
import { ArrowRight, Code, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl  animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl  animate-pulse animation-delay-4000"></div>
      </div>

      <header className="relative container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold text-white">
              Daraja Toolkit
            </span>
          </div>
        </nav>
      </header>

      <main className="relative container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-500/30 text-purple-200 rounded-full text-sm font-medium mb-8 animate-bounce">
            <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-ping"></div>
            Currently in Development
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
              Building
            </span>
            <br />
            <span className="text-white">Daraja Dev Toolkit</span>
          </h1>

          <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-2xl mx-auto">
            Never lose another M-Pesa webhook again
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Code className="w-8 h-8 text-white" />
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-3/4 animate-pulse"></div>
              </div>
            </div>

            <div className="group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-lg animation-delay-1000">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full w-1/2 animate-pulse animation-delay-1000"></div>
              </div>
            </div>

            <div className="group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300 shadow-lg animation-delay-2000">
                <ArrowRight className="w-8 h-8 text-white" />
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full w-5/6 animate-pulse animation-delay-2000"></div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg font-semibold text-lg">
              Get Notified When Ready
            </button>

            <p className="text-gray-400 text-sm">
              Join our waitlist for early access
            </p>
          </div>
        </div>

        <div className="absolute top-20 right-10 ">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 font-mono text-xs text-gray-300 animate-float">
            <div className="text-green-400">// webhook-proxy.js</div>
            <div>const proxy = new WebhookProxy()</div>
          </div>
        </div>

        <div className="absolute bottom-20 left-10">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 font-mono text-xs text-gray-300 animate-float animation-delay-3000">
            <div className="text-blue-400">// m-pesa-integration</div>
            <div>await mpesa.validateWebhook()</div>
          </div>
        </div>
      </main>

      <footer className="relative container mx-auto px-4 py-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">D</span>
          </div>
          <span className="text-gray-300 font-semibold">
            Daraja Developer Toolkit
          </span>
        </div>
        <p className="text-gray-500 text-sm">Made with ❤️ in Kenya 🇰🇪</p>
      </footer>

      <style jsx>{`
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
