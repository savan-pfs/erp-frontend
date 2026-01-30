import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common';
import { Switch } from '@/components/ui/switch';
import { Plug, Cloud, Box, Lock, Loader2, Settings } from 'lucide-react';
import { integrationsApi } from '@/lib/api/realApi';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Integrations() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Config Dialog State
    const [showConfigDialog, setShowConfigDialog] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        setLoading(true);
        try {
            const data = await integrationsApi.getAll();
            setIntegrations(data);
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to load integrations." });
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (integration: any) => {
        if (integration.status === 'connected') {
            // Disconnect
            setProcessingId(integration.id);
            try {
                await integrationsApi.disconnect(integration.id);
                toast({ title: "Disconnected", description: `${integration.name} has been disconnected.` });
                loadIntegrations();
            } catch (error) {
                toast({ variant: 'destructive', title: "Error", description: "Failed to disconnect." });
            } finally {
                setProcessingId(null);
            }
        } else {
            // Open Config Dialog to Connect
            setSelectedIntegration(integration);
            setApiKey(''); // Reset
            setShowConfigDialog(true);
        }
    };

    const handleConnect = async () => {
        if (!selectedIntegration) return;
        setProcessingId(selectedIntegration.id);
        setShowConfigDialog(false);

        try {
            // Simulate config object
            const config = { apiKey };
            await integrationsApi.connect(selectedIntegration.id, config);
            toast({ title: "Connected", description: `${selectedIntegration.name} is now connected.` });
            loadIntegrations();
        } catch (error) {
            toast({ variant: 'destructive', title: "Connection Failed", description: "Could not connect integration." });
        } finally {
            setProcessingId(null);
        }
    };

    const getIcon = (name: string) => {
        switch (name) {
            case 'Box': return Box;
            case 'Cloud': return Cloud;
            case 'Plug': return Plug;
            case 'Lock': return Lock;
            default: return Plug;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen animate-fade-in">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Integrations"
                description="Connect your ERP with third-party tools and services"
                breadcrumbs={[{ label: 'Integrations' }]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((integration) => {
                    const Icon = getIcon(integration.icon_name);
                    const isConnected = integration.status === 'connected';
                    const isProcessing = processingId === integration.id;

                    return (
                        <Card key={integration.id} className="relative overflow-hidden transition-all hover:shadow-md">
                            <div className={`absolute top-0 left-0 w-1 h-full ${isConnected ? 'bg-green-500' : 'bg-muted'}`} />
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${isConnected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <CardTitle className="text-base">{integration.name}</CardTitle>
                                    <Badge variant="outline" className="font-normal text-xs bg-background">
                                        {integration.category}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground h-10 line-clamp-2">
                                    {integration.description}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <span className={`text-sm font-medium flex items-center gap-2 ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`}>
                                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-gray-300'}`} />
                                        {isConnected ? 'Connected' : 'Disconnected'}
                                    </span>
                                    {isProcessing ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                    ) : (
                                        <Switch
                                            checked={isConnected}
                                            onCheckedChange={() => handleToggle(integration)}
                                        />
                                    )}
                                </div>
                                {isConnected && (
                                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => {
                                        setSelectedIntegration(integration);
                                        setApiKey('********'); // Mock mask
                                        setShowConfigDialog(true);
                                    }}>
                                        <Settings className="w-3 h-3 mr-2" /> Configure
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Config Dialog */}
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
                        <DialogDescription>
                            Enter your API credentials to connect with {selectedIntegration?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key / Token</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter API Key"
                            />
                            <p className="text-xs text-muted-foreground">
                                You can find this in your {selectedIntegration?.name} developer settings.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfigDialog(false)}>Cancel</Button>
                        <Button onClick={handleConnect} disabled={!apiKey && selectedIntegration?.status !== 'connected'}>
                            {selectedIntegration?.status === 'connected' ? 'Update Configuration' : 'Connect Integration'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
