import { useState, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { locationApi } from '@/lib/api/realApi';

interface LocationDetectorProps {
  onLocationDetected?: (location: {
    stateCode: string;
    countryCode: string;
    legality?: any;
  }) => void;
  initialStateCode?: string;
  required?: boolean;
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

export const LocationDetector: React.FC<LocationDetectorProps> = ({
  onLocationDetected,
  initialStateCode,
  required = false,
}) => {
  const [detecting, setDetecting] = useState(false);
  const [stateCode, setStateCode] = useState<string>(initialStateCode || '');
  const [legality, setLegality] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectionMethod, setDetectionMethod] = useState<string>('');

  useEffect(() => {
    if (initialStateCode) {
      checkLegality(initialStateCode);
    }
  }, [initialStateCode]);

  useEffect(() => {
    if (stateCode) {
      checkLegality(stateCode);
    }
  }, [stateCode]);

  const detectLocation = async () => {
    setDetecting(true);
    setError(null);

    try {
      // Try browser geolocation first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const result = await locationApi.detect({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
              
              if (result.stateCode) {
                setStateCode(result.stateCode);
                setLegality(result.legality);
                setDetectionMethod('browser');
                onLocationDetected?.({
                  stateCode: result.stateCode,
                  countryCode: result.countryCode || 'US',
                  legality: result.legality,
                });
              } else {
                // Fallback to IP
                detectByIP();
              }
            } catch (err: any) {
              console.error('Browser geolocation error:', err);
              detectByIP();
            } finally {
              setDetecting(false);
            }
          },
          () => {
            // Browser geolocation denied, try IP
            detectByIP();
          },
          { timeout: 5000 }
        );
      } else {
        // No browser geolocation, try IP
        detectByIP();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to detect location');
      setDetecting(false);
    }
  };

  const detectByIP = async () => {
    try {
      const result = await locationApi.detect();
      
      if (result.stateCode) {
        setStateCode(result.stateCode);
        setLegality(result.legality);
        setDetectionMethod('ip');
        onLocationDetected?.({
          stateCode: result.stateCode,
          countryCode: result.countryCode || 'US',
          legality: result.legality,
        });
      } else {
        setError('Unable to detect location. Please select manually.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to detect location');
    } finally {
      setDetecting(false);
    }
  };

  const checkLegality = async (code: string) => {
    if (!code) return;
    
    try {
      const result = await locationApi.checkLegality(code);
      setLegality(result);
      onLocationDetected?.({
        stateCode: code,
        countryCode: 'US',
        legality: result,
      });
    } catch (err: any) {
      console.error('Legality check error:', err);
      // If error is due to auth, still allow manual selection
      if (err.message?.includes('token') || err.message?.includes('auth')) {
        setError('Please select your state manually');
      }
    }
  };

  const handleStateChange = (value: string) => {
    setStateCode(value);
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location
        </CardTitle>
        <CardDescription>
          {required ? 'Required: Select or detect your location' : 'Select or detect your location'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={detectLocation}
            disabled={detecting}
            className="flex-1"
          >
            {detecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Auto-Detect Location
              </>
            )}
          </Button>
        </div>

        {detectionMethod && (
          <p className="text-sm text-muted-foreground">
            Detected via {detectionMethod === 'browser' ? 'browser geolocation' : 'IP address'}
          </p>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">State</label>
          <Select value={stateCode} onValueChange={handleStateChange} required={required}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((state) => (
                <SelectItem key={state.code} value={state.code}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {legality && (
          <Alert
            variant={legality.cultivation_allowed ? 'default' : 'destructive'}
            className="mt-4"
          >
            {legality.cultivation_allowed ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <AlertDescription>
              {legality.cultivation_allowed ? (
                <div>
                  <p className="font-semibold">Cannabis cultivation is legal in {US_STATES.find(s => s.code === stateCode)?.name}</p>
                  {legality.license_required && <p className="text-sm mt-1">License required</p>}
                </div>
              ) : (
                <div>
                  <p className="font-semibold">Cannabis cultivation is not legal in {US_STATES.find(s => s.code === stateCode)?.name}</p>
                  <p className="text-sm mt-1">Please select a state where cultivation is legal</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
