import { ArrowRight, Shield, Zap, BarChart3, Globe } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Daraja Toolkit
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-indigo-600">
              Features
            </a>
            <a
              href="#architecture"
              className="text-gray-600 hover:text-indigo-600"
            >
              Architecture
            </a>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Get Early Access
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Never lose another M-Pesa webhook again
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            The reliable webhook proxy service that sits between M-Pesa and your
            application. One permanent URL, multiple environments, zero lost
            payments.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center">
              Join the Beta <ArrowRight className="ml-2 w-4 h-4" />
            </button>
            <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-center">
              View on GitHub
            </button>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            🚧 Currently in Development - Beta launching Week 8
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Built for Kenyan Developers
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We understand the M-Pesa integration pain. Here's how we solve it.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Permanent URLs</h3>
            <p className="text-gray-600">
              Set your webhook URL once with M-Pesa. Never change it again, even
              when switching environments.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Environment Routing</h3>
            <p className="text-gray-600">
              Route webhooks to dev, staging, or production with a simple
              dashboard toggle.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Reliable Delivery</h3>
            <p className="text-gray-600">
              Automatic retries, circuit breakers, and dead letter queues ensure
              no webhook is lost.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Full Observability</h3>
            <p className="text-gray-600">
              Real-time dashboard with success rates, response times, and
              detailed error logs.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture Preview */}
      <section id="architecture" className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600">
              Simple architecture, powerful results
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 font-mono text-sm">
            <div className="text-center text-gray-600">
              M-Pesa → [Permanent URL] → [Validation] → [Queue] → [Environment
              Router] → [Your App]
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                1
              </div>
              <h4 className="font-semibold">Receive & Validate</h4>
              <p className="text-sm text-gray-600">
                M-Pesa sends to your permanent URL, we validate it's real
              </p>
            </div>
            <div>
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                2
              </div>
              <h4 className="font-semibold">Queue & Route</h4>
              <p className="text-sm text-gray-600">
                Safely queue and route to your chosen environment
              </p>
            </div>
            <div>
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                3
              </div>
              <h4 className="font-semibold">Deliver & Monitor</h4>
              <p className="text-sm text-gray-600">
                Reliable delivery with full observability
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-indigo-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Built by Kenyan Developers, for Kenyan Developers
          </h2>
          <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
            We're a small team of ~10 committed developers who have felt the
            M-Pesa integration pain. We're building the solution we wish
            existed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50">
              Join Our Team
            </button>
            <button className="border border-indigo-400 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
              Follow Progress
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">D</span>
          </div>
          <span className="font-semibold">Daraja Developer Toolkit</span>
        </div>
        <p className="text-sm">Made with ❤️ in Kenya 🇰🇪 | Coming Q2 2025</p>
      </footer>
    </div>
  );
}
