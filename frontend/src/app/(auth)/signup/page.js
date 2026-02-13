'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { apiPost } from '@/lib/api';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiPost('/auth/signup', { email, password });
      localStorage.setItem('cw_token', data.token);
      router.push('/onboarding');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-8">
      <div className="text-center mb-8">
        <Link href="/" className="font-[family-name:var(--font-display)] text-2xl text-txt">
          ⚔️ CLAWWARRIORS
        </Link>
        <div className="flex justify-center gap-1 mt-6">
          <Link href="/signup" className="px-4 py-2 text-sm font-medium text-txt border-b-2 border-guardian">
            Sign Up
          </Link>
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-txt-muted border-b-2 border-transparent hover:text-txt">
            Log In
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={() => console.log('Google OAuth not yet configured')}
        className="w-full flex items-center justify-center gap-2 border border-border rounded-[var(--radius-btn)] py-3 text-sm text-txt-body hover:bg-elevated transition-colors cursor-pointer"
      >
        Continue with Google
      </button>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-txt-dim">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="warrior@example.com"
          required
        />
        <Input
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 8 characters"
          minLength={8}
          required
        />
        {error && <p className="text-danger text-sm">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Create Account
        </Button>
      </form>

      <p className="text-center text-xs text-txt-dim mt-6">
        7-day free trial. No credit card required.
      </p>
    </Card>
  );
}
