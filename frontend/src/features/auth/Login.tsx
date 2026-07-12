import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useToast } from '../../hooks/use-toast';

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password';

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const login = useAuthStore(state => state.login);
  const [mode, setMode] = useState<AuthMode>('login');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forms
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema)
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema)
  });

  const forgotForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    setErrorMsg(null);
    try {
      const response = await apiClient.post('/auth/login', data);
      const responseData = response.data;
      if (responseData && responseData.data) {
        const { accessToken, user } = responseData.data;
        login(accessToken, user);
        toast({ title: 'Success', description: `Welcome back, ${user.name}!` });
        navigate('/');
      } else {
        setErrorMsg('Invalid response from server.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to sign in.');
    }
  };

  const handleSignup = async (data: z.infer<typeof signupSchema>) => {
    setErrorMsg(null);
    try {
      await apiClient.post('/auth/signup', data);
      toast({ title: 'Account Created', description: 'Please sign in with your new credentials.' });
      setMode('login');
      signupForm.reset();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create account.');
    }
  };

  const handleForgotPassword = async (data: z.infer<typeof forgotPasswordSchema>) => {
    setErrorMsg(null);
    try {
      await apiClient.post('/auth/forgot-password', data);
      toast({ 
        title: 'Reset Code Sent', 
        description: 'If the email exists, we have sent a password reset token/code.' 
      });
      setMode('reset-password');
      forgotForm.reset();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit request.');
    }
  };

  const handleResetPassword = async (data: z.infer<typeof resetPasswordSchema>) => {
    setErrorMsg(null);
    try {
      await apiClient.post('/auth/reset-password', data);
      toast({ title: 'Success', description: 'Password reset successfully. Please log in.' });
      setMode('login');
      resetForm.reset();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[400px] bg-surface border-border shadow-2xl relative overflow-hidden rounded-2xl">
        <CardHeader className="text-center pb-2 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            {mode === 'login' && 'Sign In to AssetFlow'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'forgot-password' && 'Reset Password'}
            {mode === 'reset-password' && 'Enter New Password'}
          </CardTitle>
          <p className="text-[11px] text-muted-foreground mt-1 px-4 leading-normal">
            {mode === 'login' && 'Enter your credentials below to access resources.'}
            {mode === 'signup' && 'Register now to start booking & requesting resources.'}
            {mode === 'forgot-password' && 'Provide your email address to receive a recovery token.'}
            {mode === 'reset-password' && 'Verify your security token and configure your new password.'}
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          {/* LOGIN VIEW */}
          {mode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  {...loginForm.register('email')}
                  className="bg-background border-border"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => { setErrorMsg(null); setMode('forgot-password'); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  {...loginForm.register('password')}
                  className="bg-background border-border"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-lg border border-destructive/20 font-medium text-center">
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground py-5 font-semibold text-xs shadow-md shadow-primary/10 rounded-full"
                disabled={loginForm.formState.isSubmitting}
              >
                {loginForm.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}

          {/* SIGNUP VIEW */}
          {mode === 'signup' && (
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  {...signupForm.register('name')}
                  className="bg-background border-border"
                />
                {signupForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email Address</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="name@company.com"
                  {...signupForm.register('email')}
                  className="bg-background border-border"
                />
                {signupForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="At least 6 characters"
                  {...signupForm.register('password')}
                  className="bg-background border-border"
                />
                {signupForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-lg border border-destructive/20 font-medium text-center">
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground py-5 font-semibold text-xs shadow-md shadow-primary/10 rounded-full"
                disabled={signupForm.formState.isSubmitting}
              >
                {signupForm.formState.isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {mode === 'forgot-password' && (
            <form onSubmit={forgotForm.handleSubmit(handleForgotPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Account Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="name@company.com"
                  {...forgotForm.register('email')}
                  className="bg-background border-border"
                />
                {forgotForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{forgotForm.formState.errors.email.message}</p>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-lg border border-destructive/20 font-medium text-center">
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground py-5 font-semibold text-xs shadow-md shadow-primary/10 rounded-full"
                disabled={forgotForm.formState.isSubmitting}
              >
                {forgotForm.formState.isSubmitting ? 'Sending code...' : 'Send Recovery Token'}
              </Button>
            </form>
          )}

          {/* RESET PASSWORD VIEW */}
          {mode === 'reset-password' && (
            <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-token">Security Token / Code</Label>
                <Input
                  id="reset-token"
                  type="text"
                  placeholder="Enter verification token"
                  {...resetForm.register('token')}
                  className="bg-background border-border"
                />
                {resetForm.formState.errors.token && (
                  <p className="text-xs text-destructive">{resetForm.formState.errors.token.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="At least 6 characters"
                  {...resetForm.register('newPassword')}
                  className="bg-background border-border"
                />
                {resetForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">{resetForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-lg border border-destructive/20 font-medium text-center">
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground py-5 font-semibold text-xs shadow-md shadow-primary/10 rounded-full"
                disabled={resetForm.formState.isSubmitting}
              >
                {resetForm.formState.isSubmitting ? 'Resetting password...' : 'Update Password'}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-4 pb-6">
          <Separator className="bg-border" />
          
          <div className="text-xs text-center text-muted-foreground w-full">
            {mode === 'login' && (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setErrorMsg(null); setMode('signup'); }}
                  className="text-primary hover:underline font-semibold"
                >
                  Create account
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setErrorMsg(null); setMode('login'); }}
                  className="text-primary hover:underline font-semibold"
                >
                  Sign In
                </button>
              </>
            )}
            {(mode === 'forgot-password' || mode === 'reset-password') && (
              <button
                type="button"
                onClick={() => { setErrorMsg(null); setMode('login'); }}
                className="text-primary hover:underline font-semibold"
              >
                Back to Sign In
              </button>
            )}
          </div>

          <p className="text-[10px] text-center text-muted-foreground leading-relaxed px-2">
            Authorized personnel only. Access and actions are logged under corporate information security policies. Need help? <a href="#" className="text-primary hover:underline">Contact IT Support</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
