import { useState } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { documentsApi } from '@/lib/api/realApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LocationDetector } from './LocationDetector';

interface LicenseUploadProps {
  organizationId?: number;
  onUploadComplete?: (document: any) => void;
  existingLicense?: any;
}

export const LicenseUpload: React.FC<LicenseUploadProps> = ({
  organizationId,
  onUploadComplete,
  existingLicense,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [expiresDate, setExpiresDate] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [description, setDescription] = useState('');
  const [legality, setLegality] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please upload a PDF file',
        });
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'File size must be less than 10MB',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleLocationDetected = (location: {
    stateCode: string;
    countryCode: string;
    legality?: any;
  }) => {
    setStateCode(location.stateCode);
    setLegality(location.legality);
  };

  const handleUpload = async () => {
    // Check if user is authenticated
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'Please complete signup first. You can upload your license after signing up from the dashboard.',
      });
      return;
    }

    if (!file) {
      toast({
        variant: 'destructive',
        title: 'File required',
        description: 'Please select a PDF file to upload',
      });
      return;
    }

    if (!licenseNumber || !stateCode) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'License number and state are required',
      });
      return;
    }

    if (legality && !legality.cultivation_allowed) {
      toast({
        variant: 'destructive',
        title: 'Cultivation not legal',
        description: 'Cannabis cultivation is not legal in the selected state',
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      // Use user's organizationId if not provided
      const orgId = organizationId || user.organizationId;
      if (!orgId) {
        toast({
          variant: 'destructive',
          title: 'Organization required',
          description: 'Organization ID is required to upload license.',
        });
        setUploading(false);
        return;
      }
      formData.append('organizationId', String(orgId));
      formData.append('licenseNumber', licenseNumber);
      formData.append('stateCode', stateCode);
      if (issuedDate) formData.append('issuedDate', issuedDate);
      if (expiresDate) formData.append('expiresDate', expiresDate);
      if (issuedBy) formData.append('issuedBy', issuedBy);
      if (description) formData.append('description', description);

      const result = await documentsApi.uploadCultivationLicense(formData);

      toast({
        title: 'License uploaded',
        description: 'Your cultivation license has been uploaded and is pending approval.',
      });

      onUploadComplete?.(result.document);
      
      // Reset form
      setFile(null);
      setLicenseNumber('');
      setStateCode('');
      setIssuedDate('');
      setExpiresDate('');
      setIssuedBy('');
      setDescription('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload license',
      });
    } finally {
      setUploading(false);
    }
  };

  if (existingLicense) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Cultivation License
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{existingLicense.name}</p>
              <p className="text-sm text-muted-foreground">
                {existingLicense.file_name}
              </p>
            </div>
            <Badge
              variant={
                existingLicense.status === 'APPROVED'
                  ? 'default'
                  : existingLicense.status === 'REJECTED'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {existingLicense.status}
            </Badge>
          </div>
          {existingLicense.status === 'PENDING_APPROVAL' && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Your license is pending Super Admin approval.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Cultivation License
        </CardTitle>
        <CardDescription>
          Upload your cultivation license PDF with details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LocationDetector
          onLocationDetected={handleLocationDetected}
          required
        />

        <div className="space-y-2">
          <Label htmlFor="file">License PDF *</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          {file && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number *</Label>
            <Input
              id="licenseNumber"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g., CA-CULT-2024-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stateCode">State *</Label>
            <Input
              id="stateCode"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value.toUpperCase())}
              placeholder="e.g., CA"
              maxLength={2}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="issuedDate">Issued Date</Label>
            <Input
              id="issuedDate"
              type="date"
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresDate">Expires Date</Label>
            <Input
              id="expiresDate"
              type="date"
              value={expiresDate}
              onChange={(e) => setExpiresDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="issuedBy">Issued By</Label>
          <Input
            id="issuedBy"
            value={issuedBy}
            onChange={(e) => setIssuedBy(e.target.value)}
            placeholder="e.g., California Department of Cannabis Control"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional notes about the license"
          />
        </div>

        {legality && !legality.cultivation_allowed && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Cannabis cultivation is not legal in the selected state. Please select a state where cultivation is legal.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleUpload}
          disabled={uploading || !file || !licenseNumber || !stateCode || (legality && !legality.cultivation_allowed)}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload License
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
