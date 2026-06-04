import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../../services/authService';
import { getTrainingRequestsForMember } from '../../../services/trainingRequestApi';

export function useMemberTrainingRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [requestLoadMessage, setRequestLoadMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    const currentUser = getCurrentUser();
    const memberLookup = currentUser?.memberId || currentUser?.email || currentUser?.id;

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
        setRequestLoadMessage('Request status could not be loaded.');
        setIsLoadingRequests(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { requests, isLoadingRequests, requestLoadMessage };
}
