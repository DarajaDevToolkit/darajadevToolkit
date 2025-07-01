'use client';

import React from 'react';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-green-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/login.svg" alt="illustration" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-start p-12 text-white">
          <div className="max-w-md bg-black bg-opacity-35 backdrop-blur-sm rounded-lg p-8">
            <h1 className="text-5xl font-bold mb-6">Daraja Dev Toolkit</h1>
            <p className="text-xl text-green-100 mb-8">
              The complete M-Pesa developer platform for building, testing, and monitoring M-Pesa webhooks and payment integrations.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <span className="text-green-100">Secure API key management</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <span className="text-green-100">Real-time webhook testing</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <span className="text-green-100">Comprehensive documentation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;
