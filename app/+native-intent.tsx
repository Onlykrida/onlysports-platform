export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  // Allow deep links from push notifications to pass through
  if (path && path !== '/') {
    return path;
  }
  return '/';
}