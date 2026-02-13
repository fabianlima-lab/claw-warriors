'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, apiFetch } from './api';

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCredentialResponse = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const data = await apiPost('/auth/google', {
        credential: credentialResponse.credential,
      });
      localStorage.setItem('cw_token', data.token);

      if (data.is_new_user) {
        router.push('/onboarding');
      } else {
        // Returning user — check if they have warriors
        const warriors = await apiFetch('/warriors/mine');
        const list = warriors.warriors || warriors;
        if (Array.isArray(list) && list.length > 0) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return { handleCredentialResponse, loading, error, setError };
}
