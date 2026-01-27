import { useAuthContext } from '../context/AuthContext';

// Re-export the hook from context to maintain backward compatibility
// This avoids having to update imports in all screens
export const useAuth = useAuthContext;
