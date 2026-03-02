
"use client";

import { useContext, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Loader2, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { AppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";


export default function SignupPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signUpWithEmail, isLoggedIn, loading: sessionLoading } = useContext(AppContext);
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [anaMail, setAnaMail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");

  const redirectToTarget = () => {
    const targetUrl = sessionStorage.getItem('redirectAfterLogin');
    if (targetUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(targetUrl);
    } else {
        router.push("/chat");
    }
  }

  useEffect(() => {
    if (!sessionLoading && isLoggedIn) {
      redirectToTarget();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, sessionLoading, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (anaMail.includes('@')) {
        toast({
            variant: "destructive",
            title: "Invalid Ana Mail",
            description: "Please enter only your desired username. We will add '@my.ana' for you.",
        });
        return;
    }
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please ensure both passwords are the same.",
      });
      return;
    }
    
    if (!agreedToTerms) {
      toast({
        variant: "destructive",
        title: "Terms and Conditions",
        description: "You must agree to the terms and conditions to sign up.",
      });
      return;
    }

    setIsLoading(true);
    try {
        const user = await signUpWithEmail({ name, email: anaMail, password, phone, gender });
        const fullEmail = `${anaMail}@my.ana`;
        if (user?.email) {
            setNewUserEmail(fullEmail);
            setShowSuccessDialog(true);
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Signup Failed",
            description: (error as Error).message,
        });
    } finally {
        setIsLoading(false);
    }
  };

  
  const handleDialogClose = () => {
    setShowSuccessDialog(false);
    redirectToTarget();
  }

  if (sessionLoading) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-8 flex items-center gap-2 text-2xl font-semibold">
        <Bot className="h-8 w-8 text-primary" />
        <h1>My Ana AI</h1>
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('signup.create')}</CardTitle>
          <CardDescription>
            {t('signup.prompt')}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="+91 123 456 7890"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anaMail">Ana Mail</Label>
                   <div className="flex items-center">
                        <Input
                            id="anaMail"
                            type="text"
                            placeholder="yourname"
                            required
                            value={anaMail}
                            onChange={(e) => setAnaMail(e.target.value)}
                            disabled={isLoading}
                            className="rounded-r-none"
                        />
                        <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground h-10">
                            @my.ana
                        </span>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Gender</Label>
                    <RadioGroup defaultValue="male" className="flex gap-4" value={gender} onValueChange={(value) => setGender(value as 'male'|'female'|'other')}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="male" />
                            <Label htmlFor="male">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="female" />
                            <Label htmlFor="female">Female</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" />
                            <Label htmlFor="other">Other</Label>
                        </div>
                    </RadioGroup>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">{t('login.password')}</Label>
                       <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                              onClick={() => setShowPassword(prev => !prev)}
                            >
                              {showPassword ? <EyeOff /> : <Eye />}
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="confirm-password">{t('signup.confirm_password')}</Label>
                       <div className="relative">
                            <Input
                              id="confirm-password"
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                              onClick={() => setShowPassword(prev => !prev)}
                            >
                              {showPassword ? <EyeOff /> : <Eye />}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex items-start space-x-2">
                    <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} className="mt-1" />
                    <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
                        I agree to the{" "}
                        <Link
                            href="/terms"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                            href="/privacy"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </Label>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || !agreedToTerms}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  {t('signup.button')}
                </Button>
            </form>
          <div className="mt-4 text-center text-sm">
            {t('signup.have_account')}{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t('nav.login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>

    <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Welcome to My Ana AI! 🎉</AlertDialogTitle>
            <AlertDialogDescription>
                Your account has been created successfully. Your new email is <strong className="text-primary">{newUserEmail}</strong>.
                <br /><br />
                Ana is excited to meet you. Why not start your first conversation now?
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogAction onClick={handleDialogClose}>Start Chatting with Ana</AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

    