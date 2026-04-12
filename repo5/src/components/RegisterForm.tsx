
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Building, Mail, Lock, UserCheck } from 'lucide-react';

const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(false);
  const { register, currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await register(email, password, selectedRole);
      
      // Redirect based on selected role
      const roleRedirects = {
        client: '/client-dashboard',
        company_admin: '/admin-dashboard',
        super_admin: '/super-dashboard'
      };
      
      navigate(roleRedirects[selectedRole]);
      
      toast({
        title: 'Registration Successful',
        description: `Welcome to InvoiceApp! You are registered as ${selectedRole.replace('_', ' ')}`,
      });
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'An error occurred during registration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Sign up and select your role</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Select Role</Label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="company_admin">Company Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-sm text-amber-700">
                <strong>Role Information:</strong>
                <br />
                • <strong>Client:</strong> View and manage your invoices
                <br />
                • <strong>Company Admin:</strong> Full invoice and client management
                <br />
                • <strong>Super Admin:</strong> Must be assigned manually via Firebase console
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Creating account...' : `Create ${selectedRole.replace('_', ' ')} Account`}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterForm;
