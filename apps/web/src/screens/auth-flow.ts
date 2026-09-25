// Auth routes must not navigate until /api/auth/me has populated the shell's
// identity state, otherwise the unauthenticated wildcard redirects to /login.
export async function finishAuth(onAuth: () => Promise<void>, navigate: (path: string) => void, path: string): Promise<void> {
  await onAuth();
  navigate(path);
}
