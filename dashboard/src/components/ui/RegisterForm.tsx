'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterForm() {
  const { signup, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password || !form.confirmPassword) {
      return setError('All fields are required');
    }
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }

    const success = await signup(form.email, form.password);
    if (!success) setError('Registration failed. Try again.');
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
        <Label>Email</Label>
        <Input
          type="email"
          placeholder="Enter email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
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

      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Sign Up'}
      </Button>
    </form>
  );
}
