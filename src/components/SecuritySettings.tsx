import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';

const SecuritySettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    if (!confirm('This will sign you out of all devices. Continue?')) return;

    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "Signed out of all devices successfully",
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign out of all devices",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={passwords.currentPassword}
                onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwords.newPassword}
                onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <Button 
            onClick={handlePasswordChange} 
            disabled={loading || !passwords.newPassword || !passwords.confirmPassword}
            className="w-full"
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Security
          </CardTitle>
          <CardDescription>
            Manage your account security and active sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="space-y-1">
              <h4 className="font-medium">Sign Out All Devices</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This will sign you out of all devices and browsers. You'll need to sign in again.
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOutAllDevices}>
              Sign Out All
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="space-y-1">
              <h4 className="font-medium">Account Email</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
            <Button variant="outline" disabled>
              Verified
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;