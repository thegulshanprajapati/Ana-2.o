
"use client";

import { useState, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Edit, Save, Shield, Star, Calendar, CreditCard, Bell, LogOut, CheckCircle, Camera, Loader2, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { AppContext, UserData } from "@/context/AppContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";


export default function ProfilePage() {
  const { t } = useTranslation();
  const { 
    user, logoutUser, updateUser, loading,
  } = useContext(AppContext);
  const { toast } = useToast();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      setName(user.displayName || "");
      setEmail(user.email || "");
    }
  }, [user, loading, router]);
  
  const [notifications, setNotifications] = useState({
      productUpdates: true,
      securityAlerts: true,
  })

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
        await updateUser({ displayName: name });
        setIsEditing(false);
        toast({
            title: "Profile Updated",
            description: "Your changes have been saved successfully.",
            action: <CheckCircle className="text-green-500" />
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Update Failed",
            description: (error as Error).message || "Could not update profile.",
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
      // Reset local state to context state
      setName(user?.displayName || "");
      setEmail(user?.email || "");
      setIsEditing(false);
  }
  
  const handleAvatarClick = () => {
    // Avatar upload is complex with local file system, disabled for now.
    toast({ title: "Feature not available", description: "Avatar uploads are not supported in local mode."})
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // This functionality is disabled in local mode.
  };

  if (loading || !user) {
    return (
        <div className="flex flex-col min-h-screen bg-muted/40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <Card className="shadow-lg">
                    <CardHeader className="items-center text-center">
                         <div className="relative group w-24 h-24 mx-auto mb-4">
                            <Avatar className="w-24 h-24 border-4 border-primary">
                                <AvatarImage src={user.photoURL || undefined} data-ai-hint="person" />
                                <AvatarFallback><User className="w-10 h-10"/></AvatarFallback>
                            </Avatar>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <button
                                onClick={handleAvatarClick}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="w-8 h-8 text-white animate-spin"/> : <Camera className="w-8 h-8 text-white" />}
                            </button>
                        </div>

                        {isEditing ? (
                            <div className="w-full space-y-2">
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="text-center text-2xl font-bold h-12" disabled={isSaving}/>
                                <p className="text-muted-foreground">{email}</p>
                            </div>
                        ) : (
                            <>
                                <CardTitle className="text-3xl">{user.displayName || "New User"}</CardTitle>
                                <CardDescription>{user.email}</CardDescription>
                            </>
                        )}
                         <div className="mt-4 flex gap-2">
                             {isEditing ? (
                                <>
                                    <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                        Save
                                    </Button>
                                     <Button variant="outline" onClick={handleCancel} className="flex-1" disabled={isSaving}>
                                        <X className="mr-2 h-4 w-4"/>
                                        Cancel
                                    </Button>
                                </>
                             ) : (
                                <Button onClick={() => setIsEditing(true)} className="w-full">
                                    <Edit className="mr-2 h-4 w-4"/>
                                    Edit Profile
                                </Button>
                             )}
                         </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6 text-sm">
                         <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground flex items-center gap-2"><Calendar /> Joined Date</span>
                                <span className="font-medium">{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground flex items-center gap-2"><Star /> Status</span>
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>
                            </div>
                             <Button variant="outline" className="w-full" onClick={logoutUser}>
                                 <LogOut className="mr-2 h-4 w-4" />
                                 Logout
                             </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2 space-y-8">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CreditCard /> Subscription & Billing</CardTitle>
                        <CardDescription>Manage your plan and view your payment history.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                                <p className="text-muted-foreground">Current Plan</p>
                                <p className="text-xl font-bold">{user.plan || 'Free'}</p>
                            </div>
                             <Button variant="outline">Manage Subscription</Button>
                        </div>
                        <div className="mt-4">
                            <Button variant="link" className="p-0">View Billing History</Button>
                        </div>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bell /> Notification Settings</CardTitle>
                        <CardDescription>Choose how you want to be notified.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                             <Label htmlFor="product-updates" className="font-medium">Product Updates</Label>
                             <Switch id="product-updates" checked={notifications.productUpdates} onCheckedChange={(checked) => setNotifications(p => ({...p, productUpdates: checked}))} />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                             <Label htmlFor="security-alerts" className="font-medium">Security Alerts</Label>
                             <Switch id="security-alerts" checked={notifications.securityAlerts} onCheckedChange={(checked) => setNotifications(p => ({...p, securityAlerts: checked}))} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
