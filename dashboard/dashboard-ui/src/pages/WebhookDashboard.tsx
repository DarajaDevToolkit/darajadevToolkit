
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, ArrowLeft, RefreshCw, Filter, Search, Plus, Settings, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WebhookEvent {
  id: string;
  endpoint: string;
  method: string;
  status: 'success' | 'failed' | 'pending' | 'retry';
  timestamp: string;
  responseTime: number;
  payload: any;
  response: any;
  attempts: number;
  environment: 'sandbox' | 'production';
}

const WebhookDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([
    {
      id: '1',
      endpoint: '/api/webhooks/payment',
      method: 'POST',
      status: 'success',
      timestamp: '2024-01-20T10:30:00Z',
      responseTime: 120,
      payload: { transactionId: 'TXN123', amount: 1000 },
      response: { status: 'confirmed' },
      attempts: 1,
      environment: 'production'
    },
    {
      id: '2',
      endpoint: '/api/webhooks/payment',
      method: 'POST',
      status: 'failed',
      timestamp: '2024-01-20T10:25:00Z',
      responseTime: 5000,
      payload: { transactionId: 'TXN124', amount: 500 },
      response: { error: 'Connection timeout' },
      attempts: 3,
      environment: 'sandbox'
    },
    {
      id: '3',
      endpoint: '/api/webhooks/confirmation',
      method: 'POST',
      status: 'pending',
      timestamp: '2024-01-20T10:20:00Z',
      responseTime: 0,
      payload: { transactionId: 'TXN125', amount: 2000 },
      response: null,
      attempts: 0,
      environment: 'production'
    },
  ]);

  const [filteredEvents, setFilteredEvents] = useState<WebhookEvent[]>(webhookEvents);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const filtered = webhookEvents.filter(event => {
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      const matchesEnvironment = environmentFilter === 'all' || event.environment === environmentFilter;
      const matchesSearch = searchTerm === '' || 
        event.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesEnvironment && matchesSearch;
    });
    
    setFilteredEvents(filtered);
  }, [webhookEvents, statusFilter, environmentFilter, searchTerm]);

  const refreshData = async () => {
    setIsRefreshing(true);
    console.log('Refreshing webhook data...');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'retry':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      retry: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants]} border`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getEnvironmentBadge = (environment: string) => {
    return (
      <Badge variant={environment === 'production' ? 'default' : 'secondary'} 
             className={environment === 'production' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'}>
        {environment === 'production' ? 'Production' : 'Sandbox'}
      </Badge>
    );
  };

  const stats = {
    total: webhookEvents.length,
    success: webhookEvents.filter(e => e.status === 'success').length,
    failed: webhookEvents.filter(e => e.status === 'failed').length,
    pending: webhookEvents.filter(e => e.status === 'pending').length,
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Webhook Monitor</h1>
              <p className="text-green-100">Real-time M-Pesa webhook monitoring</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={isRefreshing}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="backdrop-blur-sm bg-white/95 border-green-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Total Events</p>
                  <p className="text-2xl font-bold text-green-800">{stats.total}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/95 border-green-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Successful</p>
                  <p className="text-2xl font-bold text-green-800">{stats.success}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/95 border-green-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Failed</p>
                  <p className="text-2xl font-bold text-green-800">{stats.failed}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/95 border-green-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-green-800">{stats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="backdrop-blur-sm bg-white/95 border-green-200 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-green-800">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-green-800">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-green-600" />
                  <Input
                    placeholder="Search endpoints..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 border-green-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-green-800">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-green-300 focus:border-green-500 focus:ring-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="retry">Retry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-green-800">Environment</Label>
                <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
                  <SelectTrigger className="border-green-300 focus:border-green-500 focus:ring-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Environments</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStatusFilter('all');
                    setEnvironmentFilter('all');
                    setSearchTerm('');
                  }}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Events */}
        <Card className="backdrop-blur-sm bg-white/95 border-green-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-green-800">Recent Webhook Events</CardTitle>
            <CardDescription className="text-green-600">
              Monitor your M-Pesa webhook deliveries in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-green-600">No webhook events found matching your filters.</p>
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(event.status)}
                        <span className="font-semibold text-green-800">{event.endpoint}</span>
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          {event.method}
                        </Badge>
                        {getStatusBadge(event.status)}
                        {getEnvironmentBadge(event.environment)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-green-600">
                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                        <span>Response time: {event.responseTime}ms</span>
                        <span>Attempts: {event.attempts}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-800"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WebhookDashboard;
