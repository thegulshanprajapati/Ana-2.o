
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { AppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { AppFooter } from "@/components/AppFooter";


export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { loginUser, isLoggedIn, refreshUserSession } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const redirectToTarget = () => {
    const targetUrl = sessionStorage.getItem('redirectAfterLogin');
    if (targetUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(targetUrl);
    } else {
        router.push("/");
    }
  }

  useEffect(() => {
    if(isLoggedIn) {
        redirectToTarget();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await loginUser({ email, password });
      if(success) {
          toast({
              title: "Login Successful",
              description: "Welcome back!",
          });
      } else {
          toast({
              variant: 'destructive',
              title: "Login Failed",
              description: "Invalid email or password.",
          })
      }
    } catch (error) {
       toast({
            variant: 'destructive',
            title: "Login Failed",
            description: (error as Error).message,
        })
    }
    setIsLoading(false);
  };
  

  return (
    <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="mb-8 flex items-center gap-2 text-2xl font-semibold">
                <Bot className="h-8 w-8 text-primary" />
                <h1>My Ana AI</h1>
            </div>
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                <CardTitle className="text-2xl">{t('login.welcome')}</CardTitle>
                <CardDescription>
                    {t('login.prompt')}
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="space-y-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="email">{t('login.email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">{t('login.password')}</Label>
                                <Link
                                    href="#"
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        <Input 
                            id="password" 
                            type="password" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        {t('login.button')}
                        </Button>
                    </form>
                </div>
                <div className="mt-4 text-center text-sm">
                    {t('login.no_account')}{" "}
                    <Link href="/signup" className="font-medium text-primary hover:underline">
                    {t('nav.signup')}
                    </Link>
                </div>
                </CardContent>
            </Card>
        </main>
        <AppFooter />
    </div>
  );
}
