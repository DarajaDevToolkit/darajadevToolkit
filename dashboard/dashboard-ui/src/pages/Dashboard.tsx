
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LogOut, Copy, Trash2, Plus, Eye, EyeOff, Webhook } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API',
      key: 'pk_live_1234567890abcdef',
      createdAt: '2024-01-15',
      lastUsed: '2024-01-20',
    },
    {
      id: '2',
      name: 'Development API',
      key: 'pk_test_abcdef1234567890',
      createdAt: '2024-01-10',
    },
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [showKeys, setShowKeys] = useState<{[key: string]: boolean}>({});
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const generateApiKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the API key",
        variant: "destructive",
      });
      return;
    }

    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `pk_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
    toast({
      title: "Success",
      description: "API key generated successfully",
    });
  };

  const deleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
    toast({
      title: "Success",
      description: "API key deleted successfully",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const maskKey = (key: string) => {
    return key.substring(0, 8) + '••••••••••••' + key.substring(key.length - 4);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Daraja Dev Toolkit</h1>
            <p className="text-green-100">Welcome back, {user?.name}</p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/webhooks')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Webhook className="mr-2 h-4 w-4" />
              Webhooks
            </Button>
            <Button 
              variant="outline" 
              onClick={logout}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="api-keys" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10 border-white/20">
            <TabsTrigger value="api-keys" className="text-white data-[state=active]:bg-white/20">
              API Keys
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-white data-[state=active]:bg-white/20">
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys">
            <div className="grid gap-6">
              {/* Create API Key */}
              <Card className="backdrop-blur-sm bg-white/95 border-green-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-green-800">Create New API Key</CardTitle>
                  <CardDescription className="text-green-600">
                    Generate a new API key for your M-Pesa applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="key-name" className="text-green-800">Key Name</Label>
                      <Input
                        id="key-name"
                        placeholder="e.g., Production API"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={generateApiKey}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Generate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* API Keys List */}
              <Card className="backdrop-blur-sm bg-white/95 border-green-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-green-800">Your API Keys</CardTitle>
                  <CardDescription className="text-green-600">
                    Manage your API keys and monitor usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {apiKeys.map((apiKey) => (
                      <div 
                        key={apiKey.id} 
                        className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-green-800">{apiKey.name}</h3>
                            <Badge variant="secondary" className="bg-green-600 text-white">
                              {apiKey.key.startsWith('pk_live') ? 'Live' : 'Test'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <code className="text-sm text-green-700 font-mono bg-green-100 px-2 py-1 rounded">
                              {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleKeyVisibility(apiKey.id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(apiKey.key)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-sm text-green-600">
                            Created: {apiKey.createdAt}
                            {apiKey.lastUsed && ` • Last used: ${apiKey.lastUsed}`}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteApiKey(apiKey.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="backdrop-blur-sm bg-white/95 border-green-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-green-800">Profile Settings</CardTitle>
                <CardDescription className="text-green-600">
                  Manage your account information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name" className="text-green-800">Full Name</Label>
                    <Input
                      id="profile-name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email" className="text-green-800">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-green-800">Account Details</Label>
                    <div className="text-sm text-green-600 space-y-1">
                      <p>Account ID: {user?.id}</p>
                      <p>Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  <Button 
                    type="button"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      toast({
                        title: "Success",
                        description: "Profile updated successfully",
                      });
                    }}
                  >
                    Update Profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
