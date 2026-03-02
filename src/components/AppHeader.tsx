
"use client";

import { Fragment, useContext, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bot, Languages, User, Bell, Sun, Moon, Loader2, Users, MessageSquare, Menu, BadgeCheck, Crown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { AppContext, Language, Notification } from '@/context/AppContext';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'en-hi', name: 'Hinglish' },
    { code: 'hi', name: 'Hindi' },
    { code: 'bn', name: 'Bengali' },
    { code: 'bh', name: 'Bhojpuri' },
];

export function AppHeader() {
  const { 
    theme, setTheme, isLoggedIn, logoutUser, isAdmin, userName, userPlan,
    notifications, fetchNotifications, lastCheckedNotifs, setLastCheckedNotifs 
  } = useContext(AppContext);
  const { t, language, setLanguage } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);
  
  useEffect(() => {
    if (isLoggedIn) {
        setLastCheckedNotifs(localStorage.getItem('lastCheckedNotifs'));
        fetchNotifications();
    }
  }, [isLoggedIn, fetchNotifications, setLastCheckedNotifs]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }
  
  const handleFetchNotifications = async () => {
      if (!isLoggedIn) return;
      setIsLoadingNotifs(true);
      await fetchNotifications();
      setIsLoadingNotifs(false);
  }
  
  const unreadCount = useMemo(() => {
      if (!lastCheckedNotifs || !notifications.length) {
          return notifications.length;
      }
      const lastCheckedDate = new Date(lastCheckedNotifs);
      return notifications.filter(n => new Date(n.createdAt) > lastCheckedDate).length;
  }, [notifications, lastCheckedNotifs]);
  
  const handleNotifBellClick = () => {
    handleFetchNotifications();
    setShowNotifications(true);
    const now = new Date().toISOString();
    localStorage.setItem('lastCheckedNotifs', now);
    setLastCheckedNotifs(now);
  }

  const renderPlanBadge = () => {
    if (userPlan === 'Enterprise') {
      return (
        <Badge className="ml-1 gap-1 bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 hover:from-amber-400 hover:to-yellow-300">
          <Crown className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Enterprise</span>
        </Badge>
      );
    }
    if (userPlan === 'Business') {
      return (
        <Badge variant="outline" className="ml-1 gap-1 border-blue-500/60 bg-blue-500/10 text-blue-700 dark:text-blue-300">
          <BadgeCheck className="h-3.5 w-3.5 fill-blue-500 text-blue-500" />
          <span className="hidden md:inline">Business</span>
        </Badge>
      );
    }
    return null;
  };

  return (
    <Fragment>
      <div className="h-16 shrink-0" aria-hidden="true" />
      <header className="fixed inset-x-0 top-0 z-[70] flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
       <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Bot className="w-8 h-8 text-primary" />
            <span className="hidden md:block">My Ana AI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" asChild>
                <Link href="/anaconnect" className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    AnaConnect
                </Link>
            </Button>
            <Button variant="ghost" asChild>
                <Link href="/community" className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Community
                </Link>
            </Button>
        </nav>
       </div>
      
      <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="hidden md:flex">
            <Link href="/chat">
                <MessageSquare className="h-5 w-5" />
                <span className="sr-only">Chat</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{t('theme.changer.aria')}</span>
          </Button>

          <div className="hidden md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Languages className="h-5 w-5" />
                  <span className="sr-only">{t('chat.change_language')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('chat.select_language')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as Language)}>
                  {languages.map(lang => (
                    <DropdownMenuRadioItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoggedIn && (
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={handleNotifBellClick}>
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
              )}
            </div>
          )}

        {isLoggedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span className='hidden sm:inline'>{userName}</span>
                {renderPlanBadge()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild><Link href="/admin">Admin Dashboard</Link></DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logoutUser}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
           <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" asChild>
              <Link href="/login">{t('nav.login')}</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">{t('nav.signup')}</Link>
            </Button>
           </div>
        )}

        <div className="md:hidden">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link href="/chat">Chat</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/anaconnect">AnaConnect</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/community">Community</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Languages className="mr-2 h-4 w-4" />
                            <span>Language</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as Language)}>
                                    {languages.map(lang => (
                                        <DropdownMenuRadioItem key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                     {!isLoggedIn && (
                        <>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem asChild>
                           <Link href="/login">{t('nav.login')}</Link>
                         </DropdownMenuItem>
                         <DropdownMenuItem asChild>
                           <Link href="/signup">{t('nav.signup')}</Link>
                         </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
       </div>

        <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Notifications</DialogTitle>
              <DialogDescription>
                Here are your latest updates.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {isLoadingNotifs ? (
                <div className="flex justify-center items-center h-20">
                    <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notif, index) => {
                  const isUnread = lastCheckedNotifs ? new Date(notif.createdAt) > new Date(lastCheckedNotifs) : true;
                  return (
                  <div key={notif.id} className={cn(
                    "p-4 border rounded-lg transition-colors",
                    isUnread ? "bg-muted font-semibold" : "bg-background/50 opacity-70",
                    index === 0 && "border-primary"
                  )}>
                    <h4 className="font-semibold">{notif.title}</h4>
                    <p className="text-sm text-muted-foreground font-normal">{notif.description}</p>
                     <p className="text-xs text-muted-foreground/50 mt-2 font-normal">{new Date(notif.createdAt).toLocaleString()}</p>
                  </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No new notifications.</p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowNotifications(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>
    </Fragment>
  );
}
