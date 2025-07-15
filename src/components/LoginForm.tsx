import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Building, Mail, Lock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkEmployeeTemporaryLogin = async (userEmail: string, userPassword: string) => {
    try {
      const employeesRef = collection(db, 'employees');
      const q = query(employeesRef, where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const employeeDoc = querySnapshot.docs[0];
        const employeeData = employeeDoc.data();
        
        // Check if this is a temporary password login
        if (employeeData.temporaryPassword === userPassword && employeeData.needsPasswordReset && employeeData.userId) {
          return employeeData;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking employee temporary login:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First try normal login
      await login(email, password);
      
      // Check if employee needs password reset
      const userRole = currentUser?.role || 'company_admin';
      
      if (currentUser?.needsPasswordReset) {
        navigate('/password-reset');
        toast({
          title: 'Password Reset Required',
          description: 'Please set a new password to continue.',
        });
        return;
      }
      
      // Redirect based on role
      const roleRedirects = {
        company_admin: '/admin-dashboard',
        super_admin: '/super-dashboard',
        employee: '/employee-dashboard'
      };
      
      navigate(roleRedirects[userRole] || '/admin-dashboard');
      
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
    } catch (error: any) {
      // Handle temporary password login for employees
      if (error.message === 'TEMP_PASSWORD_LOGIN' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        const employeeData = await checkEmployeeTemporaryLogin(email, password);
        
        if (employeeData && employeeData.userId) {
          try {
            // Try to sign in with the employee's Firebase Auth account using the temporary password
            // Since the account was created with the temporary password, this should work
            await signInWithEmailAndPassword(auth, email, password);
            
            navigate('/password-reset');
            toast({
              title: 'First Time Login',
              description: 'Please set a new password to continue.',
            });
            return;
          } catch (tempLoginError) {
            console.error('Temporary login failed:', tempLoginError);
          }
        }
      }
      
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'Invalid email or password',
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
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
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

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
