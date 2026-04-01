import { useAuth } from '@/hooks/auth-context';
import { roleAccents } from '@/constants/theme';

export function useRoleAccent() {
  const { user } = useAuth();
  return roleAccents[user?.role || 'athlete'] || roleAccents.athlete;
}
