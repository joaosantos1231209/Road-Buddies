import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { signInWithEmail, registerWithEmail } from '../lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
// Google authentication temporarily disabled
// import { FaGoogle } from 'react-icons/fa';
import { APP_NAME, APP_DESCRIPTION } from '../lib/constants';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handleGoogleLogin = async () => {
    try {
      setIsProcessing(true);
      
      // Show toast notification about redirect
      toast({
        title: 'Google Authentication',
        description: 'Redirecting to Google for authentication...',
      });
      
      // Initiate Google login process
      console.log('Starting Google login process from login page');
      await login();
      
      // The user will be redirected to Google for authentication
      // When they return, the handleRedirectResult in AuthContext will process the result
      // Navigation will happen automatically via the useEffect when auth state changes
    } catch (error) {
      console.error('Google login failed:', error);
      toast({
        title: 'Login Failed',
        description: 'Unable to sign in with Google. Please try another method.',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and password',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsProcessing(true);
      await signInWithEmail(loginEmail, loginPassword);
      // Navigation will happen automatically via the useEffect when auth state changes
    } catch (error: any) {
      console.error('Email login failed:', error);
      let errorMessage = 'Invalid email or password';
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please register first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later or reset your password.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail || !registerPassword) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsProcessing(true);
      await registerWithEmail(registerEmail, registerPassword);
      toast({
        title: 'Success',
        description: 'Your account has been created!',
      });
      // Navigation will happen automatically via the useEffect when auth state changes
    } catch (error: any) {
      console.error('Registration failed:', error);
      let errorMessage = 'Unable to create your account';
      
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password sign-up is not enabled. Please ask the administrator to enable it in Firebase console.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please try logging in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {APP_NAME}
          </CardTitle>
          <CardDescription>
            {APP_DESCRIPTION}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              {/* Google authentication temporarily disabled
              <div className="mb-4">
                <Button 
                  type="button" 
                  className="w-full flex items-center justify-center gap-2" 
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={isProcessing}
                >
                  <FaGoogle className="h-4 w-4" />
                  <span>{isProcessing ? 'Signing in...' : 'Sign in with Google'}</span>
                </Button>
              </div>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-xs text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
              */}
              
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your@email.com" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Logging in...' : 'Login with Email'}
                </Button>
              </form>

              <div className="text-xs text-center mt-4 text-muted-foreground">
                <p>Don't have an account yet?</p>
                <Button 
                  variant="link" 
                  onClick={() => setActiveTab("register")}
                  className="p-0 h-auto font-semibold text-primary"
                >
                  Create an account
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="register">
              {/* Google authentication temporarily disabled
              <div className="mb-4">
                <Button 
                  type="button" 
                  className="w-full flex items-center justify-center gap-2" 
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={isProcessing}
                >
                  <FaGoogle className="h-4 w-4" />
                  <span>{isProcessing ? 'Signing up...' : 'Sign up with Google'}</span>
                </Button>
              </div>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-xs text-muted-foreground">
                    Or register with email
                  </span>
                </div>
              </div>
              */}
              
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input 
                    id="register-email" 
                    type="email" 
                    placeholder="your@email.com" 
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input 
                    id="register-password" 
                    type="password" 
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Creating Account...' : 'Create Account with Email'}
                </Button>
              </form>
              
              <div className="text-xs text-center mt-4 text-muted-foreground">
                <p>Already have an account?</p>
                <Button 
                  variant="link" 
                  onClick={() => setActiveTab("login")}
                  className="p-0 h-auto font-semibold text-primary"
                >
                  Sign in
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </CardFooter>
      </Card>
    </div>
  );
}