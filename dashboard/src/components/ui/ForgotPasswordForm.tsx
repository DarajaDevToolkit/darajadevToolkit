'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setMessage('');

    if (!email) {
      setStatus('error');
      setMessage('Please enter your email.');
      return;
    }

    try {
      const success = await resetPassword?.(email); // ✅ optional chaining in case it's undefined
      if (success) {
        setStatus('success');
        setMessage('Check your inbox for password reset instructions.');
      } else {
        setStatus('error');
        setMessage('Error sending reset email. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Unexpected error occurred. Please try again later.');
      console.error('Reset error:', error);
    }
  };

  return (
    <form onSubmit={handleReset} className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-green-800">Forgot Password</h2>
        <p className="text-gray-600">We’ll send you a reset link</p>
      </div>

      {status !== 'idle' && (
        <Alert variant={status === 'success' ? 'default' : 'destructive'}>
          {status === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        disabled={status === 'success'}
      >
        Send Reset Link
      </Button>
    </form>
  );
}
