'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import linksData from '@/data/links.json';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/ddtklogo.png"
                alt="Daraja Toolkit"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-semibold text-gray-900">
                Daraja Toolkit
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {linksData.navigation.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {linksData.auth.map((authLink) => (
              <Link
                key={authLink.id}
                href={authLink.href}
                className={
                  authLink.variant === 'primary'
                    ? 'bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors'
                    : 'text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors'
                }
              >
                {authLink.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            {linksData.navigation.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="block text-gray-600 hover:text-gray-900 font-medium text-sm py-2 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
              {linksData.auth.map((authLink) => (
                <Link
                  key={authLink.id}
                  href={authLink.href}
                  className={
                    authLink.variant === 'primary'
                      ? 'block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm text-center hover:bg-blue-700 transition-colors'
                      : 'block text-gray-600 hover:text-gray-900 font-medium text-sm py-2 transition-colors'
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {authLink.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
