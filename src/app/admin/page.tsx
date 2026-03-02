
"use client";

import { useState, useContext, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Users, Calendar, Loader2, BrainCircuit, FileUp, Trash2, FileText, Send, BellOff, MessageSquare, ThumbsUp, ThumbsDown, Link as LinkIcon, SlidersHorizontal } from "lucide-react";
import { AppContext, UserData, Feedback, Notification } from "@/context/AppContext";
import { getAllUsers, updateUserData, getTrainingFiles, saveTrainingFile, deleteTrainingFile, saveNotification, clearAllNotifications, getFeedback, getToolFeatureSettings, updateToolFeatureSettings, ToolFeatureSettings } from "@/lib/local-data";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import axios from "axios";

function TrainingDataManagement() {
    const { toast } = useToast();
    const [files, setFiles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [sitemapUrl, setSitemapUrl] = useState("");
    const [isFetchingSitemap, setIsFetchingSitemap] = useState(false);

    const fetchFiles = async () => {
        setIsLoading(true);
        try {
            const fileList = await getTrainingFiles();
            setFiles(fileList);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to fetch training files' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            if (file.type === 'text/plain' || file.type === 'text/markdown' || file.name.endsWith('.json')) {
                setFileToUpload(file);
            } else {
                toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload .txt, .md or .json files.' });
            }
        }
    };

    const handleUpload = async () => {
        if (!fileToUpload) return;
        setIsUploading(true);
        try {
            const content = await fileToUpload.text();
            await saveTrainingFile(fileToUpload.name, content);
            toast({ title: 'File Uploaded', description: `${fileToUpload.name} has been added to the knowledge base.` });
            setFileToUpload(null);
            fetchFiles(); // Refresh file list
        } catch (error) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: (error as Error).message });
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleDelete = async (fileName: string) => {
        try {
            await deleteTrainingFile(fileName);
            toast({ title: 'File Deleted', description: `${fileName} has been removed.` });
            fetchFiles(); // Refresh file list
        } catch (error) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: (error as Error).message });
        }
    }
    
    const handleFetchSitemap = async () => {
        setIsFetchingSitemap(true);
        toast({
            title: "Starting Sitemap Training",
            description: "Fetching content from sitemap. This may take a moment..."
        });

        try {
            // This is a placeholder for a real API call.
            // In a real scenario, this would be an API route that calls a Genkit flow.
            console.log(`Fetching sitemap from: ${sitemapUrl}`);
            // const response = await axios.post('/api/train-from-sitemap', { url: sitemapUrl });
            
            // Simulating a successful fetch for now.
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            toast({
                title: "Training Complete",
                description: "AI has been trained with content from the sitemap."
            });

            // After training, you might want to refresh the file list
            fetchFiles();
        } catch (error) {
            console.error("Sitemap training failed:", error);
            toast({
                variant: "destructive",
                title: "Training Failed",
                description: "Could not fetch or process the sitemap."
            });
        } finally {
            setIsFetchingSitemap(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BrainCircuit /> Training Data</CardTitle>
                <CardDescription>Manage the AI's knowledge base. Upload files or train from a sitemap URL.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label htmlFor="sitemap-url" className="mb-2 block">Train from Sitemap</Label>
                    <div className="flex gap-2">
                        <Input
                            id="sitemap-url"
                            type="url"
                            placeholder="https://example.com/sitemap.xml"
                            value={sitemapUrl}
                            onChange={(e) => setSitemapUrl(e.target.value)}
                            disabled={isFetchingSitemap}
                        />
                        <Button onClick={handleFetchSitemap} disabled={isFetchingSitemap || !sitemapUrl}>
                            {isFetchingSitemap ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LinkIcon className="mr-2 h-4 w-4"/>}
                            Fetch
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                        OR
                        </span>
                    </div>
                </div>
                
                <div>
                     <Label htmlFor="file-upload" className="mb-2 block">Upload a File</Label>
                    <div className="flex gap-2">
                        <Input id="file-upload" type="file" accept=".txt,.md,.json" onChange={handleFileChange} />
                        <Button onClick={handleUpload} disabled={!fileToUpload || isUploading}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4"/>}
                            Upload
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Upload .txt, .md, or .json files.</p>
                </div>
                
                <Separator />
                <h4 className="font-semibold">Uploaded Files</h4>
                {isLoading ? (
                     <div className="flex justify-center items-center h-20">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : files.length > 0 ? (
                    <ScrollArea className="h-48">
                        <ul className="space-y-2 pr-4">
                           {files.map(file => (
                               <li key={file} className="flex items-center justify-between rounded-md border p-2">
                                   <span className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4"/>{file}</span>
                                   <AlertDialog>
                                     <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Trash2 className="h-4 w-4 text-red-500"/>
                                        </Button>
                                     </AlertDialogTrigger>
                                     <AlertDialogContent>
                                        <AlertDialogHeader>
                                             <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                             <AlertDialogDescription>
                                                 This will permanently delete the file <span className="font-semibold">{file}</span> from the AI's knowledge base.
                                             </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                                             <AlertDialogAction onClick={() => handleDelete(file)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                     </AlertDialogContent>
                                   </AlertDialog>
                               </li>
                           ))}
                        </ul>
                    </ScrollArea>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No training files uploaded yet.</p>
                )}
            </CardContent>
        </Card>
    );
}

function NotificationSender() {
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!title || !description) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please provide a title and description.' });
            return;
        }
        setIsSending(true);
        try {
            await saveNotification({ title, description, userId: null }); // userId: null for broadcast
            toast({ title: 'Notification Sent!', description: 'The notification has been broadcast to all users.' });
            setTitle('');
            setDescription('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Send Failed', description: (error as Error).message });
        } finally {
            setIsSending(false);
        }
    };

    const handleClear = async () => {
        setIsSending(true);
        try {
            await clearAllNotifications();
            toast({ title: "Broadcast Notifications Cleared", description: "All broadcast notifications have been deleted." });
        } catch (error) {
            toast({ variant: "destructive", title: "Clear Failed", description: (error as Error).message });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Send /> Broadcast Notification</CardTitle>
                <CardDescription>Send a notification to all registered users or clear existing broadcast messages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="notif-title">Title</Label>
                    <Input
                        id="notif-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., New Feature Alert!"
                        disabled={isSending}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notif-desc">Description</Label>
                    <Textarea
                        id="notif-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., You can now generate images with our new AI model."
                        disabled={isSending}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleSend} disabled={isSending || !title || !description} className="w-full">
                        {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Send Notification
                    </Button>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" className="w-full" disabled={isSending}>
                                <BellOff className="mr-2 h-4 w-4" />
                                Clear Broadcasts
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will permanently delete all broadcast notifications for all users. Personal notifications will not be affected.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClear}>
                                    Yes, clear broadcasts
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
}

