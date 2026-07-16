import { useState, useEffect, useCallback } from 'react';
import { getPendingActions, clearPendingActions, savePendingAction, hasNonConformingLots } from '../services/offlineDB';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [hasBlockedSync, setHasBlockedSync] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) syncPendingActions();
  }, [isOnline]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const actions = await getPendingActions();
      setPendingCount(actions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const syncPendingActions = useCallback(async () => {
    const actions = await getPendingActions();
    if (actions.length === 0) return;

    const hasBlocked = await hasNonConformingLots();
    if (hasBlocked) {
      setHasBlockedSync(true);
      setSyncStatus('blocked');
      return;
    }

    setSyncStatus('syncing');
    const token = localStorage.getItem('ruam_token');

    for (const action of actions) {
      try {
        await fetch(action.endpoint, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: action.body ? JSON.stringify(action.body) : undefined,
        });
      } catch (e) {
        console.error('[OfflineSync] Error syncing action:', e);
        setSyncStatus('error');
        return;
      }
    }

    await clearPendingActions();
    setPendingCount(0);
    setSyncStatus('synced');
    setHasBlockedSync(false);
    setTimeout(() => setSyncStatus('idle'), 3000);
  }, []);

  const queueAction = useCallback(async (endpoint, method, body) => {
    if (isOnline) {
      const token = localStorage.getItem('ruam_token');
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return res.json();
    } else {
      await savePendingAction({ endpoint, method, body });
      setPendingCount(prev => prev + 1);
      return { offline: true, queued: true };
    }
  }, [isOnline]);

  return { isOnline, pendingCount, syncStatus, hasBlockedSync, queueAction };
}
