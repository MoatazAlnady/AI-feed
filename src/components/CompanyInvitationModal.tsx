import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Mail, Shield, User, Check, AlertCircle } from 'lucide-react';

interface CompanyInvitationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyPageId: string;
  companyName: string;
  currentEmployeeCount: number;
  maxEmployees: number;
  onInviteSent?: () => void;
}

const CompanyInvitationModal = ({
  open,
  onOpenChange,
  companyPageId,
  companyName,
  currentEmployeeCount,
  maxEmployees,
  onInviteSent,
}: CompanyInvitationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const remainingSlots = maxEmployees - currentEmployeeCount;
  const canInvite = remainingSlots > 0;

  const generateToken = () => {
    return crypto.randomUUID();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canInvite) {
      toast({
        title: 'Limit reached',
        description: `You've reached the maximum of ${maxEmployees} employees. Upgrade to add more.`,
        variant: 'destructive',
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Check if invitation already exists for this email
      const { data: existingInvite } = await supabase
        .from('company_invitations')
        .select('id, status')
        .eq('company_page_id', companyPageId)
        .eq('email', email.trim().toLowerCase())
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        toast({
          title: 'Invitation exists',
          description: 'An invitation has already been sent to this email',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Check if user is already an employee
      const { data: existingEmployee } = await supabase
        .from('company_employees')
        .select(`
          id,
          user_profiles!inner (email)
        `)
        .eq('company_page_id', companyPageId);

      const isAlreadyEmployee = existingEmployee?.some(
        (emp: any) => emp.user_profiles?.email?.toLowerCase() === email.trim().toLowerCase()
      );

      if (isAlreadyEmployee) {
        toast({
          title: 'Already a member',
          description: 'This person is already a team member',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      const { error } = await supabase.from('company_invitations').insert({
        company_page_id: companyPageId,
        email: email.trim().toLowerCase(),
        token,
        role,
        invited_by: user?.id,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      });

      if (error) throw error;

      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);

      toast({
        title: 'Invitation created',
        description: 'Share the link with the invitee',
      });

      onInviteSent?.();
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invitation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Invitation link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('employee');
    setInviteLink(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Invite someone to join {companyName}. They'll receive a link to join.
          </DialogDescription>
        </DialogHeader>

        {!canInvite && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You've reached the maximum of {maxEmployees} team members. Upgrade
              your plan to invite more.
            </AlertDescription>
          </Alert>
        )}

        {inviteLink ? (
          <div className="space-y-4">
            <Alert>
              <Check className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Invitation created! Share this link with {email}:
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Input
                value={inviteLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              This link expires in 7 days.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
              <Button
                onClick={() => {
                  setEmail('');
                  setInviteLink(null);
                }}
              >
                Invite Another
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={!canInvite || loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value: 'admin' | 'employee') => setRole(value)}
                disabled={!canInvite || loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <div>Employee</div>
                        <div className="text-xs text-muted-foreground">
                          Can access company resources
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <div>Admin</div>
                        <div className="text-xs text-muted-foreground">
                          Can manage team and settings
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              {remainingSlots} invitation{remainingSlots !== 1 ? 's' : ''} remaining
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!canInvite || loading}>
                {loading ? 'Creating...' : 'Create Invitation'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompanyInvitationModal;
