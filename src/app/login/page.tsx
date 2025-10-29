'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'admin'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.login(formData.email, formData.password, formData.role);
      
      login(response.user);
      
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login gagal. Silakan cek kredensial Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-950">
      <Card className="w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
            <Briefcase className="h-8 w-8 text-white dark:text-black" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Welcome
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Sign in to your Hiring App account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 animate-in slide-in-from-top">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={isLoading}
                className="h-11 transition-all focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="h-11 pr-10 transition-all focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => handleInputChange('role', value)}
                disabled={isLoading}
              >
                <SelectTrigger className="h-11 transition-all focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="applicant">Applicant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </Button>

            <div className="text-xs text-center text-muted-foreground pt-4 space-y-2 border-t border-gray-200 dark:border-gray-700">
              <p className="font-medium text-gray-600 dark:text-gray-400">Demo credentials:</p>
              <div className="space-y-1">
                <p className="font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                  admin@hiringapp.com / 123456 <span className="text-gray-700 dark:text-gray-300">(admin)</span>
                </p>
                <p className="font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                  applicant@hiringapp.com / 123456 <span className="text-gray-700 dark:text-gray-300">(applicant)</span>
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}