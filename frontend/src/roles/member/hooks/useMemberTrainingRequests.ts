import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../../services/authService';
import { getTrainingRequestsForMember } from '../../../services/trainingRequestApi';

export function useMemberTrainingRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [requestLoadMessage, setRequestLoadMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadRequests = () => {
      const currentUser = getCurrentUser();
      const memberLookup = currentUser?.memberId || currentUser?.email || currentUser?.id;

      setIsLoadingRequests(true);
      getTrainingRequestsForMember(memberLookup)
        .then(({ data, error }) => {
          if (!isMounted) return;

          if (error || !data.length) {
            setRequests([]);
            setRequestLoadMessage(error ? 'Request status could not be loaded.' : '');
          } else {
            setRequests(data);
            setRequestLoadMessage('');
          }

          setIsLoadingRequests(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setRequests([]);
          setRequestLoadMessage('');
          setIsLoadingRequests(false);
        });
    };

    loadRequests();
    window.addEventListener('gymster:training-requests-updated', loadRequests);

    return () => {
      isMounted = false;
      window.removeEventListener('gymster:training-requests-updated', loadRequests);
    };
  }, []);

  return { requests, isLoadingRequests, requestLoadMessage };
}
