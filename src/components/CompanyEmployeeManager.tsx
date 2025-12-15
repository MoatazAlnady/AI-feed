import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, UserPlus, Users, Shield, User } from 'lucide-react';
import { format } from 'date-fns';
import CompanyInvitationModal from './CompanyInvitationModal';

interface Employee {
  id: string;
  user_id: string;
  role: 'admin' | 'employee';
  joined_at: string | null;
  user_profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
}

interface CompanyEmployeeManagerProps {
  companyPageId: string;
  companyName: string;
  maxEmployees: number;
  isAdmin: boolean;
  hasActiveSubscription: boolean;
}

const CompanyEmployeeManager = ({
  companyPageId,
  companyName,
  maxEmployees,
  isAdmin,
  hasActiveSubscription,
}: CompanyEmployeeManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('company_employees')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          user_profiles (
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('company_page_id', companyPageId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setEmployees((data as unknown as Employee[]) || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employees',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyPageId) {
      fetchEmployees();
    }
  }, [companyPageId]);

  const handleRoleChange = async (employeeId: string, newRole: 'admin' | 'employee') => {
    try {
      const { error } = await supabase
        .from('company_employees')
        .update({ role: newRole })
        .eq('id', employeeId);

      if (error) throw error;

      setEmployees(prev =>
        prev.map(emp =>
          emp.id === employeeId ? { ...emp, role: newRole } : emp
        )
      );

      toast({
        title: 'Role updated',
        description: `Employee role changed to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveEmployee = async (employeeId: string, employeeName: string) => {
    try {
      const { error } = await supabase
        .from('company_employees')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));

      toast({
        title: 'Employee removed',
        description: `${employeeName} has been removed from the company`,
      });
    } catch (error) {
      console.error('Error removing employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove employee',
        variant: 'destructive',
      });
    }
  };

  const canInvite = isAdmin && hasActiveSubscription && employees.length < maxEmployees;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              {employees.length} / {maxEmployees} employees
            </CardDescription>
          </div>
          {canInvite && (
            <Button onClick={() => setInviteModalOpen(true)} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {employees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No team members yet</p>
            {canInvite && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setInviteModalOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite your first team member
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {employees.map(employee => {
              const isSelf = employee.user_id === user?.id;
              const profile = employee.user_profiles;
              const initials = profile?.full_name
                ?.split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase() || '?';

              return (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {profile?.full_name || 'Unknown User'}
                        </span>
                        {isSelf && (
                          <Badge variant="secondary" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {profile?.email}
                      </div>
                      {employee.joined_at && (
                        <div className="text-xs text-muted-foreground">
                          Joined {format(new Date(employee.joined_at), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && !isSelf ? (
                      <>
                        <Select
                          value={employee.role}
                          onValueChange={(value: 'admin' | 'employee') =>
                            handleRoleChange(employee.id, value)
                          }
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="h-3 w-3" />
                                Admin
                              </div>
                            </SelectItem>
                            <SelectItem value="employee">
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                Employee
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove {profile?.full_name || 'this user'} from{' '}
                                {companyName}. They will lose access to company resources.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleRemoveEmployee(
                                    employee.id,
                                    profile?.full_name || 'User'
                                  )
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'}>
                        {employee.role === 'admin' ? (
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Employee
                          </span>
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!hasActiveSubscription && (
          <div className="mt-4 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
            Upgrade your subscription to invite more team members.
          </div>
        )}
      </CardContent>

      <CompanyInvitationModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        companyPageId={companyPageId}
        companyName={companyName}
        currentEmployeeCount={employees.length}
        maxEmployees={maxEmployees}
        onInviteSent={fetchEmployees}
      />
    </Card>
  );
};

export default CompanyEmployeeManager;
