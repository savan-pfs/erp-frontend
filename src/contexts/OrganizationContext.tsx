import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { organizationsApi } from '@/lib/api/realApi';

interface Organization {
  id: number;
  name: string;
  legalName?: string;
  isActive: boolean;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  loading: boolean;
  setCurrentOrganization: (org: Organization | null) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshOrganizations = async () => {
    try {
      const orgs = await organizationsApi.getAll();
      setOrganizations(Array.isArray(orgs) ? orgs : []);
      
      // Auto-select organization if user has one
      if (user?.organizationId && !currentOrganization) {
        const userOrg = (Array.isArray(orgs) ? orgs : []).find((o: Organization) => o.id === user.organizationId);
        if (userOrg) {
          setCurrentOrganization(userOrg);
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshOrganizations();
    }
  }, [user]);

  // Load from localStorage on mount
  useEffect(() => {
    const storedOrg = localStorage.getItem('current_organization');
    
    if (storedOrg) {
      try {
        const org = JSON.parse(storedOrg);
        setCurrentOrganization(org);
      } catch (e) {
        console.warn('Failed to load organization from localStorage', e);
      }
    }
    
    setLoading(false);
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (currentOrganization) {
      localStorage.setItem('current_organization', JSON.stringify(currentOrganization));
    } else {
      localStorage.removeItem('current_organization');
    }
  }, [currentOrganization]);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        loading,
        setCurrentOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
