import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, LayoutDashboard, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LogoIcon } from "@/components/ui/logo-icon";
import { CheckEmail, Check6DigitPassword } from "@/validations/validations";
import PasswordChangeModal from "@/components/admin/PasswordChangeModal";
import { useDispatch, useSelector } from "react-redux";
import { loginInfo, setLoading, setLoggingIn } from "@/redux/features/authSlice";
import type { RootState } from "@/redux/store/store";
import { AuthService } from "@/api/services/authService";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const from = location.state?.from?.pathname || '/admin';
  const { isAuthenticated, isLoggingIn } = useSelector((state: RootState) => state.auth);
  const [loginError, setLoginError] = useState<any>(null);

  const [loginUser, setLoginUser] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalType, setModalType] = useState<"forgotpassword" | "">("");
  
  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  // Handle input changes
  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginUser({
      ...loginUser,
      [name]: value,
    });
    // Clear errors when user starts typing
    if (name === 'email' && emailError) {
      setEmailError('');
    }
    if (name === 'password' && passwordError) {
      setPasswordError('');
    }
  };

  // Handle input blur (mark as touched and validate)
  const blurHandler = (text: string) => {
    if (text?.toLowerCase() === "email") {
      setTouched(prev => ({ ...prev, email: true }));
      const error = CheckEmail(loginUser?.email);
      setEmailError(error);
    } else {
      setTouched(prev => ({ ...prev, password: true }));
      const error = Check6DigitPassword(loginUser?.password);
      setPasswordError(error);
    }
  };


  // Navigate to dashboard when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Login Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginError(null);
    dispatch(setLoggingIn(true));
    dispatch(setLoading(true));

    // Mark all fields as touched
    setTouched({ email: true, password: true });

    // Validate all fields
    const emailValidation = CheckEmail(loginUser?.email);
    const passwordValidation = Check6DigitPassword(loginUser?.password);

    setEmailError(emailValidation);
    setPasswordError(passwordValidation);

    // If there are validation errors, don't submit
    if (emailValidation || passwordValidation) {
      dispatch(setLoggingIn(false));
      dispatch(setLoading(false));
      return;
    }

    try {
      // Call login API
      const response = await AuthService.login({
        email: loginUser.email,
        password: loginUser.password,
      });

      if (response.success && response.data) {
        const loginData = response.data as any;
        
        // Get user data from localStorage (stored by AuthService.login)
        const userData = AuthService.getCurrentUser();
        
        if (userData) {
          // Store user data in Redux
          dispatch(loginInfo(userData));
          dispatch(setLoggingIn(false));
          dispatch(setLoading(false));
          
          // Navigate to dashboard
          navigate('/admin', { replace: true });
        } else {
          throw new Error('Failed to retrieve user data');
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      dispatch(setLoggingIn(false));
      dispatch(setLoading(false));
      setLoginError(error);
      
      // Extract error message
      let errorMessage = 'An error occurred during login';
      if (error && typeof error === 'object') {
        if ('message' in error && error.message) {
          errorMessage = String(error.message);
        } else if ('data' in error && error.data) {
          if (typeof error.data === 'string') {
            errorMessage = error.data;
          } else if (error.data && typeof error.data === 'object' && 'message' in error.data) {
            errorMessage = String(error.data.message);
          }
        } else if ('response' in error && error.response) {
          const response = error.response;
          if (response.data?.message) {
            errorMessage = String(response.data.message);
          } else if (response.data?.data?.message) {
            errorMessage = String(response.data.data.message);
          } else if (response.statusText) {
            errorMessage = String(response.statusText);
          } else if (response.status) {
            errorMessage = `Request failed with status ${response.status}`;
          }
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
    }
  };

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const userData = AuthService.getCurrentUser();
    const accessToken = AuthService.getAccessToken();
    
    if (userData && accessToken) {
      // Restore user data to Redux if available
      dispatch(loginInfo(userData));
    }
  }, [dispatch]);

  // Forgot password modal handling - MUST be before any early returns
  const openForgotPasswordHandler = useCallback(() => {
    setShowPasswordModal(true);
    setModalType("forgotpassword");
  }, []);

  const closeForgotPasswordHandler = useCallback(() => {
    // Clear any password-related errors when closing modal
    if (error && (error.includes('password') || error.includes('Current password is incorrect'))) {
      setError('');
    }
    setShowPasswordModal(false);
  }, [error]);

  const clearModalType = useCallback(() => {
    setModalType("");
  }, []);

  // Don't show login form if user is already authenticated
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
        <div className="max-w-md w-full space-y-8 p-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center mb-6">
              <LogoIcon size="xl" />
            </div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-green via-brand-teal to-brand-blue bg-clip-text text-transparent mb-2">
              Rhubaia
            </h1>

            <p className="text-sm text-muted-foreground mb-8">
              Redirecting to Dashboard...
            </p>
          </motion.div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-6">
            <LogoIcon size="xl" />
          </div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-green via-brand-teal to-brand-blue bg-clip-text text-transparent mb-2">
            Rhubaia
          </h1>

          <p className="text-sm text-muted-foreground mb-8">
            Admin Panel Login
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="border-2 border-dashed border-border hover:border-brand-green/50 transition-colors">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <LayoutDashboard className="h-5 w-5" />
                Sign In
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && error.trim() !== '' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    name="email"
                    value={loginUser?.email}
                    // onChange={handleEmailChange}
                    // onBlur={handleEmailBlur}
                    onChange={onChangeHandler}
                    onBlur={() => blurHandler("email")}
                    className={`focus:ring-brand-green focus:border-brand-green ${touched.email && emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                  />
                  {touched.email && emailError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md"
                    >
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span className="text-sm text-red-600">{emailError}</span>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      name="password"
                      value={loginUser?.password}
                      onChange={onChangeHandler}
                      onBlur={() => blurHandler("password")}
                      className={`focus:ring-brand-green focus:border-brand-green pr-10 ${touched.password && passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {touched.password && passwordError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md"
                    >
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span className="text-sm text-red-600">{passwordError}</span>
                    </motion.div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-green hover:bg-brand-green/90 text-white"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Signing In...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Sign In
                    </div>
                  )}
                </Button>
              </form>

              <div className="pt-4">
                <Link
                  to="#"
                  onClick={openForgotPasswordHandler}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  forgot password
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p>© 2024 Rhubaia. All rights reserved.</p>
        </motion.div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        type={modalType}
        isOpen={showPasswordModal}
        onClose={closeForgotPasswordHandler}
        clearType={clearModalType}
      />
    </div>
  );
};

export default Login; 