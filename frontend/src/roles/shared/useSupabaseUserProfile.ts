import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../services/authService';
import { createEmptyUserProfile, getSupabaseUserProfile } from '../../services/userProfileApi';

export type SupabaseUserProfile = ReturnType<typeof createEmptyUserProfile>;

export function useSupabaseUserProfile(role: string) {
  const [profile, setProfile] = useState<SupabaseUserProfile>(() => createEmptyUserProfile(role));
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      const result = await getSupabaseUserProfile(role, getCurrentUser());

      if (!isMounted) return;

      if (result.error) {
        setErrorMessage('Supabase profile data could not be loaded.');
        setProfile(createEmptyUserProfile(role));
      } else if (result.data) {
        setErrorMessage('');
        setProfile(result.data);
      } else {
        setErrorMessage('No Supabase profile was found for this role.');
        setProfile(createEmptyUserProfile(role));
      }

      setIsLoading(false);
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [role]);

  return { profile, isLoading, errorMessage };
}
