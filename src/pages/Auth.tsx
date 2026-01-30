import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Shield,
  Sprout,
  BarChart3,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { OrgAdminSignup } from "@/components/OrgAdminSignup";

// Validation schemas
const emailSchema = z.string().trim().email("Please enter a valid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name is too long")
      .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

type AuthView = "login" | "signup" | "org-admin-signup" | "forgot-password" | "reset-sent";

// Password strength indicator
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak", color: "bg-destructive" };
  if (score <= 4) return { score, label: "Medium", color: "bg-warning" };
  return { score, label: "Strong", color: "bg-success" };
};

// Password requirement component
const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2 text-xs">
    {met ? (
      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
    ) : (
      <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
    )}
    <span className={met ? "text-success" : "text-muted-foreground"}>{text}</span>
  </div>
);

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialView = (searchParams.get("view") as AuthView) || "login";
  
  const [view, setView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Clear form when switching views
  useEffect(() => {
    setErrors({});
    setTouched({});
    if (view === "login") {
      setConfirmPassword("");
      setFullName("");
      setAgreeToTerms(false);
    }
  }, [view]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case "email":
        const emailResult = emailSchema.safeParse(email);
        if (!emailResult.success) {
          newErrors.email = emailResult.error.errors[0].message;
        } else {
          delete newErrors.email;
        }
        break;
      case "password":
        if (view === "signup") {
          const passwordResult = passwordSchema.safeParse(password);
          if (!passwordResult.success) {
            newErrors.password = passwordResult.error.errors[0].message;
          } else {
            delete newErrors.password;
          }
        }
        break;
      case "confirmPassword":
        if (password !== confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      case "fullName":
        if (fullName.trim().length < 2) {
          newErrors.fullName = "Full name must be at least 2 characters";
        } else if (!/^[a-zA-Z\s]+$/.test(fullName)) {
          newErrors.fullName = "Full name can only contain letters and spaces";
        } else {
          delete newErrors.fullName;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      setIsLoading(false);

      if (error) {
        const errorMessage =
          error.message || "An error occurred during login. Please try again.";
        toast({
          variant: "destructive",
          title: "Login failed",
          description:
            errorMessage.includes("Invalid login credentials") ||
            errorMessage.includes("Invalid login")
              ? "Invalid email or password. Please try again."
              : errorMessage,
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate("/dashboard");
      }
    } catch (err) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Login failed",
        description:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.",
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({
      email,
      password,
      confirmPassword,
      fullName,
      agreeToTerms,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast({
          variant: "destructive",
          title: "Account exists",
          description: "This email is already registered. Please log in instead.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: error.message,
        });
      }
    } else {
      toast({
        title: "Account created!",
        description: "Welcome! Your account has been created successfully.",
      });
      navigate("/dashboard");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setView("reset-sent");
  };

  const passwordStrength = getPasswordStrength(password);

  const features = [
    {
      icon: Sprout,
      title: "Seed-to-Sale",
      description: "Complete lifecycle tracking",
    },
    {
      icon: Shield,
      title: "Metrc Ready",
      description: "State compliance built-in",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Real-time insights",
    },
    {
      icon: Leaf,
      title: "Audit Safe",
      description: "Full traceability",
    },
  ];

  const renderLoginForm = () => (
    <form onSubmit={handleLogin}>
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your cultivation account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="login-email"
              type="email"
              placeholder="operator@facility.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              className={cn("h-11 pl-10", errors.email && touched.email && "border-destructive")}
            />
          </div>
          {errors.email && touched.email && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <Button
              type="button"
              variant="link"
              className="px-0 h-auto text-xs text-primary"
              onClick={() => setView("forgot-password")}
            >
              Forgot password?
            </Button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn("h-11 pl-10 pr-10", errors.password && "border-destructive")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          />
          <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
            Remember me for 30 days
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <Button type="submit" className="w-full h-11 gap-2" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Button
              type="button"
              variant="link"
              className="px-0 h-auto text-primary"
              onClick={() => setView("signup")}
            >
              Sign up
            </Button>
          </p>
          <p className="text-sm text-muted-foreground">
            Are you an Admin/Grower?{" "}
            <Button
              type="button"
              variant="link"
              className="px-0 h-auto text-primary"
              onClick={() => setView("org-admin-signup")}
            >
              Sign up as Admin/Grower
            </Button>
          </p>
        </div>
      </CardFooter>
    </form>
  );

  const renderSignupForm = () => (
    <form onSubmit={handleSignup}>
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Create account</CardTitle>
        <CardDescription>Set up your cultivation management system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="signup-name"
              type="text"
              placeholder="John Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => handleBlur("fullName")}
              className={cn("h-11 pl-10", errors.fullName && touched.fullName && "border-destructive")}
            />
          </div>
          {errors.fullName && touched.fullName && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.fullName}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="signup-email"
              type="email"
              placeholder="operator@facility.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              className={cn("h-11 pl-10", errors.email && touched.email && "border-destructive")}
            />
          </div>
          {errors.email && touched.email && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur("password")}
              className={cn("h-11 pl-10 pr-10", errors.password && touched.password && "border-destructive")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </div>

          {/* Password strength indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-300", passwordStrength.color)}
                    style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                  />
                </div>
                <span className={cn("text-xs font-medium", 
                  passwordStrength.label === "Weak" && "text-destructive",
                  passwordStrength.label === "Medium" && "text-warning",
                  passwordStrength.label === "Strong" && "text-success"
                )}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <PasswordRequirement met={password.length >= 8} text="At least 8 characters" />
                <PasswordRequirement met={/[A-Z]/.test(password)} text="One uppercase letter" />
                <PasswordRequirement met={/[a-z]/.test(password)} text="One lowercase letter" />
                <PasswordRequirement met={/[0-9]/.test(password)} text="One number" />
                <PasswordRequirement met={/[^A-Za-z0-9]/.test(password)} text="One special character" />
              </div>
            </div>
          )}

          {errors.password && touched.password && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-confirm-password">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => handleBlur("confirmPassword")}
              className={cn("h-11 pl-10 pr-10", errors.confirmPassword && touched.confirmPassword && "border-destructive")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {confirmPassword && password === confirmPassword && (
            <p className="text-sm text-success flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Passwords match
            </p>
          )}
          {errors.confirmPassword && touched.confirmPassword && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="agree-terms"
            checked={agreeToTerms}
            onCheckedChange={(checked) => {
              setAgreeToTerms(checked as boolean);
              if (touched.agreeToTerms) {
                validateField("agreeToTerms");
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, agreeToTerms: true }));
              validateField("agreeToTerms");
            }}
          />
          <Label htmlFor="agree-terms" className="text-sm font-normal cursor-pointer leading-relaxed">
            I agree to the{" "}
            <Button type="button" variant="link" className="px-0 h-auto text-primary">
              Terms of Service
            </Button>{" "}
            and{" "}
            <Button type="button" variant="link" className="px-0 h-auto text-primary">
              Privacy Policy
            </Button>
          </Label>
        </div>
        {errors.agreeToTerms && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.agreeToTerms}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <Button 
          type="submit" 
          className="w-full h-11 gap-2" 
          disabled={isLoading || !agreeToTerms}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button
              type="button"
              variant="link"
              className="px-0 h-auto text-primary"
              onClick={() => setView("login")}
            >
              Sign in
            </Button>
          </p>
          <p className="text-sm text-muted-foreground">
            Are you an Admin/Grower?{" "}
            <Button
              type="button"
              variant="link"
              className="px-0 h-auto text-primary"
              onClick={() => setView("org-admin-signup")}
            >
              Sign up as Admin/Grower
            </Button>
          </p>
        </div>
      </CardFooter>
    </form>
  );

  const renderForgotPasswordForm = () => (
    <form onSubmit={handleForgotPassword}>
      <CardHeader className="pb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit -ml-2 mb-2"
          onClick={() => setView("login")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Button>
        <CardTitle className="text-2xl">Forgot password?</CardTitle>
        <CardDescription>
          No worries! Enter your email and we'll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="forgot-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="forgot-email"
              type="email"
              placeholder="operator@facility.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              className={cn("h-11 pl-10", errors.email && touched.email && "border-destructive")}
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
      </CardFooter>
    </form>
  );

  const renderResetSentConfirmation = () => (
    <div className="text-center py-8">
      <CardHeader className="pb-4">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-success" />
        </div>
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription className="text-base">
          We've sent a password reset link to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Didn't receive the email? Check your spam folder or{" "}
          <Button
            type="button"
            variant="link"
            className="px-0 h-auto text-primary"
            onClick={() => setView("forgot-password")}
          >
            try again
          </Button>
        </p>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 gap-2"
          onClick={() => setView("login")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Button>
      </CardFooter>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">CannaCultivate</h1>
              <p className="text-white/70 text-sm">ERP Platform</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Compliance-First
              <br />
              Cultivation Management
            </h2>
            <p className="text-white/80 text-lg max-w-md">
              Streamline your cannabis operations with real-time tracking,
              automated compliance, and powerful analytics.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors"
              >
                <feature.icon className="w-6 h-6 text-white mb-2" />
                <h3 className="text-white font-semibold">{feature.title}</h3>
                <p className="text-white/70 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          Trusted by cultivation facilities across the country
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
              <Leaf className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">CannaCultivate ERP</h1>
            <p className="text-muted-foreground mt-1">Compliance-First Cultivation</p>
          </div>

          <Card className="border-0 shadow-xl">
            {view === "login" && renderLoginForm()}
            {view === "signup" && renderSignupForm()}
            {view === "org-admin-signup" && <OrgAdminSignup />}
            {view === "forgot-password" && renderForgotPasswordForm()}
            {view === "reset-sent" && renderResetSentConfirmation()}
          </Card>

          {/* Mobile features */}
          <div className="mt-8 grid grid-cols-2 gap-3 lg:hidden">
            {features.map((feature, index) => (
              <div key={index} className="p-3 rounded-xl bg-card border text-center">
                <feature.icon className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-xs font-medium">{feature.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
