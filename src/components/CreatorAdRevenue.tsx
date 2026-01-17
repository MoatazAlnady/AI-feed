import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DollarSign, Eye, MousePointer, TrendingUp, Calendar, Info, BarChart3, AlertCircle } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

// Revenue split constants
const CREATOR_SHARE = 0.70; // 70% to creator
const PLATFORM_SHARE = 0.30; // 30% to platform

// Estimated CPM rates (will be replaced with actual AdSense data)
const ESTIMATED_CPM = {
  display: 2.50,
  'in-feed': 3.00,
  'in-article': 4.00,
  video: 10.00,
};

interface ContentPerformance {
  id: string;
  title: string;
  type: string;
  impressions: number;
  clicks: number;
  estimatedRevenue: number;
}

interface DailyEarning {
  date: string;
  impressions: number;
  revenue: number;
}

export default function CreatorAdRevenue() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [totalImpressions, setTotalImpressions] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [grossRevenue, setGrossRevenue] = useState(0);
  const [creatorEarnings, setCreatorEarnings] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(0);
  
  // Chart data
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarning[]>([]);
  const [contentPerformance, setContentPerformance] = useState<ContentPerformance[]>([]);

  useEffect(() => {
    if (user) {
      fetchAdRevenue();
    }
  }, [user, dateRange]);

  const getDateRange = () => {
    const end = new Date();
    let start: Date;
    
    switch (dateRange) {
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case '90d':
        start = subDays(end, 90);
        break;
      case 'month':
        start = startOfMonth(end);
        break;
      default:
        start = subDays(end, 30);
    }
    
    return { start, end };
  };

  const fetchAdRevenue = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      // Try to fetch real data from content_ad_impressions table
      const { data: adData, error } = await supabase
        .from('content_ad_impressions')
        .select('*')
        .eq('creator_id', user.id)
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error || !adData || adData.length === 0) {
        // Generate sample data for preview mode
        generateSampleData(start, end);
        return;
      }

      // Process real data
      let runningImpressions = 0;
      let runningClicks = 0;
      let runningRevenue = 0;

      const dailyMap = new Map<string, DailyEarning>();
      
      adData.forEach(record => {
        runningImpressions += record.impression_count || 0;
        runningClicks += record.click_count || 0;
        runningRevenue += record.estimated_revenue || 0;

        const existing = dailyMap.get(record.date) || { date: format(new Date(record.date), 'MMM d'), impressions: 0, revenue: 0 };
        existing.impressions += record.impression_count || 0;
        existing.revenue += record.estimated_revenue || 0;
        dailyMap.set(record.date, existing);
      });

      const creatorShare = runningRevenue * CREATOR_SHARE;

      setTotalImpressions(runningImpressions);
      setTotalClicks(runningClicks);
      setGrossRevenue(runningRevenue);
      setCreatorEarnings(creatorShare);
      setPendingPayout(creatorShare * 0.8);
      setDailyEarnings(Array.from(dailyMap.values()));
      
    } catch (error) {
      console.error('Error fetching ad revenue:', error);
      generateSampleData(getDateRange().start, getDateRange().end);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = (start: Date, end: Date) => {
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const sampleDailyEarnings: DailyEarning[] = [];
    let runningImpressions = 0;
    let runningRevenue = 0;
    
    for (let i = 0; i < days; i++) {
      const date = subDays(end, days - i - 1);
      const impressions = Math.floor(Math.random() * 500) + 100;
      const avgCpm = (ESTIMATED_CPM.display + ESTIMATED_CPM['in-feed']) / 2;
      const revenue = (impressions / 1000) * avgCpm;
      
      runningImpressions += impressions;
      runningRevenue += revenue;
      
      sampleDailyEarnings.push({
        date: format(date, 'MMM d'),
        impressions,
        revenue: parseFloat(revenue.toFixed(2)),
      });
    }
    
    const sampleContent: ContentPerformance[] = [
      { id: '1', title: 'How AI is Changing the World', type: 'article', impressions: 2500, clicks: 125, estimatedRevenue: 10.00 },
      { id: '2', title: 'Top 10 AI Tools for Productivity', type: 'article', impressions: 1800, clicks: 90, estimatedRevenue: 7.20 },
      { id: '3', title: 'AI Tutorial: Getting Started', type: 'video', impressions: 3200, clicks: 160, estimatedRevenue: 32.00 },
      { id: '4', title: 'Weekly Tech Update', type: 'post', impressions: 950, clicks: 48, estimatedRevenue: 2.85 },
      { id: '5', title: 'New AI Model Announcement', type: 'post', impressions: 1200, clicks: 60, estimatedRevenue: 3.60 },
    ];
    
    const totalRev = runningRevenue;
    const creatorShare = totalRev * CREATOR_SHARE;
    
    setTotalImpressions(runningImpressions);
    setTotalClicks(Math.floor(runningImpressions * 0.05));
    setGrossRevenue(totalRev);
    setCreatorEarnings(creatorShare);
    setPendingPayout(creatorShare * 0.8);
    setDailyEarnings(sampleDailyEarnings);
    setContentPerformance(sampleContent);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-500" />
            Ad Revenue
          </h2>
          <p className="text-muted-foreground">
            Earn 70% from ads on your content. Ads on public feeds go to the platform.
          </p>
        </div>
        
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="month">This month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Preview Mode Banner */}
      <Alert className="bg-amber-500/10 border-amber-500/20">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">Preview Mode</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          Ad revenue tracking is currently showing estimated data. Full Google AdSense integration will provide real-time metrics once your content reaches the monetization threshold.
        </AlertDescription>
      </Alert>

      {/* Revenue Info Banner */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-2 text-sm">
            <Info className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-green-800 dark:text-green-200">
              <p className="mb-1">
                You receive <strong>70%</strong> of all ad revenue from ads displayed on <strong>your content</strong> (articles, posts, videos).
              </p>
              <p className="text-xs opacity-80">
                Note: Ads shown on public areas (main feed, category pages, search results) generate 100% platform revenue.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm">Impressions</span>
            </div>
            <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MousePointer className="h-4 w-4" />
              <span className="text-sm">Clicks</span>
            </div>
            <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0}% CTR
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm">Gross Revenue</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(grossRevenue)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Your Earnings (70%)</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(creatorEarnings)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Pending Payout</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(pendingPayout)}</p>
            <Badge variant="outline" className="mt-1 text-xs">
              Threshold: $50
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyEarnings}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Impressions Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyEarnings}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), 'Impressions']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="impressions" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Est. Revenue</TableHead>
                <TableHead className="text-right">Your Share (70%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contentPerformance.map((content) => (
                <TableRow key={content.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {content.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {content.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {content.impressions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {content.clicks.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {((content.clicks / content.impressions) * 100).toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(content.estimatedRevenue)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(content.estimatedRevenue * CREATOR_SHARE)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CPM Rates Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            Estimated CPM Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(ESTIMATED_CPM).map(([type, cpm]) => (
              <div key={type} className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground capitalize">{type} Ads</p>
                <p className="text-xl font-bold">${cpm.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">per 1,000 views</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            * CPM rates are estimates and may vary based on audience, location, and ad demand. 
            Actual rates will be calculated from Google AdSense data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}