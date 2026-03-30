import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkMatchedPassword, checkStrongPassword } from "@/validations/validations";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "@/redux/features/authSlice";
import { useProfile } from "@/api/hooks/useProfile";
import { AuthService } from "@/api/services/authService";
import { authStorage } from "@/lib/authStorage";

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: string; // Optional: "forgotpassword" or undefined
  clearType?: () => void; // Optional: function to clear modal type
}

export function PasswordChangeModal({
  isOpen,
  onClose,
  type,
  clearType,
}: PasswordChangeModalProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { changePassword, changingPassword: isChangingPassword } = useProfile();
  const { toast } = useToast();

  const [step, setStep] = useState('password');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: '',
  });

  // Real-time validation state
  const [passwordValidation, setPasswordValidation] = useState(checkStrongPassword(''));
  const [passwordMatch, setPasswordMatch] = useState(true);

  // Error state for current password
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  // Error state for OTP
  const [otpError, setOtpError] = useState<string | null>(null);

  // Success countdown state
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Flag to track if password was changed successfully
  const [passwordChanged, setPasswordChanged] = useState(false);


  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);


  // Handle hard reload scenarios
  useEffect(() => {
    if (authStorage.consumePasswordChangedFlag()) {
      logoutHandler();
    }
  }, []);


  // Update validation when passwords change
  const handlePasswordChange = (field: 'newPassword' | 'confirmPassword', value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    if (field === 'newPassword') {
      setPasswordValidation(checkStrongPassword(value));
    };

    // Check password match
    if (field === 'newPassword' || field === 'confirmPassword') {
      const newPassword = field === 'newPassword' ? value : newFormData.newPassword;
      const confirmPassword = field === 'confirmPassword' ? value : newFormData.confirmPassword;
      const isMatch = checkMatchedPassword(newPassword, confirmPassword);
      setPasswordMatch(isMatch);
    };
  };

  // Handle current password change - clear error when user starts typing
  const handleCurrentPasswordChange = (value: string) => {
    setFormData({ ...formData, currentPassword: value });
    // Clear error when user starts typing
    if (currentPasswordError) {
      setCurrentPasswordError(null);
    }
  };

  // Handle password change (new API - single step, no OTP)
  const handlePasswordChangeSubmit = async () => {
    if (!passwordValidation.isValid || !passwordMatch) {
      toast({
        title: "Error",
        description: "Please fix password validation errors before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      
      // Directly proceed to success step if successful (no OTP step)
      if (success) {
        setPasswordChanged(true);
        authStorage.markPasswordChanged();
        setStep('success');
        startCountdown();
      } else {
        // Show error in current password field instead of toast
        setCurrentPasswordError("Current password is incorrect");
        // Stay on password step
      }
    } catch (error: any) {
      // Show error in current password field instead of toast
      const errorMessage = error?.message || error?.data?.message || "Current password is incorrect";
      setCurrentPasswordError(errorMessage);
      // Don't proceed to success step, stay on password step
    }
  };

  // Start countdown and logout
  const startCountdown = () => {
    setCountdown(5);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Clear interval and logout
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }

          // Logout after countdown
          logoutHandler();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };


  // Close all the state and clear states
  const handleClose = () => {
    // Don't allow closing if password was changed successfully
    if (passwordChanged) {
      return;
    }

    setStep('password');
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      otp: '',
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
    setPasswordValidation(checkStrongPassword(''));
    setPasswordMatch(true);
    setCurrentPasswordError(null);
    setOtpError(null);
    setCountdown(5);
    setPasswordChanged(false);

    // Clear any pending countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    onClose();
  };

  const closeModal = () => {
    if (type?.toLowerCase() === "forgotpassword") {
      handleClose();
      if (clearType) {
        clearType();
      }
    } else {
      setStep('password');
    }
  };


  // Handle password submit (single step - no OTP)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordValidation.isValid || !passwordMatch) {
      toast({
        title: "Error",
        description: "Please fix password validation errors before submitting",
        variant: "destructive",
      });
      return;
    }

    await handlePasswordChangeSubmit();
  };


  // Logout Handler
  const logoutHandler = async () => {
    try {
      await AuthService.logout();
    } catch {
      // Continue with logout even if API call fails
    } finally {
      dispatch(logout());
      navigate('/', { replace: true });
      handleClose();
    }
  };


  const HeadingText = (step?.toLowerCase() === 'otp' || type?.toLowerCase() === "forgotpassword")
    ? 'Verify OTP'
    : step === 'password'
      ? 'Change Password'
      : 'Success';

  const SubHeading = (step?.toLowerCase() === 'otp' || type?.toLowerCase() === "forgotpassword")
    ? `Enter the 6-digit OTP sent to your email "${"admin@gmail.com"}" to complete the password change.`
    : step === 'password'
      ? 'Enter your current password and choose a new one.'
      : 'Password changed successfully! You will be redirected to login page.'


  return (
    <Dialog
      open={isOpen}
      onOpenChange={passwordChanged ? undefined : handleClose}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {HeadingText}
          </DialogTitle>
          <DialogDescription>
            {SubHeading}
          </DialogDescription>
        </DialogHeader>

        {(step?.toLowerCase() === 'otp' || type?.toLowerCase() === "forgotpassword")
          ? <form onSubmit={(e) => {
              e.preventDefault();
              // OTP verification is commented out - this is for forgot password flow
              if (clearType) {
                clearType();
              }
              setPasswordChanged(true);
              authStorage.markPasswordChanged();
              setStep('success');
              startCountdown();
            }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                value={formData.otp}
                onChange={(e) => {
                  setFormData({ ...formData, otp: e.target.value });
                  // Clear error when user starts typing
                  if (otpError) {
                    setOtpError(null);
                  }
                }}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
                className={`text-center text-lg tracking-widest ${otpError ? "border-red-500 focus:border-red-500" : ""}`}
              />
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit OTP sent to your email address
              </p>
              {otpError && (
                <p className="text-sm text-red-500 flex items-center">
                  <X className="h-4 w-4 mr-1" />
                  {otpError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Back
              </Button>
              <Button
                type="button"
                disabled={formData.otp.length !== 6}
                onClick={() => {
                  // OTP verification is commented out - this is for forgot password flow
                  if (clearType) {
                    clearType();
                  }
                  setPasswordChanged(true);
                  authStorage.markPasswordChanged();
                  setStep('success');
                  startCountdown();
                }}
                className="bg-brand-green hover:bg-brand-green/90 text-white"
              >
                Verify OTP
              </Button>
            </DialogFooter>
          </form>
          : step?.toLowerCase() === 'password'
            ? <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Password form content */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className={currentPasswordError ? "border-red-500 focus:border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {currentPasswordError && (
                  <p className="text-sm text-red-500 flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    {currentPasswordError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {formData.newPassword && (
                  <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
                    <div className="space-y-1">
                      <div className={`flex items-center text-xs ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                        {passwordValidation.hasUpperCase ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                        At least one uppercase letter (A-Z)
                      </div>
                      <div className={`flex items-center text-xs ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                        {passwordValidation.hasLowerCase ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                        At least one lowercase letter (a-z)
                      </div>
                      <div className={`flex items-center text-xs ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                        {passwordValidation.hasNumber ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                        At least one number (0-9)
                      </div>
                      <div className={`flex items-center text-xs ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
                        {passwordValidation.hasSpecialChar ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                        At least one special character (!@#$%^&*)
                      </div>
                      <div className={`flex items-center text-xs ${passwordValidation.isLongEnough ? 'text-green-600' : 'text-red-600'}`}>
                        {passwordValidation.isLongEnough ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                        At least 8 characters long
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  {passwordMatch && formData.confirmPassword && formData.newPassword && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                </div>
                {formData.confirmPassword && !passwordMatch && (
                  <p className="text-sm text-red-500 flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    Passwords do not match
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isChangingPassword || !passwordValidation.isValid || !passwordMatch || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                  className="bg-brand-green hover:bg-brand-green/90 text-white"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </DialogFooter>
            </form>
            : <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-600">Password Changed Successfully!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Your password has been updated. You will be redirected to the login page in {countdown} seconds.
                </p>
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={logoutHandler}
                  className="bg-brand-green hover:bg-brand-green/90 text-white"
                >
                  Go to Login Now
                </Button>
              </div>
            </div>
        }

      </DialogContent>
    </Dialog>
  );
};

export default PasswordChangeModal;
