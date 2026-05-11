import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogoIcon } from "@/components/ui/logo-icon";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { twoFactorStore } from "@/lib/twoFactorStore";
import { AuthService } from "@/api/services/authService";
import { useToast } from "@/hooks/use-toast";
import { loginInfo, setLoading, setLoggingIn } from "@/redux/features/authSlice";

const OTP_LENGTH = 6;

const onlyDigits = (value: string) => value.replace(/\D/g, "");

export default function LoginOtp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = twoFactorStore.getToken();
  const email = twoFactorStore.getEmail();

  const [otpDigits, setOtpDigits] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string>("");

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const otp = useMemo(() => otpDigits.join(""), [otpDigits]);

  useEffect(() => {
    if (!token) {
      toast({
        title: "Session expired",
        description: "Please login again.",
        variant: "destructive",
      });
      navigate("/", { replace: true });
      return;
    }

    // focus first digit
    setTimeout(() => inputsRef.current[0]?.focus?.(), 0);
  }, [navigate, toast, token]);

  const setDigit = (index: number, value: string) => {
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
  };

  const handleChange = (index: number, value: string) => {
    setError("");
    const cleaned = onlyDigits(value);
    if (!cleaned) {
      setDigit(index, "");
      return;
    }

    // paste support (multiple digits)
    if (cleaned.length > 1) {
      const next = [...otpDigits];
      for (let i = 0; i < cleaned.length && index + i < OTP_LENGTH; i += 1) {
        next[index + i] = cleaned[i];
      }
      setOtpDigits(next);
      const focusIndex = Math.min(index + cleaned.length, OTP_LENGTH - 1);
      inputsRef.current[focusIndex]?.focus?.();
      return;
    }

    setDigit(index, cleaned);
    if (index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus?.();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otpDigits[index]) {
        setDigit(index, "");
        return;
      }
      if (index > 0) {
        inputsRef.current[index - 1]?.focus?.();
        const next = [...otpDigits];
        next[index - 1] = "";
        setOtpDigits(next);
      }
    }
  };

  const onBack = () => {
    twoFactorStore.clear();
    navigate("/", { replace: true });
  };

  const onVerify = async () => {
    if (!token) return;
    if (otp.length !== OTP_LENGTH) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setSubmitting(true);
    dispatch(setLoggingIn(true));
    dispatch(setLoading(true));
    try {
      await AuthService.verifyLoginOtp({ twoFactorToken: token, otp });
      const userData = AuthService.getCurrentUser();
      if (!userData) {
        throw new Error("Failed to retrieve user data");
      }
      dispatch(loginInfo(userData));
      twoFactorStore.clear();
      navigate("/admin", { replace: true });
    } catch (e: any) {
      const message = String(e?.message || "Invalid OTP");
      setError(message);

      // If token is invalid/expired, force back to login
      if (message.toLowerCase().includes("token")) {
        twoFactorStore.clear();
        navigate("/", { replace: true });
      }
    } finally {
      setSubmitting(false);
      dispatch(setLoggingIn(false));
      dispatch(setLoading(false));
    }
  };

  const onResend = async () => {
    if (!token) return;
    setResending(true);
    setError("");
    try {
      await AuthService.resendLoginOtp({ twoFactorToken: token });
      toast({ title: "OTP resent", description: "OTP resent to your email" });
      setOtpDigits(Array.from({ length: OTP_LENGTH }, () => ""));
      setTimeout(() => inputsRef.current[0]?.focus?.(), 0);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

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
          <p className="text-sm text-muted-foreground">
            Verify your login
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Enter the 6-digit code sent to your email{email ? ` (${email})` : ""}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <Card className="border-2 border-dashed border-border hover:border-brand-green/50 transition-colors">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <ShieldCheck className="h-5 w-5" />
                Verify OTP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex items-center justify-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputsRef.current[idx] = el;
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="h-12 w-10 rounded-md border bg-background text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                ))}
              </div>

              <Button
                onClick={onVerify}
                disabled={submitting}
                className="w-full bg-brand-green hover:bg-brand-green/90 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  disabled={submitting || resending}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={onResend}
                  className="text-brand-teal hover:underline disabled:opacity-60"
                  disabled={submitting || resending}
                >
                  {resending ? "Resending..." : "Didn’t get the code? Resend"}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

