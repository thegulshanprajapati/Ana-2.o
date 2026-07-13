
"use client";

import { Fragment, useContext, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bot, Languages, User, Bell, Sun, Moon, Loader2, Users, MessageSquare, Menu, BadgeCheck, Crown, Trash2, BellOff, Sparkles, X } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
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
    notifications, fetchNotifications, lastCheckedNotifs, setLastCheckedNotifs,
    deleteNotification, clearNotifications
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
      <header className="fixed inset-x-0 top-0 z-[70] flex h-16 items-center justify-between border-b border-muted/30 bg-background/70 px-4 backdrop-blur-md md:px-6 shadow-sm shadow-primary/5 transition-all duration-300">
       <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl group">
            <div className="p-1 rounded-lg bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 transition-all duration-300">
                <Bot className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
            </div>
            <span className="hidden md:block bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-extrabold tracking-tight transition-all duration-300 group-hover:opacity-90">
                My Ana AI
            </span>
        </Link>
        <nav className="hidden md:flex items-center gap-2 ml-4">
            <Button variant="ghost" className="hover:bg-primary/5 hover:text-primary transition-all duration-200 relative group py-1.5 px-3 h-9" asChild>
                <Link href="/anaconnect" className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">AnaConnect</span>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                </Link>
            </Button>
            <Button variant="ghost" className="hover:bg-primary/5 hover:text-primary transition-all duration-200 relative group py-1.5 px-3 h-9" asChild>
                <Link href="/community" className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Community</span>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                </Link>
            </Button>
        </nav>
       </div>
      
      <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="hidden md:flex hover:bg-primary/5 hover:text-primary transition-all duration-200">
            <Link href="/chat">
                <MessageSquare className="h-5 w-5" />
                <span className="sr-only">Chat</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover:bg-primary/5 transition-all duration-200">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{t('theme.changer.aria')}</span>
          </Button>
 
          <div className="hidden md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary/5 transition-all duration-200">
                  <Languages className="h-5 w-5" />
                  <span className="sr-only">{t('chat.change_language')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="backdrop-blur-md bg-background/90">
                <DropdownMenuLabel>{t('chat.select_language')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as Language)}>
                  {languages.map(lang => (
                    <DropdownMenuRadioItem key={lang.code} value={lang.code} className="hover:bg-primary/5">
                      {lang.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
 
          {isLoggedIn && (
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={handleNotifBellClick} className="hover:bg-primary/5 transition-all duration-200">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-[10px]">{unreadCount}</Badge>
              )}
            </div>
          )}
 
        {isLoggedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-primary/5 transition-all duration-200">
                <User className="h-4 w-4" />
                <span className='hidden sm:inline font-semibold'>{userName}</span>
                {renderPlanBadge()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="backdrop-blur-md bg-background/90 w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="hover:bg-primary/5 cursor-pointer"><Link href="/profile">Profile</Link></DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild className="hover:bg-primary/5 cursor-pointer text-primary font-medium"><Link href="/admin">Admin Dashboard</Link></DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logoutUser} className="text-red-500 hover:bg-red-500/10 cursor-pointer">Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
           <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" className="hover:bg-primary/5 hover:text-primary transition-all duration-200 py-1.5 px-4 h-9" asChild>
              <Link href="/login">{t('nav.login')}</Link>
            </Button>
            <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:opacity-95 transition-all py-1.5 px-4 h-9 font-semibold" asChild>
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

         <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
           <SheetContent className="w-full sm:max-w-[360px] flex flex-col h-[calc(100vh-24px)] !my-3 !mr-3 rounded-2xl bg-zinc-950/80 dark:bg-black/70 backdrop-blur-3xl border border-white/10 shadow-2xl p-0 z-[100] transition-all duration-300 !right-0">
             <SheetHeader className="p-5 border-b border-white/5 pb-4">
               <div className="flex items-center gap-1.5 mb-3">
                 <div className="w-3 h-3 rounded-full bg-[#FF5F56] hover:bg-[#FF5F56]/80 transition-colors cursor-pointer" onClick={() => setShowNotifications(false)} />
                 <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                 <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
               </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <div className="p-1.5 rounded-lg bg-white/5 text-white/80">
                     <Bell className="w-4 h-4" />
                   </div>
                   <div>
                     <SheetTitle className="text-base font-bold tracking-tight text-white/95">Notifications</SheetTitle>
                   </div>
                 </div>
                 {notifications.length > 0 && (
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     onClick={clearNotifications}
                     className="text-xs text-white/55 hover:text-white hover:bg-white/5 transition-all gap-1 h-7 px-2.5 rounded-lg"
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                     Clear All
                   </Button>
                 )}
               </div>
             </SheetHeader>

             <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-none">
               {isLoadingNotifs ? (
                 <div className="flex flex-col items-center justify-center h-40 space-y-2">
                     <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                     <p className="text-xs text-white/40">Loading notifications...</p>
                 </div>
               ) : notifications.length > 0 ? (
                 notifications.map((notif, index) => {
                   const isUnread = lastCheckedNotifs ? new Date(notif.createdAt) > new Date(lastCheckedNotifs) : true;
                   const isPlanUpdate = notif.title.toLowerCase().includes('welcome') || notif.title.toLowerCase().includes('plan') || notif.title.toLowerCase().includes('account');
                   
                   return (
                   <div 
                     key={notif.id} 
                     className={cn(
                       "relative p-4 rounded-xl transition-all duration-300 group overflow-hidden cursor-default border",
                       isUnread 
                         ? "bg-white/[0.08] border-white/10 shadow-md backdrop-blur-md" 
                         : "bg-white/[0.03] border-white/[0.05] opacity-75 hover:opacity-100",
                       "hover:bg-white/[0.12] hover:border-white/20 hover:scale-[1.02] active:scale-[0.99]"
                     )}
                   >
                     {isUnread && (
                       <span className="absolute top-4 right-4 flex h-1.5 w-1.5">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400"></span>
                       </span>
                     )}
                     
                     <div className="flex items-start gap-3">
                       <div className={cn(
                         "p-1.5 rounded-lg shrink-0 mt-0.5 backdrop-blur-md border border-white/5",
                         isPlanUpdate 
                           ? "bg-amber-500/10 text-amber-400" 
                           : "bg-blue-500/10 text-blue-400"
                       )}>
                         {isPlanUpdate ? (
                           <Crown className="w-3.5 h-3.5" />
                         ) : (
                           <Sparkles className="w-3.5 h-3.5" />
                         )}
                       </div>
                       
                       <div className="flex-1 min-w-0 pr-4">
                         <h4 className="font-semibold text-xs leading-tight text-white/90">{notif.title}</h4>
                         <p className="text-[11px] text-white/60 mt-1 leading-relaxed">{notif.description}</p>
                         <p className="text-[9px] text-white/45 mt-2 font-medium">
                           {new Date(notif.createdAt).toLocaleString(undefined, {
                             month: 'short',
                             day: 'numeric',
                             hour: '2-digit',
                             minute: '2-digit'
                           })}
                         </p>
                       </div>
                     </div>

                     <Button 
                       variant="ghost" 
                       size="icon" 
                       onClick={() => deleteNotification(notif.id)}
                       className="absolute top-2 right-2 h-5 w-5 rounded-full bg-black/40 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                     >
                       <X className="w-3 h-3" />
                       <span className="sr-only">Dismiss</span>
                     </Button>
                   </div>
                   )
                 })
               ) : (
                 <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                   <div className="p-3 bg-white/5 rounded-full text-white/20">
                     <BellOff className="w-8 h-8" />
                   </div>
                   <div>
                     <p className="text-xs font-semibold text-white/80">No Notifications</p>
                     <p className="text-[11px] text-white/40 max-w-[200px] mt-1">Everything is up to date.</p>
                   </div>
                 </div>
               )}
             </div>
             
             <SheetFooter className="p-4 border-t border-white/5 bg-white/[0.02]">
               <Button 
                 onClick={() => setShowNotifications(false)}
                 className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/10 backdrop-blur-md hover:scale-[1.01] active:scale-[0.99] font-medium py-2 rounded-xl transition-all duration-200"
               >
                 Close
               </Button>
             </SheetFooter>
           </SheetContent>
         </Sheet>
      </header>
    </Fragment>
  );
}
