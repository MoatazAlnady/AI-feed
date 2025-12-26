import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO, subDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { CalendarIcon, TrendingUp, MousePointer, DollarSign, Target, BarChart3, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

interface Promotion {
  id: string;
  content_type: string;
  content_title: string;
  budget: number;
  objective: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  impressions: number;
  clicks: number;
  created_at: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AdAnalytics() {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all' | 'custom'>('30d');
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [objectiveFilter, setObjectiveFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchPromotions();
    }
  }, [user]);

  useEffect(() => {
    switch (dateRange) {
      case '7d':
        setStartDate(subDays(new Date(), 7));
        setEndDate(new Date());
        break;
      case '30d':
        setStartDate(subDays(new Date(), 30));
        setEndDate(new Date());
        break;
      case '90d':
        setStartDate(subDays(new Date(), 90));
        setEndDate(new Date());
        break;
      case 'all':
        setStartDate(undefined);
        setEndDate(undefined);
        break;
    }
  }, [dateRange]);

  const fetchPromotions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('id, content_type, content_title, budget, objective, status, start_date, end_date, impressions, clicks, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPromotions = useMemo(() => {
    let filtered = [...promotions];

    if (objectiveFilter !== 'all') {
      filtered = filtered.filter(p => p.objective === objectiveFilter);
    }

    if (startDate && endDate) {
      filtered = filtered.filter(p => {
        const promoDate = parseISO(p.created_at);
        return isAfter(promoDate, startOfDay(startDate)) && isBefore(promoDate, endOfDay(endDate));
      });
    }

    return filtered;
  }, [promotions, objectiveFilter, startDate, endDate]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const completed = filteredPromotions.filter(p => p.status === 'completed' || p.status === 'active');
    const totalSpend = completed.reduce((sum, p) => sum + p.budget, 0);
    const totalImpressions = filteredPromotions.reduce((sum, p) => sum + (p.impressions || 0), 0);
    const totalClicks = filteredPromotions.reduce((sum, p) => sum + (p.clicks || 0), 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const avgCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

    return {
      totalCampaigns: filteredPromotions.length,
      totalSpend,
      totalImpressions,
      totalClicks,
      avgCTR,
      avgCPC,
      avgCPM,
    };
  }, [filteredPromotions]);

  // Chart data - Performance by objective
  const objectiveData = useMemo(() => {
    const grouped = filteredPromotions.reduce((acc, p) => {
      const key = p.objective || 'other';
      if (!acc[key]) {
        acc[key] = { objective: key, impressions: 0, clicks: 0, spend: 0, count: 0 };
      }
      acc[key].impressions += p.impressions || 0;
      acc[key].clicks += p.clicks || 0;
      acc[key].spend += p.budget;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  }, [filteredPromotions]);

  // Chart data - Performance by content type
  const typeData = useMemo(() => {
    const grouped = filteredPromotions.reduce((acc, p) => {
      const key = p.content_type || 'other';
      if (!acc[key]) {
        acc[key] = { type: key, impressions: 0, clicks: 0, spend: 0 };
      }
      acc[key].impressions += p.impressions || 0;
      acc[key].clicks += p.clicks || 0;
      acc[key].spend += p.budget;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  }, [filteredPromotions]);

  // Top performing campaigns
  const topCampaigns = useMemo(() => {
    return [...filteredPromotions]
      .filter(p => p.impressions > 0)
      .map(p => ({
        ...p,
        ctr: (p.clicks / p.impressions) * 100,
      }))
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, 5);
  }, [filteredPromotions]);

  const uniqueObjectives = [...new Set(promotions.map(p => p.objective).filter(Boolean))];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            {dateRange === 'custom' && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[150px] justify-start", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'MMM d, yyyy') : 'Start'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[150px] justify-start", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'MMM d, yyyy') : 'End'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                  </PopoverContent>
                </Popover>
              </>
            )}

            <Select value={objectiveFilter} onValueChange={setObjectiveFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Objective" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Objectives</SelectItem>
                {uniqueObjectives.map(obj => (
                  <SelectItem key={obj} value={obj}>{obj}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs">Campaigns</span>
              </div>
              <p className="text-2xl font-bold">{metrics.totalCampaigns}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Total Spend</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(metrics.totalSpend)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Impressions</span>
              </div>
              <p className="text-2xl font-bold">{metrics.totalImpressions.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MousePointer className="h-4 w-4" />
                <span className="text-xs">Clicks</span>
              </div>
              <p className="text-2xl font-bold">{metrics.totalClicks.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Percent className="h-4 w-4" />
                <span className="text-xs">Avg CTR</span>
              </div>
              <p className="text-2xl font-bold">{metrics.avgCTR.toFixed(2)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Avg CPC</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(metrics.avgCPC)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs">Avg CPM</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(metrics.avgCPM)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Objective */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance by Objective</CardTitle>
          </CardHeader>
          <CardContent>
            {objectiveData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={objectiveData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="objective" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="impressions" fill="hsl(var(--primary))" name="Impressions" />
                  <Bar dataKey="clicks" fill="hsl(var(--chart-2))" name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spend by Content Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spend by Content Type</CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeData}
                    dataKey="spend"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ type, spend }) => `${type}: ${formatCurrency(spend)}`}
                  >
                    {typeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Performing Campaigns (by CTR)</CardTitle>
        </CardHeader>
        <CardContent>
          {topCampaigns.length > 0 ? (
            <div className="space-y-4">
              {topCampaigns.map((campaign, index) => (
                <div key={campaign.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{campaign.content_title || 'Untitled'}</p>
                    <p className="text-sm text-muted-foreground">{campaign.content_type} • {campaign.objective}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{campaign.ctr.toFixed(2)}% CTR</p>
                    <p className="text-sm text-muted-foreground">{campaign.clicks} / {campaign.impressions}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No campaigns with performance data yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
