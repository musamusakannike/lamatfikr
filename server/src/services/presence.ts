const connectionCounts = new Map<string, number>();

export function markOnline(userId: string) {
  const current = connectionCounts.get(userId) ?? 0;
  const next = current + 1;
  connectionCounts.set(userId, next);
  return next;
}

export function markOffline(userId: string) {
  const current = connectionCounts.get(userId) ?? 0;
  const next = Math.max(0, current - 1);
  if (next === 0) {
    connectionCounts.delete(userId);
  } else {
    connectionCounts.set(userId, next);
  }
  return next;
}

export function isOnline(userId: string) {
  return (connectionCounts.get(userId) ?? 0) > 0;
}

export function getOnlineCount(userId: string) {
  return connectionCounts.get(userId) ?? 0;
}

export function getTotalOnlineUsers() {
  return connectionCounts.size;
}
