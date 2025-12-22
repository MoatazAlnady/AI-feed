import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Ticket, Copy, Trash2, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_uses: number;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

interface Redemption {
  id: string;
  user_id: string;
  redeemed_at: string;
  premium_granted_until: string;
  user_profiles?: {
    full_name: string | null;
    id: string;
  };
}

export function PromoCodesManagement() {
  const { user } = useAuth();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRedemptionsModalOpen, setIsRedemptionsModalOpen] = useState(false);
  const [selectedCodeId, setSelectedCodeId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state for new promo code
  const [newCode, setNewCode] = useState({
    code: '',
    description: '',
    discount_type: 'free_year',
    discount_value: 12,
    max_uses: 1,
    valid_until: ''
  });

  const fetchPromoCodes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes((data as unknown as PromoCode[]) || []);
    } catch (error: any) {
      console.error('Error fetching promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRedemptions = async (codeId: string) => {
    try {
      const { data, error } = await supabase
        .from('promo_code_redemptions')
        .select(`
          id,
          user_id,
          redeemed_at,
          premium_granted_until
        `)
        .eq('promo_code_id', codeId)
        .order('redeemed_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately
      const userIds = (data || []).map(r => r.user_id);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        const redemptionsWithProfiles = (data || []).map(r => ({
          ...r,
          user_profiles: profileMap.get(r.user_id)
        }));
        setRedemptions(redemptionsWithProfiles as Redemption[]);
      } else {
        setRedemptions([]);
      }
    } catch (error: any) {
      console.error('Error fetching redemptions:', error);
      toast.error('Failed to load redemptions');
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const handleCreateCode = async () => {
    if (!newCode.code.trim()) {
      toast.error('Promo code is required');
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('promo_codes')
        .insert({
          code: newCode.code.trim().toUpperCase(),
          description: newCode.description || null,
          discount_type: newCode.discount_type,
          discount_value: newCode.discount_value,
          max_uses: newCode.max_uses,
          valid_until: newCode.valid_until || null,
          created_by: user?.id
        });

      if (error) throw error;

      toast.success('Promo code created successfully');
      setIsCreateModalOpen(false);
      setNewCode({
        code: '',
        description: '',
        discount_type: 'free_year',
        discount_value: 12,
        max_uses: 1,
        valid_until: ''
      });
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error creating promo code:', error);
      if (error.code === '23505') {
        toast.error('A promo code with this name already exists');
      } else {
        toast.error('Failed to create promo code');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (code: PromoCode) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !code.is_active })
        .eq('id', code.id);

      if (error) throw error;

      toast.success(`Promo code ${code.is_active ? 'deactivated' : 'activated'}`);
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error toggling promo code:', error);
      toast.error('Failed to update promo code');
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;

      toast.success('Promo code deleted');
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error deleting promo code:', error);
      toast.error('Failed to delete promo code');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(prev => ({ ...prev, code: result }));
  };

  const viewRedemptions = (codeId: string) => {
    setSelectedCodeId(codeId);
    fetchRedemptions(codeId);
    setIsRedemptionsModalOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Promo Codes
          </CardTitle>
          <CardDescription>Manage promotional codes for premium subscriptions</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPromoCodes} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Code
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : promoCodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No promo codes found. Create your first code to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-semibold">{code.code}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(code.code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {code.description && (
                      <p className="text-xs text-muted-foreground mt-1">{code.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {code.discount_type === 'free_year' ? `${code.discount_value} months free` : code.discount_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={code.current_uses >= code.max_uses ? 'text-destructive' : ''}>
                      {code.current_uses} / {code.max_uses}
                    </span>
                  </TableCell>
                  <TableCell>
                    {code.valid_until 
                      ? format(new Date(code.valid_until), 'MMM d, yyyy')
                      : 'No expiry'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={code.is_active ? 'default' : 'outline'}>
                      {code.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => viewRedemptions(code.id)}
                        title="View redemptions"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(code)}
                      >
                        {code.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteCode(code.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create Promo Code Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Promo Code</DialogTitle>
            <DialogDescription>
              Create a promotional code for premium subscriptions
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={newCode.code}
                  onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., FREEYEAR2024"
                  className="uppercase"
                />
                <Button variant="outline" onClick={generateRandomCode}>
                  Generate
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newCode.description}
                onChange={(e) => setNewCode(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Internal note about this code"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="discount_type">Type</Label>
                <Select
                  value={newCode.discount_type}
                  onValueChange={(value) => setNewCode(prev => ({ ...prev, discount_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free_year">Free Months</SelectItem>
                    <SelectItem value="free_months">Free Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discount_value">Months</Label>
                <Input
                  id="discount_value"
                  type="number"
                  min={1}
                  max={24}
                  value={newCode.discount_value}
                  onChange={(e) => setNewCode(prev => ({ ...prev, discount_value: parseInt(e.target.value) || 12 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="max_uses">Max Uses</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min={1}
                  value={newCode.max_uses}
                  onChange={(e) => setNewCode(prev => ({ ...prev, max_uses: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="valid_until">Valid Until (optional)</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={newCode.valid_until}
                  onChange={(e) => setNewCode(prev => ({ ...prev, valid_until: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCode} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redemptions Modal */}
      <Dialog open={isRedemptionsModalOpen} onOpenChange={setIsRedemptionsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Redemption History</DialogTitle>
            <DialogDescription>
              Users who have redeemed this promo code
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {redemptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No redemptions yet for this code.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Redeemed At</TableHead>
                    <TableHead>Premium Until</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptions.map((redemption) => (
                    <TableRow key={redemption.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {redemption.user_profiles?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {redemption.user_id.slice(0, 8)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(redemption.redeemed_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(redemption.premium_granted_until), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsRedemptionsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
