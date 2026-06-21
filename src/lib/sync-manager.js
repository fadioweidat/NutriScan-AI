import { getQueue, dequeueAction } from './offline-db';

// We avoid Promise.all in the main sync loop to guarantee chronological execution order.
let syncInProgress = false;
let retryTimeout = null;
let currentBackoffMs = 1000;
const MAX_BACKOFF_MS = 30000; // max 30 seconds

// Check current network status
export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Main synchronization loop
export async function syncOfflineQueue(supabase, onStatusChange) {
  if (syncInProgress) return;
  if (!isOnline()) {
    if (onStatusChange) onStatusChange('offline');
    return;
  }

  try {
    const queue = await getQueue();
    if (queue.length === 0) {
      if (onStatusChange) onStatusChange('synced');
      currentBackoffMs = 1000; // Reset backoff
      return;
    }

    syncInProgress = true;
    if (onStatusChange) onStatusChange('syncing');
    console.log(`[Sync Manager] Starting synchronization of ${queue.length} actions.`);

    for (const action of queue) {
      // Safety check: ensure connection wasn't lost during iteration
      if (!isOnline()) {
        throw new Error("Connection lost during synchronization loop");
      }

      let success = false;
      try {
        console.log(`[Sync Manager] Syncing action ${action.id} to table ${action.table}.`);
        
        let res;
        // Check if action type is insert or update
        if (action.type === 'insert') {
          res = await supabase.from(action.table).insert([action.payload]);
        } else if (action.type === 'upsert') {
          res = await supabase.from(action.table).upsert([action.payload]);
        } else if (action.type === 'update') {
          // If we have an id in the payload, update by id
          const { id, ...updateFields } = action.payload;
          res = await supabase.from(action.table).update(updateFields).eq('id', id);
        } else {
          console.warn(`[Sync Manager] Unsupported action type: ${action.type}`);
          success = true; // skip unsupported
        }

        if (res && res.error) {
          // Check if it is a network error or a PG DB error
          const isNetworkError = res.error.message?.toLowerCase().includes('fetch') || 
                                 res.status === 0 || 
                                 res.status === 504;
          
          if (isNetworkError) {
            throw new Error(`Network failure during query: ${res.error.message}`);
          } else {
            // Postgres error or data conflict: skip it to avoid blocking the queue
            console.error(`[Sync Manager] Skip item ${action.id} due to clinical/db conflict:`, res.error);
            success = true;
          }
        } else {
          success = true;
        }
      } catch (err) {
        console.error(`[Sync Manager] Temporary network error syncing action ${action.id}:`, err);
        success = false;
        // Re-throw to trigger backoff
        throw err;
      }

      if (success) {
        await dequeueAction(action.id);
        console.log(`[Sync Manager] Action ${action.id} synced and dequeued.`);
      }
    }

    syncInProgress = false;
    currentBackoffMs = 1000; // Reset backoff on full success
    if (onStatusChange) onStatusChange('synced');
    console.log("[Sync Manager] Synchronization completed successfully.");

  } catch (err) {
    syncInProgress = false;
    if (onStatusChange) onStatusChange('offline');
    console.error("[Sync Manager] Sync failed, scheduling retry with backoff.", err);
    scheduleSyncRetry(supabase, onStatusChange);
  }
}

// Schedule sync retry with exponential backoff
function scheduleSyncRetry(supabase, onStatusChange) {
  if (retryTimeout) clearTimeout(retryTimeout);
  
  console.log(`[Sync Manager] Scheduling retry in ${currentBackoffMs}ms`);
  retryTimeout = setTimeout(() => {
    syncOfflineQueue(supabase, onStatusChange);
  }, currentBackoffMs);

  // Double the backoff for next time, up to MAX_BACKOFF_MS
  currentBackoffMs = Math.min(currentBackoffMs * 2, MAX_BACKOFF_MS);
}

// Start network listeners
export function startSyncListener(supabase, onStatusChange) {
  const handleOnline = () => {
    console.log("[Sync Manager] Network online detected. Triggering sync.");
    syncOfflineQueue(supabase, onStatusChange);
  };

  const handleOffline = () => {
    console.log("[Sync Manager] Network offline detected.");
    if (onStatusChange) onStatusChange('offline');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Run initial check and sync
  syncOfflineQueue(supabase, onStatusChange);

  // Return unsubscribe clean-up function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (retryTimeout) clearTimeout(retryTimeout);
  };
}

export default {
  isOnline,
  syncOfflineQueue,
  startSyncListener
};
