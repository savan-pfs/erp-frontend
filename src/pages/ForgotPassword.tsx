import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Leaf,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Mail,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

const emailSchema = z.string().trim().email("Please enter a valid email address");

type ViewState = "request" | "sent" | "reset" | "success";

const ForgotPassword = () => {
  const [view, setView] = useState<ViewState>("request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setErrors({ email: result.error.errors[0].message });
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setView("sent");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setView("success");
  };

  const renderRequestForm = () => (
    <form onSubmit={handleRequestReset}>
      <CardHeader className="pb-4 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Forgot password?</CardTitle>
        <CardDescription className="text-base">
          No worries! Enter your email and we'll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="operator@facility.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              className={cn("h-11 pl-10", errors.email && touched.email && "border-destructive")}
              autoFocus
            />
          </div>
          {errors.email && touched.email && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <Button type="submit" className="w-full h-11 gap-2" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Send Reset Link
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
        <Link to="/auth" className="w-full">
          <Button type="button" variant="ghost" className="w-full h-11 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Button>
        </Link>
      </CardFooter>
    </form>
  );

  const renderSentConfirmation = () => (
    <div className="text-center">
      <CardHeader className="pb-4">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-success" />
        </div>
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription className="text-base">
          We've sent a password reset link to{" "}
          <span className="font-medium text-foreground block mt-1">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
          <p className="mb-2">The link will expire in 1 hour.</p>
          <p>
            Didn't receive the email? Check your spam folder or{" "}
            <Button
              type="button"
              variant="link"
              className="px-0 h-auto text-primary"
              onClick={() => setView("request")}
            >
              try again
            </Button>
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 gap-2"
          onClick={() => {
            // Simulate clicking the reset link
            setView("reset");
          }}
        >
          I have the reset code
          <ArrowRight className="w-4 h-4" />
        </Button>
        <Link to="/auth" className="w-full">
          <Button type="button" variant="ghost" className="w-full h-11 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Button>
        </Link>
      </CardFooter>
    </div>
  );

  const renderResetForm = () => (
    <form onSubmit={handleResetPassword}>
      <CardHeader className="pb-4 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Set new password</CardTitle>
        <CardDescription className="text-base">
          Your new password must be different from previously used passwords.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={cn("h-11", errors.newPassword && "border-destructive")}
          />
          {errors.newPassword && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.newPassword}
            </p>
          )}
          <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={cn("h-11", errors.confirmPassword && "border-destructive")}
          />
          {confirmPassword && newPassword === confirmPassword && (
            <p className="text-sm text-success flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Passwords match
            </p>
          )}
          {errors.confirmPassword && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show-password"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="rounded border-input"
          />
          <Label htmlFor="show-password" className="text-sm font-normal cursor-pointer">
            Show passwords
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <Button type="submit" className="w-full h-11 gap-2" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              Reset Password
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </form>
  );

  const renderSuccess = () => (
    <div className="text-center">
      <CardHeader className="pb-4">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <CardTitle className="text-2xl">Password reset successful!</CardTitle>
        <CardDescription className="text-base">
          Your password has been successfully reset. You can now sign in with your new password.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-xl bg-success/10 text-sm text-success">
          Your account is now secured with your new password.
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <Link to="/auth" className="w-full">
          <Button className="w-full h-11 gap-2">
            Continue to Sign In
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardFooter>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/auth" className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-foreground">CannaCultivate</h1>
              <p className="text-xs text-muted-foreground">ERP Platform</p>
            </div>
          </Link>
        </div>

        <Card className="border-0 shadow-xl">
          {view === "request" && renderRequestForm()}
          {view === "sent" && renderSentConfirmation()}
          {view === "reset" && renderResetForm()}
          {view === "success" && renderSuccess()}
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help?{" "}
          <Button variant="link" className="px-0 h-auto text-primary">
            Contact support
          </Button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
