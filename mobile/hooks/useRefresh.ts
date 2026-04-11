import { useState, useCallback } from "react";

export function useRefresh(onRefresh?: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (onRefresh) await onRefresh();
    // Minimum visual feedback time
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, [onRefresh]);

  return { refreshing, onRefresh: handleRefresh };
}
