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
        setErrorMessage('Profile could not be loaded.');
        setProfile(createEmptyUserProfile(role));
      } else if (result.data) {
        setErrorMessage('');
        setProfile(result.data);
      } else {
        setErrorMessage('No matching profile found.');
        setProfile(createEmptyUserProfile(role));
      }

      setIsLoading(false);
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [role]);

  useEffect(() => {
    const syncCurrentUserProfile = (event: Event) => {
      const currentUser = (event as CustomEvent).detail;
      if (!currentUser) return;

      setProfile((current) => ({
        ...current,
        firstName: currentUser.firstName || current.firstName,
        lastName: currentUser.lastName || current.lastName,
        fullName: currentUser.fullName || current.fullName,
        email: currentUser.email || current.email,
        phone: currentUser.phone || currentUser.phone_number || current.phone,
        dob: currentUser.dob || currentUser.date_of_birth || current.dob,
        avatarUrl: currentUser.avatarUrl || currentUser.avatar_url || current.avatarUrl,
      }));
    };

    window.addEventListener('gymster:user-updated', syncCurrentUserProfile);

    return () => {
      window.removeEventListener('gymster:user-updated', syncCurrentUserProfile);
    };
  }, []);

  return { profile, isLoading, errorMessage };
}
