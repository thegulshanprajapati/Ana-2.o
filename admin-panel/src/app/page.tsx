
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Users, Calendar as CalendarIcon, Loader2, BrainCircuit, FileUp, Trash2, FileText, Send, BellOff, MessageSquare, ThumbsUp, ThumbsDown, Link as LinkIcon, SlidersHorizontal, Activity, RefreshCcw, Cpu, Sparkles, ChevronLeft, ChevronRight, Menu, Lock } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';

import { cn } from "@/lib/utils";
import { getUserById, getUserByEmail, getAllUsers, updateUserData, getTrainingFiles, saveTrainingFile, deleteTrainingFile, saveNotification, clearAllNotifications, getFeedback, getToolFeatureSettings, updateToolFeatureSettings, ToolFeatureSettings, UserData, Feedback, getBrainDocuments, deleteUserById } from "@/lib/local-data";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

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
            setFiles(fileList.filter(file => file !== 'Beautify Prompt.txt'));
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
            if (file.name === 'Beautify Prompt.txt') {
                toast({ variant: 'destructive', title: 'Invalid File', description: 'Beautify Prompt.txt must be managed in the dedicated Beautify Prompt section.' });
                return;
            }
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

function BeautifyPromptManagement() {
    const { toast } = useToast();
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchBeautifyPrompt = async () => {
        setIsLoading(true);
        try {
            const docs = await getBrainDocuments();
            const beautifyPromptDoc = docs.find((doc) => doc.fileName === 'Beautify Prompt.txt');
            if (beautifyPromptDoc) {
                setContent(beautifyPromptDoc.content);
            } else {
                setContent("");
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to fetch beautify prompt' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBeautifyPrompt();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveTrainingFile('Beautify Prompt.txt', content);
            toast({ title: 'Beautify Prompt Saved', description: 'The custom instructions have been updated successfully.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: (error as Error).message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-yellow-500" /> Beautify Prompt Control</CardTitle>
                <CardDescription>Configure rules to optimize and beautify user inputs before sending them to the AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="beautify-content">Beautify System Prompt Content</Label>
                            <Textarea
                                id="beautify-content"
                                className="font-mono text-xs h-60"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Enter instructions to refine and beautify inputs..."
                            />
                        </div>
                        <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Save Beautify Prompt
                        </Button>
                    </>
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

interface VisitAnalyticsSummary {
    selectedDate: string;
    visitsOnDate: number;
    uniqueVisitorsOnDate: number;
    totalVisits: number;
    totalUniqueVisitors: number;
    liveUsers: number;
    byPageOnDate: Array<{
        path: string;
        visits: number;
    }>;
}

const toDateKey = (value: Date): string => format(value, 'yyyy-MM-dd');

function VisitAnalyticsPanel({
    adminUserId,
    adminEmail,
}: {
    adminUserId: string | null;
    adminEmail: string | null;
}) {
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [summary, setSummary] = useState<VisitAnalyticsSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSummary = useCallback(
        async (targetDate: Date, options?: { silent?: boolean }) => {
            if (!adminUserId && !adminEmail) {
                return;
            }

            const isSilent = options?.silent ?? false;
            if (!isSilent) {
                setIsLoading(true);
            }

            try {
                const dateKey = toDateKey(targetDate);
                const adminUserIdParam = adminUserId
                    ? `adminUserId=${encodeURIComponent(adminUserId)}`
                    : '';
                const adminEmailParam = adminEmail
                    ? `adminEmail=${encodeURIComponent(adminEmail)}`
                    : '';
                const query = [adminUserIdParam, adminEmailParam, `date=${encodeURIComponent(dateKey)}`]
                    .filter(Boolean)
                    .join('&');
                const response = await fetch(
                    `/api/analytics?${query}`,
                    { cache: 'no-store' }
                );

                if (!response.ok) {
                    throw new Error(`Failed to load analytics (${response.status}).`);
                }

                const payload = (await response.json()) as VisitAnalyticsSummary;
                setSummary(payload);
            } catch (error) {
                console.error('Failed to fetch visit analytics:', error);
                if (!isSilent) {
                    toast({
                        variant: 'destructive',
                        title: 'Failed to load visit analytics',
                    });
                }
            } finally {
                if (!isSilent) {
                    setIsLoading(false);
                }
            }
        },
        [adminEmail, adminUserId, toast]
    );

    useEffect(() => {
        if (!adminUserId && !adminEmail) {
            setIsLoading(false);
            return;
        }
        void fetchSummary(selectedDate);
    }, [adminEmail, adminUserId, selectedDate, fetchSummary]);

    useEffect(() => {
        if (!adminUserId && !adminEmail) {
            return;
        }

        const timer = window.setInterval(() => {
            void fetchSummary(selectedDate, { silent: true });
        }, 15000);

        return () => window.clearInterval(timer);
    }, [adminEmail, adminUserId, selectedDate, fetchSummary]);

    if (!adminUserId && !adminEmail) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity />
                        Visit Analytics
                    </CardTitle>
                    <CardDescription>Admin session required.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity />
                    Visit Analytics Dashboard
                </CardTitle>
                <CardDescription>
                    Date-wise page visits, total traffic, and live users (last 2 minutes).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="justify-start text-left font-normal w-full sm:w-auto">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(selectedDate, 'PPP')}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                    if (date) {
                                        setSelectedDate(date);
                                    }
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Button
                        variant="outline"
                        onClick={() => void fetchSummary(selectedDate)}
                        disabled={isLoading}
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>

                {isLoading && !summary ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Selected Day Visits</p>
                                <p className="text-2xl font-semibold">{summary?.visitsOnDate ?? 0}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Selected Day Unique Visitors</p>
                                <p className="text-2xl font-semibold">{summary?.uniqueVisitorsOnDate ?? 0}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Total Visits</p>
                                <p className="text-2xl font-semibold">{summary?.totalVisits ?? 0}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Total Unique Visitors</p>
                                <p className="text-2xl font-semibold">{summary?.totalUniqueVisitors ?? 0}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Live Users</p>
                                <p className="text-2xl font-semibold text-green-600">{summary?.liveUsers ?? 0}</p>
                            </div>
                        </div>

                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Page Path</TableHead>
                                        <TableHead className="text-right">Visits</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summary?.byPageOnDate?.length ? (
                                        summary.byPageOnDate.map((item) => (
                                            <TableRow key={item.path}>
                                                <TableCell className="font-mono text-xs">{item.path}</TableCell>
                                                <TableCell className="text-right">{item.visits}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                                                No visits recorded for this date.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

interface TokenSummary {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalRequests: number;
}

interface DailyUsageItem {
  date: string;
  prompt: number;
  completion: number;
  total: number;
}

interface ModelUsageItem {
  model: string;
  prompt: number;
  completion: number;
  total: number;
  count: number;
}

interface RecentUsageItem {
  id: string;
  userId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  createdAt: string;
}

function TokenUsagePanel() {
    const { toast } = useToast();
    const [summary, setSummary] = useState<TokenSummary | null>(null);
    const [dailyUsage, setDailyUsage] = useState<DailyUsageItem[]>([]);
    const [modelUsage, setModelUsage] = useState<ModelUsageItem[]>([]);
    const [recentUsage, setRecentUsage] = useState<RecentUsageItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTokenStats = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/token-usage');
            if (res.ok) {
                const data = await res.json();
                setSummary(data.summary);
                setDailyUsage(data.dailyUsage);
                setModelUsage(data.modelUsage);
                setRecentUsage(data.recentUsage);
            } else {
                toast({ variant: 'destructive', title: 'Failed to fetch token stats' });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error loading token stats' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTokenStats();
    }, []);

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" /> Token Usage Analytics</CardTitle>
                    <CardDescription>Monitor AI model token consumption across users</CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={fetchTokenStats} disabled={isLoading}>
                    <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 border rounded-lg bg-card/50">
                                <div className="text-sm font-medium text-muted-foreground">Total Tokens</div>
                                <div className="text-2xl font-bold mt-1">{summary?.totalTokens.toLocaleString() || 0}</div>
                            </div>
                            <div className="p-4 border rounded-lg bg-card/50">
                                <div className="text-sm font-medium text-muted-foreground">Prompt Tokens</div>
                                <div className="text-2xl font-bold mt-1">{summary?.totalPromptTokens.toLocaleString() || 0}</div>
                            </div>
                            <div className="p-4 border rounded-lg bg-card/50">
                                <div className="text-sm font-medium text-muted-foreground">Completion Tokens</div>
                                <div className="text-2xl font-bold mt-1">{summary?.totalCompletionTokens.toLocaleString() || 0}</div>
                            </div>
                            <div className="p-4 border rounded-lg bg-card/50">
                                <div className="text-sm font-medium text-muted-foreground">Total Requests</div>
                                <div className="text-2xl font-bold mt-1">{summary?.totalRequests.toLocaleString() || 0}</div>
                            </div>
                        </div>

                        {dailyUsage.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm">Daily Token Consumption</h3>
                                <div className="h-[240px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dailyUsage}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <ChartTooltip />
                                            <Legend />
                                            <Area type="monotone" dataKey="prompt" stackId="1" stroke="#3b82f6" fill="#3b82f6" opacity={0.6} name="Prompt" />
                                            <Area type="monotone" dataKey="completion" stackId="1" stroke="#10b981" fill="#10b981" opacity={0.6} name="Completion" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {modelUsage.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm">Token Consumption by Model</h3>
                                    <div className="h-[220px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={modelUsage}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="model" tickFormatter={(v) => v.split('/').pop() || v} />
                                                <YAxis />
                                                <ChartTooltip />
                                                <Legend />
                                                <Bar dataKey="total" fill="#ec4899" name="Total Tokens" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm">Recent Generation Logs</h3>
                                <ScrollArea className="h-[220px] border rounded-lg p-2">
                                    <div className="space-y-2">
                                        {recentUsage.map((log) => (
                                            <div key={log.id} className="flex justify-between items-center text-xs p-2 border-b last:border-b-0">
                                                <div>
                                                    <span className="font-semibold block truncate max-w-[150px]">{log.model.split('/').pop()}</span>
                                                    <span className="text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold">{log.totalTokens} tokens</span>
                                                    <span className="text-muted-foreground block text-[10px]">P: {log.promptTokens} | C: {log.completionTokens}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {recentUsage.length === 0 && (
                                            <div className="text-center text-muted-foreground py-12 text-sm">No usage logs available.</div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default function AdminPage() {
    const { toast } = useToast();
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminUser, setAdminUser] = useState<UserData | null>(null);
    const [isSessionLoading, setIsSessionLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics' | 'training' | 'beautify' | 'features' | 'notifications' | 'feedback'>('overview');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const [email, setEmail] = useState("support@my.ana");
    const [password, setPassword] = useState("Ana@01");
    const [users, setUsers] = useState<UserData[]>([]);
    const [isFetchingUsers, setIsFetchingUsers] = useState(true);

    // State for personal notification dialog
    const [notificationUser, setNotificationUser] = useState<UserData | null>(null);
    const [notificationTitle, setNotificationTitle] = useState("");
    const [notificationDescription, setNotificationDescription] = useState("");
    const [isSendingPersonal, setIsSendingPersonal] = useState(false);

    const adminEmail = adminUser?.email || "";

    // Check session on mount
    useEffect(() => {
      const checkSession = async () => {
        setIsSessionLoading(true);
        try {
          const cachedId = sessionStorage.getItem('adminUserId') || sessionStorage.getItem('userId');
          if (cachedId) {
            const userObj = await getUserById(cachedId);
            if (userObj && (userObj.role === 'admin' || userObj.email === 'support@my.ana')) {
              setAdminUser(userObj);
              setIsAdmin(true);
            }
          }
        } catch (error) {
          console.error("Session check failed:", error);
        } finally {
          setIsSessionLoading(false);
        }
      };
      checkSession();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
          const userToLogin = await getUserByEmail(email);
          if (userToLogin && userToLogin.password === password) {
            if (userToLogin.role === 'admin' || userToLogin.email === 'support@my.ana') {
              sessionStorage.setItem('adminUserId', userToLogin.id);
              setAdminUser(userToLogin);
              setIsAdmin(true);
              toast({
                title: "Login Successful",
                description: "Welcome to the admin dashboard.",
              });
            } else {
              toast({
                variant: "destructive",
                title: "Access Denied",
                description: "Only administrators can access this panel.",
              });
            }
          } else {
            toast({
              variant: "destructive",
              title: "Login Failed",
              description: "Invalid admin credentials.",
            });
          }
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Login Error",
            description: "An error occurred during login.",
          });
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('adminUserId');
        setAdminUser(null);
        setIsAdmin(false);
        toast({
          title: "Logged Out",
          description: "You have been logged out of the admin panel.",
        });
    };

    useEffect(() => {
      if (!isAdmin) return;
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
      fetchUsers();
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
    
    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteUserById(userId);
            toast({ title: 'User Deleted', description: 'The user and all associated data have been permanently removed.' });
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: (error as Error).message });
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
                            <Button type="submit" className="w-full">
                                Log In
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-screen bg-muted/40 overflow-hidden">
            {/* Fixed Sticky Header with Security Status */}
            <header className="fixed top-0 left-0 right-0 h-16 border-b bg-card/85 backdrop-blur-md shadow-sm z-30 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="md:flex">
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <ShieldCheck className="text-primary h-6 w-6" />
                        <span className="hidden sm:inline">Ana Admin Control</span>
                    </div>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1 font-mono text-[10px] ml-2">
                        <Lock className="h-2.5 w-2.5" /> SECURE SESSION
                    </Badge>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground hidden lg:inline">Signed in as: <strong>{adminEmail}</strong></span>
                    <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
                </div>
            </header>

            {/* Layout below header */}
            <div className="flex flex-1 pt-16 overflow-hidden">
                {/* Left Sidepanel (Collapsible) */}
                <aside className={cn(
                    "border-r bg-card flex flex-col p-4 space-y-1 transition-all duration-300 relative",
                    isSidebarCollapsed ? "w-16" : "w-64"
                )}>
                    {!isSidebarCollapsed && (
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Control Navigation
                        </div>
                    )}
                    <div className="flex-1 space-y-1">
                        <Button
                            variant={activeTab === 'overview' ? 'default' : 'ghost'}
                            className={cn("justify-start gap-3 w-full", isSidebarCollapsed && "justify-center p-0")}
                            onClick={() => setActiveTab('overview')}
                            title="Overview (Tokens)"
                        >
                            <Cpu className="h-4 w-4" />
                            {!isSidebarCollapsed && <span>Overview (Tokens)</span>}
                        </Button>
                        <Button
                            variant={activeTab === 'users' ? 'default' : 'ghost'}
                            className={cn("justify-start gap-3 w-full", isSidebarCollapsed && "justify-center p-0")}
                            onClick={() => setActiveTab('users')}
                            title="User Management"
                        >
                            <Users className="h-4 w-4" />
                            {!isSidebarCollapsed && <span>User Management</span>}
                        </Button>
                        <Button
                            variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                            className={cn("justify-start gap-3 w-full", isSidebarCollapsed && "justify-center p-0")}
                            onClick={() => setActiveTab('analytics')}
                            title="Visit Analytics"
                        >
                            <Activity className="h-4 w-4" />
                            {!isSidebarCollapsed && <span>Visit Analytics</span>}
                        </Button>
                        <Button
                            variant={activeTab === 'training' ? 'default' : 'ghost'}
                            className={cn("justify-start gap-3 w-full", isSidebarCollapsed && "justify-center p-0")}
                            onClick={() => setActiveTab('training')}
                            title="Training Data"
                        >
                            <BrainCircuit className="h-4 w-4" />
                            {!isSidebarCollapsed && <span>Training Data</span>}
                        </Button>
                        <Button
                            variant={activeTab === 'beautify' ? 'default' : 'ghost'}
                            className={cn("justify-start gap-3 w-full", isSidebarCollapsed && "justify-center p-0")}
                            onClick={() => setActiveTab('beautify')}
                            title="Beautify Prompt"
                        >
                            <Sparkles className="h-4 w-4" />
                            {!isSidebarCollapsed && <span>Beautify Prompt</span>}
                        </Button>
                        <Button
                            variant={activeTab === 'features' ? 'default' : 'ghost'}
                            className={cn("justify-start gap-3 w-full", isSidebarCollapsed && "justify-center p-0")}
                            onClick={() => setActiveTab('features')}
                            title="Feature Control"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            {!isSidebarCollapsed && <span>Feature Control</span>}
                        </Button>
                        <Button
                            variant={activeTab === 'notifications' ? 'default' : 'ghost'}
                            className={cn("justify-start gap-3 w-full", isSidebarCollapsed && "justify-center p-0")}
                            onClick={() => setActiveTab('notifications')}
                            title="Send Notification"
                        >
                            <Send className="h-4 w-4" />
                            {!isSidebarCollapsed && <span>Send Notification</span>}
                        </Button>
                        <Button
                            variant={activeTab === 'feedback' ? 'default' : 'ghost'}
                            className={cn("justify-start gap-3 w-full", isSidebarCollapsed && "justify-center p-0")}
                            onClick={() => setActiveTab('feedback')}
                            title="User Feedback"
                        >
                            <MessageSquare className="h-4 w-4" />
                            {!isSidebarCollapsed && <span>User Feedback</span>}
                        </Button>
                    </div>

                    {/* Expand/Collapse Toggle Footer inside Sidebar */}
                    <div className="pt-2 border-t flex justify-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hidden md:flex"
                        >
                            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </Button>
                    </div>
                </aside>

                {/* Main panel content (Independently scrollable) */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 bg-muted/30">
                    {/* Active tab content */}
                    {activeTab === 'overview' && <TokenUsagePanel />}
                    {activeTab === 'training' && <TrainingDataManagement />}
                    {activeTab === 'beautify' && <BeautifyPromptManagement />}
                    {activeTab === 'features' && <FeatureAccessControls adminEmail={adminEmail} />}
                    {activeTab === 'notifications' && <NotificationSender />}
                    {activeTab === 'analytics' && (
                        <VisitAnalyticsPanel
                            adminUserId={adminUser?.id || null}
                            adminEmail={adminEmail}
                        />
                    )}
                    {activeTab === 'users' && (
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
                                            <TableHead>Community</TableHead>
                                            <TableHead>Ana Connect</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => {
                                            const hasJoinedCommunity = (user as any).communityJoined || (user as any).isCommunityJoined || (user.connectProfile?.followingUserIds && user.connectProfile.followingUserIds.length > 0) || false;
                                            const hasConnectProfile = !!user.connectProfile && !!user.connectProfile.handle;
                                            return (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{user.displayName || "N/A"}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                                            <span>{user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {hasJoinedCommunity ? (
                                                            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20" variant="outline">Joined</Badge>
                                                        ) : (
                                                            <Badge className="text-muted-foreground bg-muted/30 border-muted-foreground/20" variant="outline">Not Joined</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {hasConnectProfile ? (
                                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20" variant="outline">Active (@{user.connectProfile?.handle})</Badge>
                                                        ) : (
                                                            <Badge className="text-muted-foreground bg-muted/30 border-muted-foreground/20" variant="outline">Inactive</Badge>
                                                        )}
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
                                                    <TableCell className="text-right flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => setNotificationUser(user)}>
                                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                            <span className="sr-only">Send Notification</span>
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" disabled={user.email === adminEmail}>
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                    <span className="sr-only">Delete User</span>
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This will permanently delete the user <span className="font-semibold">{user.displayName || user.email}</span>, their entire chat history, and all account data. This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction className="bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                                )}
                            </CardContent>
                        </Card>
                    )}
                    {activeTab === 'feedback' && <FeedbackViewer />}
                </main>
            </div>
            
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

    
