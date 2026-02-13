'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, apiFetch } from './api';

/**
 * Determines where to send a user after Google auth based on their progress:
 * - No goals → /onboarding (step 1)
 * - Goals but no warriors → /warriors (step 2)
 * - Warriors but no channel → /channel (step 3)
 * - Everything done → /dashboard
 */
export async function resolveDestination() {
  try {
    const stats = await apiFetch('/dashboard/stats');

    // No goals set → start of onboarding
    if (!stats.goals) return '/onboarding';

    // Has goals — check for active warriors
    if (stats.active_warriors === 0) return '/warriors';

    // Has warriors — check for channel
    if (!stats.channel) return '/channel';

    // Fully onboarded
    return '/dashboard';
  } catch {
    // If stats fail, safest default is onboarding
    return '/onboarding';
  }
}

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
        // Returning user — route to wherever they left off
        const dest = await resolveDestination();
        router.push(dest);
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return { handleCredentialResponse, loading, error, setError };
}
