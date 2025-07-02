'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function RegisterForm() {
  const { signup, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneCode: '+254', // default Kenya
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { name, email, phoneCode, phoneNumber, password, confirmPassword } = form;

    if (!name || !email || !phoneNumber || !password || !confirmPassword) {
      return setError('All fields are required');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    const fullPhone = phoneCode + phoneNumber;

    try {
      await signup(name, email, fullPhone, password);
    } catch (err) {
      setError('Registration failed. Try again.');
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-green-800">Register</h2>
        <p className="text-gray-600">Create your account</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input
          type="text"
          placeholder="Enter your name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          placeholder="Enter email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Phone Number</Label>
        <div className="flex gap-2">
          <select
            className="border rounded px-2 py-2 bg-white text-sm w-24"
            value={form.phoneCode}
            onChange={(e) => setForm({ ...form, phoneCode: e.target.value })}
          >
            <option value="+254">+254 🇰🇪</option>
            <option value="+256">+256 🇺🇬</option>
            <option value="+255">+255 🇹🇿</option>
            <option value="+250">+250 🇷🇼</option>
            <option value="+1">+1 🇺🇸</option>
            {/* Add more codes as needed */}
          </select>
          <Input
            type="tel"
            placeholder="712345678"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2 relative">
        <Label>Password</Label>
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </div>

      <div className="space-y-2 relative">
        <Label>Confirm Password</Label>
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="absolute right-0 top-7"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      <Button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        disabled={loading}
      >
        {loading ? 'Registering...' : 'Sign Up'}
      </Button>

      <p className="text-sm text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-green-600 underline">
          Login
        </Link>
      </p>
    </form>
  );
}
