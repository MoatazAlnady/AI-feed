import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { CalendarIcon, Eye, Pause, Play, Filter, X, TrendingUp, MousePointer, DollarSign, Target } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Promotion {
  id: string;
  content_type: string;
  content_id: string;
  content_title: string;
  budget: number;
  duration: number;
  objective: string;
  targeting_data: any;
  status: string;
  start_date: string | null;
  end_date: string | null;
  impressions: number;
  clicks: number;
  created_at: string;
  updated_at: string;
}

export function AdCampaignManager() {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [objectiveFilter, setObjectiveFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>();
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>();

  useEffect(() => {
    if (user) {
      fetchPromotions();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [promotions, statusFilter, typeFilter, objectiveFilter, startDateFilter, endDateFilter]);

  const fetchPromotions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...promotions];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.content_type === typeFilter);
    }

    if (objectiveFilter !== 'all') {
      filtered = filtered.filter(p => p.objective === objectiveFilter);
    }

    if (startDateFilter && endDateFilter) {
      filtered = filtered.filter(p => {
        if (!p.start_date) return false;
        const promoStart = parseISO(p.start_date);
        return isWithinInterval(promoStart, { start: startDateFilter, end: endDateFilter });
      });
    }

    setFilteredPromotions(filtered);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setObjectiveFilter('all');
    setStartDateFilter(undefined);
    setEndDateFilter(undefined);
  };

  const handlePauseResume = async (promotion: Promotion) => {
    const newStatus = promotion.status === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', promotion.id);

      if (error) throw error;
      
      toast.success(`Campaign ${newStatus === 'active' ? 'resumed' : 'paused'}`);
      fetchPromotions();
    } catch (error) {
      console.error('Error updating promotion:', error);
      toast.error('Failed to update campaign');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      active: { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
      completed: { variant: 'secondary', className: 'bg-muted text-muted-foreground' },
      paused: { variant: 'outline', className: 'border-yellow-500 text-yellow-600' },
      pending: { variant: 'outline', className: 'border-blue-500 text-blue-600' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>;
  };

  const getCTR = (impressions: number, clicks: number) => {
    if (impressions === 0) return '0%';
    return ((clicks / impressions) * 100).toFixed(2) + '%';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const uniqueTypes = [...new Set(promotions.map(p => p.content_type))];
  const uniqueObjectives = [...new Set(promotions.map(p => p.objective))];

  // Summary stats
  const activeCount = promotions.filter(p => p.status === 'active').length;
  const totalSpent = promotions.filter(p => p.status === 'completed' || p.status === 'active').reduce((sum, p) => sum + p.budget, 0);
  const totalImpressions = promotions.reduce((sum, p) => sum + (p.impressions || 0), 0);
  const totalClicks = promotions.reduce((sum, p) => sum + (p.clicks || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Impressions</p>
                <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
              </div>
              <MousePointer className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={objectiveFilter} onValueChange={setObjectiveFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Objective" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Objectives</SelectItem>
                {uniqueObjectives.map(obj => (
                  <SelectItem key={obj} value={obj}>{obj}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal", !startDateFilter && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDateFilter ? format(startDateFilter, 'MMM d, yyyy') : 'Start Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDateFilter} onSelect={setStartDateFilter} />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal", !endDateFilter && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDateFilter ? format(endDateFilter, 'MMM d, yyyy') : 'End Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDateFilter} onSelect={setEndDateFilter} />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns ({filteredPromotions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPromotions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No campaigns found</p>
              <p className="text-sm">Create your first promotion to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPromotions.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {promo.content_title || 'Untitled'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{promo.content_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(promo.status)}</TableCell>
                      <TableCell>{formatCurrency(promo.budget)}</TableCell>
                      <TableCell>
                        {promo.start_date && promo.end_date ? (
                          <span className="text-sm">
                            {format(parseISO(promo.start_date), 'MMM d')} - {format(parseISO(promo.end_date), 'MMM d')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{promo.duration} days</span>
                        )}
                      </TableCell>
                      <TableCell>{(promo.impressions || 0).toLocaleString()}</TableCell>
                      <TableCell>{(promo.clicks || 0).toLocaleString()}</TableCell>
                      <TableCell>{getCTR(promo.impressions || 0, promo.clicks || 0)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPromotion(promo);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(promo.status === 'active' || promo.status === 'paused') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePauseResume(promo)}
                            >
                              {promo.status === 'active' ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
            <DialogDescription>View detailed information about this campaign</DialogDescription>
          </DialogHeader>
          {selectedPromotion && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Content Title</p>
                  <p className="font-medium">{selectedPromotion.content_title || 'Untitled'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Content Type</p>
                  <Badge variant="outline">{selectedPromotion.content_type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedPromotion.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Objective</p>
                  <p className="font-medium capitalize">{selectedPromotion.objective}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">{formatCurrency(selectedPromotion.budget)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{selectedPromotion.duration} days</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Performance</h4>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Impressions</p>
                      <p className="text-xl font-bold">{(selectedPromotion.impressions || 0).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Clicks</p>
                      <p className="text-xl font-bold">{(selectedPromotion.clicks || 0).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">CTR</p>
                      <p className="text-xl font-bold">{getCTR(selectedPromotion.impressions || 0, selectedPromotion.clicks || 0)}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {selectedPromotion.targeting_data && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Targeting</h4>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(selectedPromotion.targeting_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 text-sm text-muted-foreground">
                <p>Created: {format(parseISO(selectedPromotion.created_at), 'PPP')}</p>
                {selectedPromotion.start_date && (
                  <p>Started: {format(parseISO(selectedPromotion.start_date), 'PPP')}</p>
                )}
                {selectedPromotion.end_date && (
                  <p>Ends: {format(parseISO(selectedPromotion.end_date), 'PPP')}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