type ToolFeatureToggleKey = keyof Pick<
  ToolFeatureSettings,
  'imageGeneratorInDevelopment' | 'docGeneratorInDevelopment' | 'codeStudioInDevelopment'
>;

const TOOL_FEATURE_TOGGLES: Array<{
  key: ToolFeatureToggleKey;
  label: string;
  description: string;
}> = [
  {
    key: 'imageGeneratorInDevelopment',
    label: 'Image Generator',
    description: 'ON karne par users ko Development Phase screen dikhegi.',
  },
  {
    key: 'docGeneratorInDevelopment',
    label: 'Doc Generator',
    description: 'ON karne par users ko Development Phase screen dikhegi.',
  },
  {
    key: 'codeStudioInDevelopment',
    label: 'AI Code Studio',
    description: 'ON karne par users ko Development Phase screen dikhegi.',
  },
];

function FeatureAccessControls({ adminEmail }: { adminEmail: string | null }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ToolFeatureSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<ToolFeatureToggleKey | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const current = await getToolFeatureSettings();
        setSettings(current);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load feature toggles',
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [toast]);

  const handleToggle = async (key: ToolFeatureToggleKey, checked: boolean) => {
    if (!settings) {
      return;
    }

    const previous = settings;
    const optimistic: ToolFeatureSettings = { ...settings, [key]: checked };
    setSettings(optimistic);
    setSavingKey(key);

    try {
      const updated = await updateToolFeatureSettings({
        [key]: checked,
        updatedBy: adminEmail,
      });
      setSettings(updated);
      toast({
        title: 'Feature toggle updated',
        description: `${TOOL_FEATURE_TOGGLES.find((item) => item.key === key)?.label} set to ${
          checked ? 'Development Phase' : 'Live'
        }.`,
      });
    } catch (error) {
      setSettings(previous);
      toast({
        variant: 'destructive',
        title: 'Failed to update toggle',
      });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal />
          Feature Toggles
        </CardTitle>
        <CardDescription>
          In switches ko ON karoge to selected tools users ko Development Phase dikhayenge.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading || !settings ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            {TOOL_FEATURE_TOGGLES.map((toggle) => (
              <div
                key={toggle.key}
                className="flex items-start justify-between gap-4 rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{toggle.label}</p>
                  <p className="text-xs text-muted-foreground">{toggle.description}</p>
                </div>
                <Switch
                  checked={settings[toggle.key]}
                  onCheckedChange={(checked) => handleToggle(toggle.key, checked)}
                  disabled={savingKey !== null}
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Last updated:{' '}
              {settings.updatedAt === new Date(0).toISOString()
                ? 'never'
                : new Date(settings.updatedAt).toLocaleString()}
              {settings.updatedBy ? ` by ${settings.updatedBy}` : ''}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function FeedbackViewer() {
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchFeedback = async () => {
            setIsLoading(true);
            try {
                const feedbackList = await getFeedback();
                setFeedback(feedbackList);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Failed to fetch feedback' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchFeedback();
    }, [toast]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare /> User Feedback</CardTitle>
                <CardDescription>Review user feedback on AI responses.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <ScrollArea className="h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Feedback</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {feedback.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.userName}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2">
                                                <Badge variant={item.feedbackType === 'like' ? 'default' : 'destructive'} className="w-fit">
                                                    {item.feedbackType === 'like' ? 
                                                        <ThumbsUp className="mr-1 h-3 w-3" /> : 
                                                        <ThumbsDown className="mr-1 h-3 w-3" />}
                                                    {item.feedbackType}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground p-2 bg-muted rounded-md">
                                                    <span className="font-semibold">Response:</span> "{item.messageContent}"
                                                </p>
                                                {item.comment && (
                                                    <p className="text-xs text-destructive p-2 bg-destructive/10 rounded-md">
                                                        <span className="font-semibold">Comment:</span> "{item.comment}"
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {feedback.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            No feedback submitted yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}

export default function AdminPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { isAdmin, loginUser, logoutUser, userEmail: adminEmail, loading: isSessionLoading } = useContext(AppContext);
    const [email, setEmail] = useState("support@my.ana");
    const [password, setPassword] = useState("Ana@01");
    const [users, setUsers] = useState<UserData[]>([]);
    const [isFetchingUsers, setIsFetchingUsers] = useState(true);

    // State for personal notification dialog
    const [notificationUser, setNotificationUser] = useState<UserData | null>(null);
    const [notificationTitle, setNotificationTitle] = useState("");
    const [notificationDescription, setNotificationDescription] = useState("");
    const [isSendingPersonal, setIsSendingPersonal] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await loginUser({ email, password });
        if (success) {
            toast({
                title: "Login Successful",
                description: "Welcome to the admin dashboard.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: "Invalid admin credentials.",
            });
        }
    };

    useEffect(() => {
      const fetchUsers = async () => {
        setIsFetchingUsers(true);
        try {
          const userList = await getAllUsers();
          setUsers(userList);
        } catch (error) {
          console.error("Error fetching users: ", error);
          toast({ variant: 'destructive', title: 'Failed to fetch users' });
        } finally {
          setIsFetchingUsers(false);
        }
      };

      if (isAdmin) {
          fetchUsers();
      } else {
          setIsFetchingUsers(false);
      }
    }, [isAdmin, toast]);
    
    const handlePlanChange = async (userId: string, newPlan: UserData['plan']) => {
        try {
            const userToUpdate = users.find(u => u.id === userId);
            if(userToUpdate) {
                const updatedUser = { ...userToUpdate, plan: newPlan };
                await updateUserData(updatedUser);
                setUsers(prevUsers => prevUsers.map(u => u.id === userId ? updatedUser : u));
                toast({
                    title: "Plan Updated",
                    description: `User plan has been successfully changed to ${newPlan}.`,
                });
            }
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Update Failed",
                description: `Could not update user's plan.`,
            });
        }
    };
    
    const handleSendPersonalNotification = async () => {
        if (!notificationUser || !notificationTitle || !notificationDescription) {
            toast({ variant: 'destructive', title: 'Missing fields' });
            return;
        }
        setIsSendingPersonal(true);
        try {
            await saveNotification({ title: notificationTitle, description: notificationDescription, userId: notificationUser.id });
            toast({ title: 'Notification Sent!', description: `Message sent to ${notificationUser.displayName}.` });
            setNotificationUser(null);
            setNotificationTitle("");
            setNotificationDescription("");
        } catch (error) {
             toast({ variant: 'destructive', title: 'Send Failed', description: (error as Error).message });
        } finally {
            setIsSendingPersonal(false);
        }
    };

    if (isSessionLoading) {
         return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl flex items-center justify-center gap-2"><ShieldCheck /> Admin Login</CardTitle>
                        <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@my.ana" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSessionLoading}>
                                {isSessionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Log In
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <AppHeader />
            <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck /> Admin Dashboard</h1>
                    <Button onClick={logoutUser}>Logout</Button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-1 space-y-8">
                        <TrainingDataManagement />
                        <FeatureAccessControls adminEmail={adminEmail} />
                        <NotificationSender />
                    </div>
                    <div className="xl:col-span-2 grid grid-rows-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Users /> User Management</CardTitle>
                                <CardDescription>Manage all registered users and their subscription plans.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isFetchingUsers ? (
                                    <div className="flex justify-center items-center h-40">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    </div>
                                ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Joined On</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="font-medium">{user.displayName || "N/A"}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                                        <span>{user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={user.plan} onValueChange={(value) => handlePlanChange(user.id, value as UserData['plan'])} disabled={user.email === adminEmail}>
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue placeholder="Select plan" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Free">Free</SelectItem>
                                                            <SelectItem value="Business">Business</SelectItem>
                                                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => setNotificationUser(user)}>
                                                        <MessageSquare className="h-4 w-4" />
                                                        <span className="sr-only">Send Notification</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                )}
                            </CardContent>
                        </Card>
                         <FeedbackViewer />
                    </div>
                </div>
            </main>
            <AppFooter />
            
            <Dialog open={!!notificationUser} onOpenChange={(open) => !open && setNotificationUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Notification to {notificationUser?.displayName}</DialogTitle>
                        <DialogDescription>
                            This message will only be visible to this user.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="personal-notif-title">Title</Label>
                            <Input
                                id="personal-notif-title"
                                value={notificationTitle}
                                onChange={(e) => setNotificationTitle(e.target.value)}
                                placeholder="e.g., Your account update"
                                disabled={isSendingPersonal}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="personal-notif-desc">Description</Label>
                            <Textarea
                                id="personal-notif-desc"
                                value={notificationDescription}
                                onChange={(e) => setNotificationDescription(e.target.value)}
                                placeholder="e.g., Your subscription has been successfully upgraded."
                                disabled={isSendingPersonal}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNotificationUser(null)}>Cancel</Button>
                        <Button onClick={handleSendPersonalNotification} disabled={isSendingPersonal || !notificationTitle || !notificationDescription}>
                            {isSendingPersonal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Send
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

    
