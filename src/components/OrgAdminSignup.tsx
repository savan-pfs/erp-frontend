import { useState } from 'react';
import { ArrowRight, ArrowLeft, Loader2, Building2, User, Mail, Lock, Phone, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LocationDetector } from './LocationDetector';
import { LicenseUpload } from './LicenseUpload';
import { useNavigate } from 'react-router-dom';

type Step = 1 | 2 | 3 | 4;

export const OrgAdminSignup: React.FC = () => {
  const { signUpOrgAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  // Step 2: Organization Info
  const [organizationName, setOrganizationName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [description, setDescription] = useState('');
  
  // Step 3: Location
  const [stateCode, setStateCode] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [legality, setLegality] = useState<any>(null);
  
  // Step 4: License
  const [licenseUploaded, setLicenseUploaded] = useState(false);
  const [organizationId, setOrganizationId] = useState<number | null>(null);

  const handleLocationDetected = (location: {
    stateCode: string;
    countryCode: string;
    legality?: any;
  }) => {
    setStateCode(location.stateCode);
    setCountryCode(location.countryCode);
    setLegality(location.legality);
  };

  const handleLicenseUploaded = (document: any) => {
    setLicenseUploaded(true);
    if (document.organizationId) {
      setOrganizationId(document.organizationId);
    }
  };

  const validateStep1 = () => {
    if (!firstName.trim() || firstName.length < 2) return 'First name is required (min 2 characters)';
    if (!lastName.trim() || lastName.length < 2) return 'Last name is required (min 2 characters)';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Valid email is required';
    if (!password || password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const validateStep2 = () => {
    if (!organizationName.trim() || organizationName.length < 2) return 'Organization name is required';
    return null;
  };

  const validateStep3 = () => {
    if (!stateCode) return 'Please select or detect your location';
    if (legality && !legality.cultivation_allowed) return 'Cannabis cultivation is not legal in the selected state';
    return null;
  };

  const handleNext = () => {
    let error: string | null = null;
    
    if (step === 1) {
      error = validateStep1();
      if (!error) setStep(2);
    } else if (step === 2) {
      error = validateStep2();
      if (!error) setStep(3);
    } else if (step === 3) {
      error = validateStep3();
      if (!error) setStep(4);
    }
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: error,
      });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleSubmit = async () => {
    // License upload is optional during signup - can be uploaded later from dashboard
    setLoading(true);
    
    try {
      const { error, data } = await signUpOrgAdmin({
        email,
        password,
        firstName,
        lastName,
        phone: phone || undefined,
        organizationName,
        legalName: legalName || undefined,
        taxId: taxId || undefined,
        locationStateCode: stateCode,
        locationCountryCode: countryCode,
        description: description || undefined,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Signup Failed',
          description: error.message,
        });
      } else {
        toast({
          title: 'Signup Successful!',
          description: 'Your organization has been created and is pending approval. You will be redirected to upload your cultivation license.',
        });
        // Small delay to show toast, then navigate
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: err.message || 'An error occurred during signup',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Admin/Grower Signup
        </CardTitle>
        <CardDescription>
          Create your organization and get started with cultivation management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Organization Info */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Organization Information</h3>
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="organizationName"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalName">Legal Name</Label>
              <Input
                id="legalName"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID / EIN</Label>
              <Input
                id="taxId"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                placeholder="Brief description of your organization..."
              />
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location</h3>
            <LocationDetector
              onLocationDetected={handleLocationDetected}
              required
            />
          </div>
        )}

        {/* Step 4: License */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cultivation License</h3>
            <Alert>
              <FileText className="w-4 h-4" />
              <AlertDescription>
                License upload is optional during signup. You can upload your cultivation license after completing signup from your dashboard.
              </AlertDescription>
            </Alert>
            <LicenseUpload
              organizationId={organizationId || undefined}
              onUploadComplete={handleLicenseUploaded}
            />
            {licenseUploaded && (
              <Alert>
                <FileText className="w-4 h-4" />
                <AlertDescription>
                  License uploaded successfully! You can now submit your signup.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || loading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {step < 4 ? (
            <Button type="button" onClick={handleNext} disabled={loading}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
