'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="relative z-50 border-b border-white/20 bg-black/50 backdrop-blur-xl mx-4 mt-2 shadow-md shadow-green-300/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-green-500 rounded-xl flex items-center justify-center">
                <Image
                  src="/ddtklogo.png"
                  alt="Daraja Toolkit"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              </div>
              <span className="text-xl font-bold text-white">
                darajaDevToolkit
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#features"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#docs"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Docs
            </Link>
            <Link href="/get-started">
              <button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105">
                Get Started
              </button>
            </Link>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10">
          <div className="px-4 py-6 space-y-4">
            <Link
              href="#features"
              className="block text-gray-300 hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="block text-gray-300 hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="#docs"
              className="block text-gray-300 hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Docs
            </Link>
            <Link href="/get-started">
              <button className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-medium">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
