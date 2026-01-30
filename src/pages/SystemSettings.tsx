import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common';
import { Save, Server, Shield, Globe, Mail, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { systemSettingsApi } from '@/lib/api/realApi';

export default function SystemSettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Settings State
    const [settings, setSettings] = useState({
        platform_name: '',
        support_email: '',
        maintenance_mode: false,
        allow_registration: true
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await systemSettingsApi.getSettings();
            setSettings({
                platform_name: data.platform_name || '',
                support_email: data.support_email || '',
                maintenance_mode: data.maintenance_mode || false,
                allow_registration: data.allow_registration !== undefined ? data.allow_registration : true
            });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to load system settings." });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await systemSettingsApi.updateSettings(settings);
            toast({
                title: "Settings Saved",
                description: "System configuration has been updated successfully."
            });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to save settings." });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
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
                title="System Settings"
                description="Configure global platform settings and parameters"
                breadcrumbs={[{ label: 'System Settings' }]}
                actions={
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                }
            />

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Configuration</CardTitle>
                            <CardDescription>General settings for the ERP platform</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Platform Name</Label>
                                    <Input
                                        value={settings.platform_name}
                                        onChange={(e) => handleChange('platform_name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Support Email</Label>
                                    <Input
                                        value={settings.support_email}
                                        onChange={(e) => handleChange('support_email', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>Features</Label>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">User Registration</Label>
                                        <p className="text-sm text-muted-foreground">Allow new organizations to register</p>
                                    </div>
                                    <Switch
                                        checked={settings.allow_registration}
                                        onCheckedChange={(val) => handleChange('allow_registration', val)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="maintenance">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-red-600">Maintenance Mode</CardTitle>
                            <CardDescription>Control system availability</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-red-900">Enable Maintenance Mode</Label>
                                    <p className="text-sm text-red-700">Prevents users from logging in except Super Admins</p>
                                </div>
                                <Switch
                                    checked={settings.maintenance_mode}
                                    onCheckedChange={(val) => handleChange('maintenance_mode', val)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
