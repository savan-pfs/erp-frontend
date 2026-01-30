import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export const OrganizationSelector: React.FC = () => {
  const {
    currentOrganization,
    organizations,
    setCurrentOrganization,
    loading,
  } = useOrganization();

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-muted-foreground" />
      <Select
        value={currentOrganization?.id.toString() || ''}
        onValueChange={(value) => {
          const org = organizations.find((o) => o.id.toString() === value);
          if (org) {
            setCurrentOrganization(org);
          }
        }}
        disabled={loading || organizations.length === 0}
      >
        <SelectTrigger className="w-[200px] h-8">
          <SelectValue 
            placeholder={loading ? "Loading..." : organizations.length === 0 ? "No Organizations" : "Select Organization"} 
          />
        </SelectTrigger>
        {organizations.length > 0 && (
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id.toString()}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        )}
      </Select>
    </div>
  );
};
