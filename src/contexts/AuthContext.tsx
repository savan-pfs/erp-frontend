import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '@/lib/api/realApi';

interface User {
  id: number | string;
  email: string;
  firstName?: string;
  lastName?: string;
  full_name?: string;
  role?: string;
  organizationId?: number;
  roleNames?: string[];
  roles?: Array<{
    id: number;
    name: string;
    displayName: string;
    organizationId?: number;
    facilityId?: number;
  }>;
  permissions?: Array<{
    id: number;
    name: string;
    description?: string;
  }>;
}

interface Session {
  user: User;
  token: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signUpOrgAdmin: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    organizationName: string;
    legalName?: string;
    taxId?: string;
    locationStateCode?: string;
    locationCountryCode?: string;
    description?: string;
  }) => Promise<{ error: Error | null; data?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'passionfarms_auth';
const TOKEN_KEY = 'authToken';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage and verify token
    const initAuth = async () => {
      try {
        const storedAuth = localStorage.getItem(STORAGE_KEY);
        const token = localStorage.getItem(TOKEN_KEY);

        if (storedAuth && token) {
          // Verify token and get fresh user data (including roles)
          try {
            const verifyResponse = await authApi.verify();
            if (verifyResponse.valid && verifyResponse.user) {
              const userData: User = {
                id: verifyResponse.user.id,
                email: verifyResponse.user.email,
                firstName: verifyResponse.user.firstName,
                lastName: verifyResponse.user.lastName,
                full_name: verifyResponse.user.full_name || `${verifyResponse.user.firstName || ''} ${verifyResponse.user.lastName || ''}`.trim(),
                role: verifyResponse.user.role,
                organizationId: verifyResponse.user.organizationId || verifyResponse.user.organization_id,
                roleNames: verifyResponse.user.roleNames || verifyResponse.user.roles?.map((r: any) => r.name) || [],
                roles: verifyResponse.user.roles || [],
                permissions: verifyResponse.user.permissions || [],
              };

              // Update stored auth data with fresh roles
              localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData }));
              setUser(userData);
              setSession({ user: userData, token });
            } else {
              // Token invalid, clear storage
              localStorage.removeItem(STORAGE_KEY);
              localStorage.removeItem(TOKEN_KEY);
            }
          } catch (verifyError) {
            console.warn('Token verification failed', verifyError);
            // Fallback to stored data if verify fails
            const authData = JSON.parse(storedAuth);
            setUser(authData.user);
            setSession({ user: authData.user, token });
          }
        }
      } catch (e) {
        console.warn('Failed to load auth from localStorage', e);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Call the real backend API
      const response = await authApi.login(email, password);

      if (response.token && response.user) {
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          full_name: `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim(),
          role: response.user.role,
          organizationId: response.user.organizationId || response.user.organization_id,
          roleNames: response.user.roleNames || response.user.roles?.map((r: any) => r.name) || [],
          roles: response.user.roles || [],
          permissions: response.user.permissions || [],
        };

        const sessionData = { user: userData, token: response.token };

        // Store auth data and token
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData }));
        localStorage.setItem(TOKEN_KEY, response.token);

        setUser(userData);
        setSession(sessionData);

        return { error: null };
      } else {
        return { error: new Error('Invalid response from server') };
      }
    } catch (err: any) {
      console.error('Login error:', err);
      return { error: new Error(err.message || 'Login failed. Please check your credentials.') };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const [firstName, ...lastNameParts] = fullName.split(' ');
      const lastName = lastNameParts.join(' ');

      const response = await authApi.register({
        email,
        password,
        firstName,
        lastName: lastName || firstName,
      });

      if (response.token && response.user) {
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          full_name: fullName,
          role: response.user.role,
        };

        const sessionData = { user: userData, token: response.token };

        // Store auth data and token
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData }));
        localStorage.setItem(TOKEN_KEY, response.token);

        setUser(userData);
        setSession(sessionData);

        return { error: null };
      } else {
        return { error: new Error('Invalid response from server') };
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      return { error: new Error(err.message || 'Registration failed. Please try again.') };
    }
  };

  const signUpOrgAdmin = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    organizationName: string;
    legalName?: string;
    taxId?: string;
    locationStateCode?: string;
    locationCountryCode?: string;
    description?: string;
  }) => {
    try {
      const response = await authApi.registerOrgAdmin(data);

      if (response.token && response.user) {
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          full_name: `${response.user.firstName} ${response.user.lastName}`,
          role: response.user.role,
          organizationId: response.user.organizationId || response.organization?.id,
        };

        const sessionData = { user: userData, token: response.token };

        // Store auth data and token
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData }));
        localStorage.setItem(TOKEN_KEY, response.token);

        setUser(userData);
        setSession(sessionData);

        return { error: null, data: response };
      } else {
        return { error: new Error('Invalid response from server'), data: null };
      }
    } catch (err: any) {
      console.error('Org Admin signup error:', err);
      return { error: new Error(err.message || 'Registration failed. Please try again.'), data: null };
    }
  };

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signUpOrgAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
