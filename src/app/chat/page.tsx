
"use client";

import { useState, useRef, useEffect, type FormEvent, useContext, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateResponse, AiResponse } from "@/ai/flows/generate-response";
import { generateAudio } from "@/ai/flows/generate-audio";
import { generateTitle } from "@/ai/flows/generate-title";
import { saveConversationToBrain, getNotifications, saveFeedback, deleteUserById } from "@/lib/local-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, User, Plus, Paperclip, XCircle, File as FileIcon, Home, History, Loader2, Volume2, BotIcon, MessageSquare, Trash2, Clipboard, Check, ChevronDown, ThumbsUp, ThumbsDown, RefreshCw, Square, Sun, Moon, Bell, Languages, Globe, Search, BadgeCheck, Crown, MoreHorizontal, Pin, Archive, ArchiveRestore, Pencil, BellOff, Sparkles, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppContext, AppMessage, ChatSession, Language, Notification } from "@/context/AppContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import ReactMarkdown from "react-markdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { useCommunityStore } from "@/store/communityStore";


interface UploadedFile {
  name: string;
  type: string;
  content: string; // Base64 data URI for images, text content for PDFs
}

type AudioState = {
  [key: number]: {
    isLoading: boolean;
    audioUrl: string | null;
  };
};

interface FeedbackState {
  [key: number]: 'like' | 'dislike' | null;
}

interface SearchState {
  isSearching: boolean;
  query: string | null;
  startTime: number | null;
}

const GUEST_CHAT_LIMIT = 10;
const characters = [
  "Doctor Ana", "Coder Ana", "Wife Ana", "Motivator Ana", 
  "Hindi Hinglish", "Creative Domain", "Daily Life Support",
  "Emotional Intelligence", "Technical Domain", "Husband", "Raudy Boy", "Best Friend (Boy)", "Ex-boyfriend", "Gym Trainer", "Professor", "Police", "Judge", "Criminal", "Cook", "Ex-girlfriend"
];

const chatLanguages: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'en-hi', name: 'Hinglish' },
    { code: 'hi', name: 'Hindi' },
    { code: 'bn', name: 'Bengali' },
    { code: 'bh', name: 'Bhojpuri' },
];

const MAX_COMMUNITY_SUMMARY_CHARS = 2200;

const normalizeCommunityHandle = (value: string): string =>
  value.toLowerCase().trim().replace(/\s+/g, "_");

const truncateSnippet = (value: string, maxChars = 140): string => {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxChars) {
    return compact;
  }
  return `${compact.slice(0, Math.max(0, maxChars - 3)).trim()}...`;
};

const toTimestamp = (value: string): number => {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatHistoryDate = (value: string): string => {
  const timestamp = toTimestamp(value);
  if (!timestamp) {
    return "";
  }
  return format(new Date(timestamp), "dd MMM yyyy, p");
};


const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '').trimEnd();
    const isBlock = !inline;
    const language = match?.[1] || "text";

    const handleCopy = (event?: React.MouseEvent) => {
        event?.stopPropagation();
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        toast({ title: "Copied to clipboard!" });
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (isBlock) {
        return (
        <div className="relative">
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between bg-muted-foreground/20 px-4 py-1.5 rounded-t-md">
                <span className="text-xs font-sans text-foreground/80">{language}</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                    {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                    <span className="sr-only">Copy code</span>
                </Button>
            </div>
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                {...props}
                className="p-4 pt-10 rounded-md bg-muted-foreground/10 my-4 overflow-x-auto"
            >
                {code}
            </SyntaxHighlighter>
        </div>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 align-middle">
            <code
                className={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]", className)}
                {...props}
            >
                {children}
            </code>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
            >
                {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Clipboard className="h-3 w-3" />}
                <span className="sr-only">Copy inline code</span>
            </Button>
        </span>
    );
};

const TypingEffect = ({ text, onComplete, stop }: { text: string, onComplete: () => void, stop: boolean }) => {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const textRef = useRef(text);
  
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    if (stop) {
        setDisplayedText(textRef.current); // Show full message on stop
        onComplete();
        return;
    }
    
    if (text) {
      const intervalId = setInterval(() => {
        if (indexRef.current < textRef.current.length && !stop) {
          setDisplayedText((prev) => prev + textRef.current[indexRef.current]);
          indexRef.current += 1;
        } else {
          clearInterval(intervalId);
          onComplete();
        }
      }, 10); // Adjust typing speed here (milliseconds)

      return () => clearInterval(intervalId);
    } else {
        onComplete();
    }
  }, [text, onComplete, stop]);

  return <ReactMarkdown components={{ code: CodeBlock }}>{displayedText}</ReactMarkdown>;
};


export default function ChatPage() {
  const { communityPosts, communityComments } = useCommunityStore((state) => ({
    communityPosts: state.posts,
    communityComments: state.comments,
  }));

  const {
    messages,
    addMessage,
    setMessages,
    startNewChat,
    history,
    loadChat,
    activeChatId,
    updateChatTitle,
    deleteChat,
    toggleChatPinned,
    toggleChatArchived,
    isLoggedIn, isAdmin,
    userPlan, user,
    character,
    setCharacter,
    theme, setTheme,
    logoutUser,
    userName,
    notifications,
    fetchNotifications,
    lastCheckedNotifs,
    setLastCheckedNotifs,
    deleteNotification,
    clearNotifications,
  } = useContext(AppContext);

  const { t, language, setLanguage } = useTranslation();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState<AppMessage | null>(null);
  const [stopTyping, setStopTyping] = useState(false);
  const [guestChatCount, setGuestChatCount] = useState(0);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [audioState, setAudioState] = useState<AudioState>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchState, setSearchState] = useState<SearchState>({ isSearching: false, query: null, startTime: null });

  // Header state
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  // Custom Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'message' | 'input' | 'history' | null;
    data: any;
  }>({ x: 0, y: 0, type: null, data: null });

  useEffect(() => {
    const handleCloseMenu = () => {
      setContextMenu(prev => prev.type ? { ...prev, type: null } : prev);
    };
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, type: 'message' | 'input' | 'history', data?: any) => {
    e.preventDefault();
    const menuWidth = 200;
    const menuHeight = type === 'input' ? 260 : type === 'message' ? 180 : 220;
    
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    if (x < 10) x = 10;
    if (y < 10) y = 10;
    
    setContextMenu({ x, y, type, data });
  };

  const triggerMenuAtElement = (element: HTMLElement, type: 'message' | 'input' | 'history', data?: any) => {
    const rect = element.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = type === 'input' ? 260 : type === 'message' ? 180 : 220;
    
    let x = rect.left;
    let y = rect.bottom + 8;
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = rect.top - menuHeight - 8;
    }
    if (x < 10) x = 10;
    if (y < 10) y = 10;
    
    setContextMenu({ x, y, type, data });
  };

  // Feedback state
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({});
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<{ content: string, index: number } | null>(null);
  const [chatToDelete, setChatToDelete] = useState<ChatSession | null>(null);
  const [chatToRename, setChatToRename] = useState<ChatSession | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasUserMessages = useMemo(() => messages.some(m => m.role === 'user'), [messages]);

  // Auto-resize textarea height as user types, with a maximum limit before scrolling
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Focus input automatically on typing anywhere
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          activeEl.getAttribute('contenteditable') === 'true'
        ) {
          return;
        }
      }

      // Ignore modifier keys and control/special keys (length > 1)
      if (
        e.key.length !== 1 || 
        e.ctrlKey || 
        e.metaKey || 
        e.altKey
      ) {
        return;
      }

      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const suggestions = useMemo(() => [
    { icon: "✍️", label: "Draft content", desc: "Write a professional project introduction...", text: "Write a professional project introduction for my new AI app." },
    { icon: "💡", label: "Brainstorm ideas", desc: "Give me 5 unique project names for a fitness app", text: "Give me 5 unique project names for a mobile fitness app" },
    { icon: "💻", label: "Debug code", desc: "Help me find memory leaks in JavaScript...", text: "Explain how to find memory leaks in a JavaScript async function." },
    { icon: "🌍", label: "Translate text", desc: "Translate a greeting into Bhojpuri...", text: "Translate 'Hello, how are you? I am happy to meet you' into Bhojpuri" }
  ], []);

  const renderChatForm = (isCentered: boolean) => {
    return (
      <div className="w-full">
        {uploadedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 max-w-xl">
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border bg-muted/40 p-2 text-sm backdrop-blur-md shadow-sm gap-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  {file.type.startsWith('image/') ? (
                    <div className="h-8 w-8 rounded-lg overflow-hidden border bg-background shrink-0 flex items-center justify-center">
                      <img src={file.content} alt={file.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                      <FileIcon className="h-3.5 h-3.5" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 max-w-[120px]">
                    <span className="truncate font-semibold text-[11px] text-foreground/90 leading-tight">{file.name}</span>
                    <span className="text-[8px] text-muted-foreground uppercase font-medium">{file.type.split('/')[1] || 'file'}</span>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5 shrink-0 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors" onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <form ref={formRef} onSubmit={handleFormSubmit} className="flex items-start gap-2 w-full">
          <Popover>
              <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" disabled={isLoading || isTyping} className="shrink-0 h-10 w-10">
                    <Plus className="h-5 w-5" />
                    <span className="sr-only">More options</span>
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" side="top" align="start">
                  <div className="grid gap-4">
                      <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                          <div className="flex items-center space-x-2">
                              <Globe className="h-5 w-5" />
                              <Label htmlFor={`search-mode-${isCentered ? 'center' : 'bottom'}`} className="font-semibold">Web Search</Label>
                          </div>
                          <Switch
                              id={`search-mode-${isCentered ? 'center' : 'bottom'}`}
                              checked={searchMode}
                              onCheckedChange={setSearchMode}
                              disabled={isLoading || isTyping}
                          />
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                          <Paperclip className="mr-2 h-4 w-4" /> Attach File
                      </Button>
                       <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                          className="hidden"
                          accept="image/*,.pdf"
                      />
                  </div>
              </PopoverContent>
          </Popover>

          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onContextMenu={(e) => handleContextMenu(e, 'input')}
            onPaste={handlePaste}
            placeholder={t('chat.placeholder')}
            className={cn(
              "flex-1 resize-none min-h-[40px] max-h-[180px] overflow-y-auto focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none transition-all duration-200 px-2 py-2 border-0 focus:border-0 focus:ring-0 focus-visible:border-0 outline-none focus:outline-none shadow-none",
              isCentered 
                ? "bg-transparent placeholder:text-muted-foreground/60 text-base" 
                : "bg-background border rounded-md"
            )}
            rows={1}
            disabled={isLoading || isTyping}
            autoComplete="off"
          />
           {isTyping ? (
               <Button type="button" size="icon" variant="destructive" onClick={() => setStopTyping(true)} aria-label="Stop generation" className="shrink-0 h-10 w-10">
                  <Square className="h-4 w-4" />
              </Button>
           ) : (
              <Button
              type="submit"
              size="icon"
              disabled={isLoading || isTyping || (!input.trim() && uploadedFiles.length === 0)}
              aria-label={t('chat.send_aria')}
              className={cn("shrink-0 h-10 w-10 transition-transform duration-200 active:scale-95", !input.trim() && uploadedFiles.length === 0 ? "" : "bg-primary text-primary-foreground hover:opacity-90 shadow-md")}
              >
              <Send className="h-4 w-4" />
              </Button>
           )}
           <Button
             type="button"
             variant="ghost"
             size="icon"
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               triggerMenuAtElement(e.currentTarget, 'input');
             }}
             className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground rounded-lg"
           >
             <MoreHorizontal className="h-4 w-4" />
           </Button>
        </form>
      </div>
    );
  };

  const communityActivitySummary = useMemo(() => {
    if (!user?.id) {
      return "";
    }

    const handles = new Set<string>();
    if (user.displayName) {
      handles.add(`@${normalizeCommunityHandle(user.displayName)}`);
    }
    if (userName) {
      handles.add(`@${normalizeCommunityHandle(userName)}`);
    }

    const userPosts = communityPosts.filter((post) => {
      if (post.authorId && post.authorId === user.id) {
        return true;
      }
      return handles.has(post.author.toLowerCase().trim());
    });

    const commentsWithPostId = Object.entries(communityComments).flatMap(
      ([postId, comments]) => comments.map((comment) => ({ postId, comment }))
    );

    const userComments = commentsWithPostId.filter(({ comment }) =>
      handles.has(comment.author.toLowerCase().trim())
    );

    const userPostIds = new Set(userPosts.map((post) => post.id));
    const receivedComments = commentsWithPostId.filter(
      ({ postId, comment }) =>
        userPostIds.has(postId) && !handles.has(comment.author.toLowerCase().trim())
    );

    const roomMix = new Map<string, number>();
    userPosts.forEach((post) => {
      roomMix.set(post.roomSlug, (roomMix.get(post.roomSlug) ?? 0) + 1);
    });

    const topRooms = Array.from(roomMix.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([room, count]) => `${room} (${count})`);

    const recentPosts = [...userPosts]
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 3)
      .map(
        (post) =>
          `- [${post.type}] ${post.title}: ${truncateSnippet(post.content, 120)}`
      );

    const recentComments = [...userComments]
      .sort(
        (a, b) =>
          new Date(b.comment.createdAt).getTime() -
          new Date(a.comment.createdAt).getTime()
      )
      .slice(0, 3)
      .map(({ comment }) => `- ${truncateSnippet(comment.content, 110)}`);

    const summary = `Posts created: ${userPosts.length}
Comments posted: ${userComments.length}
Comments received on own posts: ${receivedComments.length}
Top rooms: ${topRooms.length ? topRooms.join(", ") : "none"}
Recent posts:
${recentPosts.length ? recentPosts.join("\n") : "- none"}
Recent comments:
${recentComments.length ? recentComments.join("\n") : "- none"}`;

    return summary.slice(0, MAX_COMMUNITY_SUMMARY_CHARS);
  }, [communityComments, communityPosts, user?.displayName, user?.id, userName]);

  const sortedHistory = useMemo(() => {
    const sessions = [...history];
    sessions.sort((a, b) => {
      const pinA = a.isPinned ? 1 : 0;
      const pinB = b.isPinned ? 1 : 0;
      if (pinA !== pinB) {
        return pinB - pinA;
      }
      return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
    });
    return sessions;
  }, [history]);

  const visibleHistory = useMemo(
    () => sortedHistory.filter((chat) => !chat.isArchived),
    [sortedHistory]
  );

  const archivedHistory = useMemo(
    () => sortedHistory.filter((chat) => chat.isArchived),
    [sortedHistory]
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoggedIn) {
      const count = parseInt(localStorage.getItem('guestChatCount') || '0', 10);
      setGuestChatCount(count);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
        setLastCheckedNotifs(localStorage.getItem('lastCheckedNotifs'));
        fetchNotifications();
    }
  }, [isLoggedIn, fetchNotifications, setLastCheckedNotifs]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if(!showScrollToBottom){
        scrollToBottom();
    }
  }, [messages.length, isLoading, isTyping, typingMessage, showScrollToBottom, searchState.isSearching]);
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Show button if user has scrolled up more than 200px from the bottom
    if (scrollHeight - scrollTop > clientHeight + 200) {
      setShowScrollToBottom(true);
    } else {
      setShowScrollToBottom(false);
    }
  };


  useEffect(() => {
    if (!isLoading && !isTyping) {
      inputRef.current?.focus();
    }
  }, [isLoading, isTyping]);

  const handlePlayAudio = async (text: string, index: number) => {
    if (audioState[index]?.audioUrl) {
      audioRef.current = new Audio(audioState[index].audioUrl!);
      audioRef.current.play();
      return;
    }

    setAudioState(prev => ({ ...prev, [index]: { isLoading: true, audioUrl: null } }));
    try {
      const result = await generateAudio({ text, character });
      setAudioState(prev => ({ ...prev, [index]: { isLoading: false, audioUrl: result.audioUrl } }));
      audioRef.current = new Audio(result.audioUrl);
      audioRef.current.play();
    } catch (error) {
      console.error("Error generating audio:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not generate audio." });
      setAudioState(prev => ({ ...prev, [index]: { isLoading: false, audioUrl: null } }));
    }
  };


  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({ variant: "destructive", title: "File too large", description: "Please upload files smaller than 5MB." });
      return;
    }

    setIsLoading(true);
    try {
      let fileContent: string;
      if (file.type.startsWith("image/")) {
        fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else if (file.type === "application/pdf") {
        toast({ title: "PDF Processing", description: "PDF analysis is in progress. I will read this file, but you can also discuss it with me." });
        fileContent = `[PDF Document: ${file.name}]`;
      } else {
        toast({ variant: "destructive", title: "Unsupported FileType", description: "Please upload an image or PDF file." });
        setIsLoading(false);
        return;
      }
      setUploadedFiles(prev => [...prev, { name: file.name, type: file.type, content: fileContent }]);
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    files.forEach(file => handleFileChange(file));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files || []);
    if (files.length > 0) {
      const hasSupportedFiles = files.some(file => file.type.startsWith('image/') || file.type === 'application/pdf');
      if (hasSupportedFiles) {
        e.preventDefault();
        files.forEach(file => {
          if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            handleFileChange(file);
          }
        });
      }
    }
  };

  const generateAndStreamResponse = async (prompt: string, currentHistory: AppMessage[], currentLanguage: Language, attachedImages?: string[]) => {
      setIsLoading(true);
      setStopTyping(false);
      
      try {
        if (searchMode) {
            setSearchState({ isSearching: true, query: prompt, startTime: Date.now() });
        }

        const { response, sourceFile, searchQuery }: AiResponse = await generateResponse({
            message: prompt,
            character,
            history: currentHistory,
            userId: user?.id || undefined,
            activeChatId: activeChatId || undefined,
            communityActivity: communityActivitySummary || undefined,
            userGender: user?.gender || "not specified",
            language: currentLanguage,
            searchMode,
            images: attachedImages,
        });
        
        if (searchState.isSearching) {
            const duration = ((Date.now() - searchState.startTime!) / 1000).toFixed(2);
            const searchMessage = {
                role: 'assistant',
                content: `Searched for "${searchQuery || prompt}" in ${duration} seconds.`,
                isSearchInfo: true,
            } as AppMessage;
            addMessage(searchMessage);
            setSearchState({ isSearching: false, query: null, startTime: null });
        }
        
        setIsLoading(false);
        setIsTyping(true);
        setTypingMessage({ role: 'assistant', content: response, createdAt: new Date().toISOString() });

        if (sourceFile === 'none') {
            const saveStatus = await saveConversationToBrain(character, prompt, response);
            if (isAdmin && saveStatus === 'saved') {
                toast({
                    title: "Brain Updated",
                    description: `New knowledge saved to ${character}.json`,
                });
            }
        } else if (sourceFile !== 'error' && isAdmin) {
            toast({
                title: "Brain Hit!",
                description: `Source: ${sourceFile}`,
            });
        }

    } catch (error) {
      console.error("Error in chat handleSubmit:", error);
      const errorMessage = "Sorry, I ran into an error. Please try again.";
      addMessage({ role: 'assistant', content: errorMessage, createdAt: new Date().toISOString() });
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with Ana. Please try again.",
      });
      setIsLoading(false);
      setIsTyping(false);
      setSearchState({ isSearching: false, query: null, startTime: null });
    }
  }


  const handleSubmit = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading || isTyping) return;

    if (!isLoggedIn && !isAdmin && guestChatCount >= GUEST_CHAT_LIMIT) {
      setShowLimitDialog(true);
      return;
    }

    if (!isLoggedIn && !isAdmin) {
      const newGuestCount = guestChatCount + 1;
      setGuestChatCount(newGuestCount);
      localStorage.setItem('guestChatCount', newGuestCount.toString());
    }

    // Separate images and PDF content
    const attachedImages = uploadedFiles.filter(f => f.type.startsWith('image/')).map(f => f.content);
    const pdfsText = uploadedFiles.filter(f => f.type === 'application/pdf').map(f => f.content).join('\n\n');
    
    const finalPrompt = pdfsText ? `${input}\n\n[Attached Document Context]\n${pdfsText}` : input;

    const userMessage: AppMessage = { 
      role: "user", 
      content: input, 
      createdAt: new Date().toISOString(),
      images: attachedImages 
    };
    const conversationHistory = [...messages, userMessage];
    const isFirstUserMessage = messages.filter(m => m.role === 'user').length === 0;

    addMessage(userMessage);

    if (isFirstUserMessage && activeChatId) {
      generateTitle({ message: input }).then(({ title }) => {
        updateChatTitle(activeChatId, title);
      });
    }

    const currentInput = finalPrompt;
    setInput("");
    setUploadedFiles([]);
    
    await generateAndStreamResponse(currentInput, conversationHistory, language, attachedImages);
  };
  
  const handleTypingComplete = () => {
      if (typingMessage) {
          addMessage(typingMessage);
      }
      setIsTyping(false);
      setTypingMessage(null);
      setStopTyping(false);
  };
  
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleSubmit();
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !isMobile) {
      if (e.shiftKey) {
        // Allow new line on Shift + Enter
      } else {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleRewrite = () => {
    if (isLoading || isTyping || searchState.isSearching) return;

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
        const lastAssistantMessageIndex = messages.map(m => m.role).lastIndexOf('assistant');
        if (lastAssistantMessageIndex > -1) {
            const historyWithoutLastResponse = messages.slice(0, lastAssistantMessageIndex);
            setMessages(historyWithoutLastResponse);
            generateAndStreamResponse(lastUserMessage.content, historyWithoutLastResponse, language);
        }
    } else {
        toast({ variant: 'destructive', title: "Cannot rewrite", description: "No previous user message found to rewrite." });
    }
  };

  const handleFeedback = (index: number, type: 'like' | 'dislike', content: string) => {
    if (!user || !activeChatId) {
        toast({ variant: 'destructive', title: 'Login Required', description: 'You must be logged in to leave feedback.' });
        return;
    }
    
    setFeedbackState(prev => ({...prev, [index]: type}));

    if (type === 'like') {
        saveFeedback({
            userId: user.id,
            userName: user.displayName || 'Unknown',
            chatId: activeChatId,
            messageContent: content,
            feedbackType: 'like'
        });
        toast({ title: 'Feedback Submitted', description: 'Thanks for letting us know you liked this response!' });
    } else {
        setFeedbackMessage({ content, index });
        setShowFeedbackDialog(true);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!user || !activeChatId || !feedbackMessage) return;

    await saveFeedback({
        userId: user.id,
        userName: user.displayName || 'Unknown',
        chatId: activeChatId,
        messageContent: feedbackMessage.content,
        feedbackType: 'dislike',
        comment: feedbackComment
    });

    toast({ title: 'Feedback Submitted', description: 'Thank you for your feedback. It helps us improve.' });
    setShowFeedbackDialog(false);
    setFeedbackComment('');
    setFeedbackMessage(null);
  };
  
  const getPlanMessage = () => {
    if (isAdmin) {
      return 'Admin Mode: Unlimited Messages';
    }
    if (isLoggedIn) {
      switch (userPlan) {
        case 'Business':
        case 'Enterprise':
          return 'Premium Plan: Unlimited Messages';
        case 'Free':
          return 'Free Plan: Message limit applies.';
        default:
          return `${t('chat.guest_messages')} ${Math.max(0, GUEST_CHAT_LIMIT - guestChatCount)}`;
      }
    }
    return `${t('chat.guest_messages')} ${Math.max(0, GUEST_CHAT_LIMIT - guestChatCount)}`;
  }
  
  const handleRenameChat = (chat: ChatSession) => {
    setChatToRename(chat);
    setRenameValue(chat.title);
  };

  const handleRenameSubmit = async () => {
    if (!chatToRename) return;
    const nextTitle = renameValue.trim();
    if (!nextTitle) {
      toast({
        variant: "destructive",
        title: "Invalid Title",
        description: "Please enter a non-empty chat title.",
      });
      return;
    }

    await updateChatTitle(chatToRename.id, nextTitle);
    toast({
      title: "Chat Renamed",
      description: "Conversation title updated successfully.",
    });
    setChatToRename(null);
    setRenameValue("");
  };

  const handleTogglePin = async (chat: ChatSession) => {
    const nextPinned = !chat.isPinned;
    await toggleChatPinned(chat.id, nextPinned);
    toast({
      title: nextPinned ? "Chat Pinned" : "Chat Unpinned",
      description: nextPinned
        ? "Pinned chats stay at the top of history."
        : "Chat removed from pinned list.",
    });
  };

  const handleToggleArchive = async (chat: ChatSession) => {
    const nextArchived = !chat.isArchived;
    await toggleChatArchived(chat.id, nextArchived);
    toast({
      title: nextArchived ? "Chat Archived" : "Chat Restored",
      description: nextArchived
        ? "Chat moved to archived conversations."
        : "Chat moved back to active history.",
    });
  };

  const handleRequestDeleteChat = (chat: ChatSession) => {
    setChatToDelete(chat);
  };

  const handleConfirmDeleteChat = async () => {
    if (!chatToDelete) return;
    await deleteChat(chatToDelete.id);
    toast({
      title: "Chat Deleted",
      description: "The conversation has been removed.",
    });
    setChatToDelete(null);
  };
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }

  const unreadCount = useMemo(() => {
      if (!lastCheckedNotifs || !notifications.length) {
          return notifications.length;
      }
      const lastCheckedDate = new Date(lastCheckedNotifs);
      return notifications.filter(n => new Date(n.createdAt) > lastCheckedDate).length;
  }, [notifications, lastCheckedNotifs]);
  
  const handleNotifBellClick = () => {
    fetchNotifications();
    setShowNotifications(true);
    const now = new Date().toISOString();
    localStorage.setItem('lastCheckedNotifs', now);
    setLastCheckedNotifs(now);
  }


  return (
    <>
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background" onDrop={handleDrop} onDragOver={handleDragEvents} onDragEnter={handleDragEnter}>
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onDragLeave={handleDragLeave}>
            <div className="rounded-lg border-2 border-dashed border-primary p-12 text-center">
              <FileIcon className="mx-auto h-12 w-12 text-primary" />
              <p className="mt-2 font-semibold">Drop your file here</p>
            </div>
          </div>
        )}
        
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <Button variant="outline" onClick={() => startNewChat()} className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">{t('chat.new')}</span>
                </Button>
            </SidebarHeader>
            <SidebarContent className="flex flex-col p-2">
                 <div className="space-y-4">
                    <div>
                        <Label className="px-2 group-data-[collapsible=icon]:hidden">{t('chat.select_character')}</Label>
                        <Select value={character} onValueChange={setCharacter}>
                            <SelectTrigger className="group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:p-3">
                                <SelectValue placeholder="Select a character" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="defaultt">Default</SelectItem>
                            {characters.map(char => (
                                <SelectItem key={char} value={char}>{char}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label className="px-2 group-data-[collapsible=icon]:hidden">{t('chat.select_language')}</Label>
                        <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                            <SelectTrigger className="group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:p-3">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                {chatLanguages.map(lang => (
                                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Separator className="my-4" />
                <div className="flex flex-col flex-1 h-0">
                    <h3 className="font-semibold flex items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center"><History className="h-4 w-4"/> <span className="group-data-[collapsible=icon]:hidden">History</span></h3>
                    <ScrollArea className="flex-1 -mx-2">
                        <div className="p-2">
                            <SidebarMenu>
                            {visibleHistory.map(chat => (
                                <SidebarMenuItem key={chat.id} className="relative group/item" onContextMenu={(e) => handleContextMenu(e, 'history', chat)}>
                                    <SidebarMenuButton
                                        onClick={() => loadChat(chat.id)}
                                        isActive={chat.id === activeChatId}
                                        className="w-full justify-start items-start h-auto pr-10 py-2"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                                            <div className="flex items-center gap-1">
                                                {chat.isPinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                                                <span className="truncate font-medium">{chat.title}</span>
                                            </div>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {formatHistoryDate(chat.createdAt)}
                                            </p>
                                        </div>
                                    </SidebarMenuButton>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-1/2 right-1 -translate-y-1/2 h-6 w-6 opacity-0 group-hover/item:opacity-100"
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                            <DropdownMenuItem
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleRenameChat(chat);
                                                }}
                                            >
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleTogglePin(chat);
                                                }}
                                            >
                                                <Pin className="mr-2 h-4 w-4" />
                                                {chat.isPinned ? "Unpin" : "Pin"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleToggleArchive(chat);
                                                }}
                                            >
                                                {chat.isArchived ? (
                                                    <ArchiveRestore className="mr-2 h-4 w-4" />
                                                ) : (
                                                    <Archive className="mr-2 h-4 w-4" />
                                                )}
                                                {chat.isArchived ? "Unarchive" : "Archive"}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleRequestDeleteChat(chat);
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </SidebarMenuItem>
                            ))}
                            </SidebarMenu>
                            {visibleHistory.length === 0 && (
                                <p className="text-sm text-muted-foreground px-2 group-data-[collapsible=icon]:hidden">No chat history yet.</p>
                            )}
                            {archivedHistory.length > 0 && (
                                <div className="mt-4 group-data-[collapsible=icon]:hidden">
                                    <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Archived
                                    </p>
                                    <SidebarMenu>
                                        {archivedHistory.map((chat) => (
                                            <SidebarMenuItem key={chat.id} className="relative group/item" onContextMenu={(e) => handleContextMenu(e, 'history', chat)}>
                                                <SidebarMenuButton
                                                    onClick={() => loadChat(chat.id)}
                                                    isActive={chat.id === activeChatId}
                                                    className="w-full justify-start items-start h-auto pr-10 py-2 opacity-80"
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                    <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                                                        <div className="flex items-center gap-1">
                                                            {chat.isPinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                                                            <span className="truncate font-medium">{chat.title}</span>
                                                        </div>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {formatHistoryDate(chat.createdAt)}
                                                        </p>
                                                    </div>
                                                </SidebarMenuButton>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute top-1/2 right-1 -translate-y-1/2 h-6 w-6 opacity-0 group-hover/item:opacity-100"
                                                            onClick={(event) => event.stopPropagation()}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <DropdownMenuItem
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleRenameChat(chat);
                                                            }}
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Rename
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleTogglePin(chat);
                                                            }}
                                                        >
                                                            <Pin className="mr-2 h-4 w-4" />
                                                            {chat.isPinned ? "Unpin" : "Pin"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleToggleArchive(chat);
                                                            }}
                                                        >
                                                            <ArchiveRestore className="mr-2 h-4 w-4" />
                                                            Unarchive
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleRequestDeleteChat(chat);
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </SidebarContent>
             <SidebarFooter>
                <Button variant="ghost" asChild>
                    <Link href="/" className="w-full justify-start">
                    <Home className="mr-2 h-4 w-4"/>
                    <span className="group-data-[collapsible=icon]:hidden">Back to Home</span>
                    </Link>
                </Button>
            </SidebarFooter>
        </Sidebar>

        <main className="flex flex-col max-h-screen w-full">
             <header className="flex items-center justify-between px-6 border-b border-zinc-200 dark:border-white/5 bg-white/70 dark:bg-black/40 backdrop-blur-xl h-16 shrink-0 shadow-sm dark:shadow-primary/2">
                <div className="flex items-center gap-3">
                    <SidebarTrigger className="hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 transition-colors rounded-lg h-9 w-9" />
                    <div className="relative p-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 flex items-center justify-center">
                        <BotIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 animate-pulse"/>
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-extrabold text-sm tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">{t('chat.ana_name')}</h1>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400/80 font-semibold tracking-wider uppercase">Active Now</span>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 transition-colors rounded-lg h-9 w-9">
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">{t('theme.changer.aria')}</span>
                    </Button>

                    {isLoggedIn && (
                        <div className="relative">
                        <Button variant="ghost" size="icon" onClick={handleNotifBellClick} className="hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 transition-colors rounded-lg h-9 w-9">
                            <Bell className="h-4 w-4" />
                            <span className="sr-only">Notifications</span>
                        </Button>
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center items-center text-[9px] p-0 font-bold bg-blue-500 hover:bg-blue-600 text-white rounded-full border border-black dark:border-zinc-950">{unreadCount}</Badge>
                        )}
                        </div>
                    )}

                    {isLoggedIn ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-800 dark:text-white/90 transition-colors rounded-lg py-1.5 px-3 h-9">
                            <User className="h-4 w-4 text-zinc-750 dark:text-white/80" />
                            <span className='hidden sm:inline font-semibold text-xs text-zinc-700 dark:text-white/80'>{userName}</span>
                            {userPlan === 'Business' && (
                                <Badge variant="outline" className="gap-1 border-blue-500/30 bg-blue-500/5 text-blue-500 text-[10px] px-1.5 py-0.5 rounded-md">
                                    <BadgeCheck className="h-3 w-3 fill-blue-500 text-blue-500" />
                                    <span className="hidden md:inline">Business</span>
                                </Badge>
                            )}
                            {userPlan === 'Enterprise' && (
                                <Badge className="gap-1 bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 hover:from-amber-400 hover:to-yellow-300 text-[10px] px-1.5 py-0.5 rounded-md font-semibold">
                                    <Crown className="h-3 w-3" />
                                    <span className="hidden md:inline">Enterprise</span>
                                </Badge>
                            )}
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
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" asChild>
                        <Link href="/login">{t('nav.login')}</Link>
                        </Button>
                        <Button asChild>
                        <Link href="/signup">{t('nav.signup')}</Link>
                        </Button>
                    </div>
                    )}
                </div>
             </header>

            <div className="relative flex-1 h-0 flex flex-col">
              {!hasUserMessages ? (
                <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full px-4 py-8 overflow-y-auto">
                    <div className="text-center mb-8 flex flex-col items-center animate-fade-in-down">
                        <div className="relative mb-6 group">
                            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/30 via-rose-500/20 to-primary/30 blur-lg opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-background border border-primary/20 shadow-xl">
                                <BotIcon className="w-10 h-10 text-primary" />
                            </div>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-foreground to-primary/80 bg-clip-text text-transparent mb-3">
                            What can I help you build?
                        </h2>
                        <p className="text-sm md:text-base text-muted-foreground/85 max-w-xl mx-auto">
                            {messages[0]?.content || t('chat.initial_message')}
                        </p>
                    </div>

                    <div className="w-full bg-card/65 dark:bg-muted/15 backdrop-blur-md border border-border/80 shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] rounded-2xl p-3 md:p-4 mb-8 transition-all duration-300 focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/40">
                        {renderChatForm(true)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                        {suggestions.map((s, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setInput(s.text);
                                    setTimeout(() => {
                                        inputRef.current?.focus();
                                    }, 50);
                                }}
                                className="flex flex-col items-start p-4 text-left rounded-xl border bg-card/40 hover:bg-card hover:border-primary/40 shadow-sm transition-all duration-200 group hover:-translate-y-0.5"
                            >
                                <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                                    {s.icon} <span className="group-hover:text-primary transition-colors">{s.label}</span>
                                </span>
                                <span className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    {s.desc}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-full" onScroll={handleScroll} viewportRef={scrollAreaRef}>
                     <div className="space-y-4 p-4 md:p-6">
                         {messages.map((message, index) => {
                             if (index === 0 && message.role === 'assistant') {
                                 return null;
                             }
                             if ((message as any).isSearchInfo) {
                                 return (
                                 <div key={index} className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                     <Search className="h-3 w-3" />
                                     <span>{message.content}</span>
                                 </div>
                                 )
                             }
                             return (
                              <div key={index} className="group/message" onContextMenu={(e) => handleContextMenu(e, 'message', { text: message.content, index })}>
                                  <div
                                      className={`flex items-start gap-4 ${message.role === "user" ? "justify-end" : ""}`}
                                  >
                                      {message.role === "assistant" && (
                                      <Avatar className="h-8 w-8 border">
                                          <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                                      </Avatar>
                                      )}
                                      <div
                                      className={`max-w-[75%] rounded-lg p-3 shadow-sm flex items-center gap-2 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                                          }`}
                                      >
                                      <div className={cn("text-sm leading-6 max-w-full whitespace-pre-wrap", message.role === "assistant" && "prose prose-sm prose-p:my-0")}>
                                          {message.role === "user" ? (
                                              message.content
                                          ) : (
                                              <ReactMarkdown components={{ code: CodeBlock }}>
                                                  {message.content}
                                              </ReactMarkdown>
                                          )}
                                      </div>
                                      </div>
                                      {message.role === "user" && (
                                      <Avatar className="h-8 w-8 border">
                                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                      </Avatar>
                                      )}
                                  </div>
                                  {message.createdAt && (
                                      <div className={`text-xs text-muted-foreground mt-1 ${message.role === 'user' ? 'text-right mr-12' : 'ml-12'}`}>
                                          {format(new Date(message.createdAt), 'p')}
                                      </div>
                                  )}
                                  {message.role === 'assistant' && message.content && (
                                      <div className="flex items-center justify-start ml-12 mt-1 space-x-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFeedback(index, 'like', message.content)} disabled={!!feedbackState[index]}>
                                              <ThumbsUp className={cn("h-4 w-4", feedbackState[index] === 'like' && "text-primary fill-primary")} />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFeedback(index, 'dislike', message.content)} disabled={!!feedbackState[index]}>
                                              <ThumbsDown className={cn("h-4 w-4", feedbackState[index] === 'dislike' && "text-destructive fill-destructive")} />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRewrite} disabled={isLoading || isTyping}><RefreshCw className="h-4 w-4" /></Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                              navigator.clipboard.writeText(message.content);
                                              toast({ title: 'Copied to clipboard!' });
                                          }}><Clipboard className="h-4 w-4" /></Button>
                                          <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7"
                                              onClick={() => handlePlayAudio(message.content, index)}
                                              disabled={audioState[index]?.isLoading}
                                          >
                                          {audioState[index]?.isLoading ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                              <Volume2 className="h-4 w-4" />
                                          )}
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              triggerMenuAtElement(e.currentTarget, 'message', { text: message.content, index });
                                            }}
                                          >
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                      </div>
                                  )}
                                  {message.role === 'user' && message.content && (
                                      <div className="flex items-center justify-end mr-12 mt-1 space-x-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                              navigator.clipboard.writeText(message.content);
                                              toast({ title: 'Copied to clipboard!' });
                                          }}><Clipboard className="h-4 w-4" /></Button>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              triggerMenuAtElement(e.currentTarget, 'message', { text: message.content, index });
                                            }}
                                          >
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                      </div>
                                  )}
                              </div>
                              )
                         })}

                         {(isLoading || searchState.isSearching) && (
                         <div className="flex items-start gap-4">
                             <Avatar className="h-8 w-8 border">
                                 <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                             </Avatar>
                             <div className="max-w-[75%] rounded-lg p-3 shadow-sm flex items-center gap-2 bg-muted">
                                 {searchState.isSearching ? (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                         <Loader2 className="h-4 w-4 animate-spin" />
                                         <span>Searching for "{searchState.query}"...</span>
                                      </div>
                                 ) : (
                                     <div className="flex items-center justify-center space-x-1">
                                         <span className="h-2 w-2 animate-pulse rounded-full bg-foreground delay-0"></span>
                                         <span className="h-2 w-2 animate-pulse rounded-full bg-foreground delay-150"></span>
                                         <span className="h-2 w-2 animate-pulse rounded-full bg-foreground delay-300"></span>
                                     </div>
                                 )}
                             </div>
                         </div>
                         )}
                         
                         {isTyping && typingMessage && (
                             <div className="flex items-start gap-4">
                                 <Avatar className="h-8 w-8 border">
                                     <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                                 </Avatar>
                                 <div className="max-w-[75%] rounded-lg p-3 shadow-sm flex items-center gap-2 bg-muted">
                                     <div className="text-sm leading-6 prose prose-sm prose-p:my-0 max-w-full">
                                         <TypingEffect text={typingMessage.content} onComplete={handleTypingComplete} stop={stopTyping} />
                                     </div>
                                 </div>
                             </div>
                         )}
                         
                         <div ref={messagesEndRef} />
                     </div>
                  </ScrollArea>
                  {showScrollToBottom && (
                     <Button
                         variant="outline"
                         size="icon"
                         className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full shadow-lg"
                         onClick={scrollToBottom}
                     >
                         <ChevronDown className="h-5 w-5" />
                     </Button>
                  )}
                </>
              )}
            </div>

            {hasUserMessages && (
              <div className="border-t p-4 bg-background">
                {renderChatForm(false)}
                <p className="text-xs text-center text-muted-foreground mt-2">
                    {isMobile ? "Press Enter for a new line" : "Press Shift + Enter for a new line"}
                </p>
              </div>
            )}
        </main>
      </div>
    </SidebarProvider>

    <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('chat.limit.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('chat.limit.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="ghost" asChild onClick={() => setShowLimitDialog(false)}>
            <Link href="/login">{t('chat.limit.login')}</Link>
          </Button>
          <AlertDialogAction asChild>
            <Link href="/signup">{t('chat.limit.signup')}</Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog
      open={Boolean(chatToDelete)}
      onOpenChange={(open) => {
        if (!open) {
          setChatToDelete(null);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete
            {chatToDelete ? ` "${chatToDelete.title}"` : " this chat"}.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmDeleteChat}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog
      open={Boolean(chatToRename)}
      onOpenChange={(open) => {
        if (!open) {
          setChatToRename(null);
          setRenameValue("");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Chat</DialogTitle>
          <DialogDescription>
            Set a new title for this conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="rename-chat-input">Chat title</Label>
          <Input
            id="rename-chat-input"
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            maxLength={120}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleRenameSubmit();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setChatToRename(null);
              setRenameValue("");
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleRenameSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Provide Additional Feedback</DialogTitle>
                <DialogDescription>
                    We're sorry the response wasn't helpful. Please tell us what was wrong.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <Textarea
                    placeholder="e.g., The information was incorrect, it was not helpful..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>Cancel</Button>
                <Button onClick={handleFeedbackSubmit}>Submit Feedback</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    
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

    {contextMenu.type && (
      <div 
        style={{ top: contextMenu.y, left: contextMenu.x }}
        className="fixed z-[9999] min-w-[200px] bg-zinc-950/80 dark:bg-black/90 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        {contextMenu.type === 'message' && (
          <>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(contextMenu.data?.text || '');
                toast({ title: 'Message copied!' });
                setContextMenu(prev => ({ ...prev, type: null }));
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <Clipboard className="w-3.5 h-3.5 text-blue-400" />
              Copy Message
            </button>
            <button 
              onClick={() => {
                const codeBlocks = contextMenu.data?.text.match(/```[\s\S]*?```/g);
                if (codeBlocks) {
                  const cleanCode = codeBlocks.map((b: string) => b.replace(/```[a-zA-Z]*\n|```/g, '')).join('\n\n');
                  navigator.clipboard.writeText(cleanCode);
                  toast({ title: 'Code blocks copied!' });
                } else {
                  toast({ title: 'No code blocks found' });
                }
                setContextMenu(prev => ({ ...prev, type: null }));
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <FileIcon className="w-3.5 h-3.5 text-indigo-400" />
              Copy Code Snippet
            </button>
            {messages[contextMenu.data?.index]?.role === 'assistant' && (
              <button 
                onClick={() => {
                  handleRewrite();
                  setContextMenu(prev => ({ ...prev, type: null }));
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                Regenerate Answer
              </button>
            )}
            <div className="h-px bg-white/5 my-1" />
            <button 
              onClick={() => {
                scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
                setContextMenu(prev => ({ ...prev, type: null }));
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
              Scroll to Bottom
            </button>
          </>
        )}

        {contextMenu.type === 'input' && (
          <>
            <button 
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  setInput(text);
                } catch (e) {
                  toast({ title: 'Clipboard read access denied' });
                }
                setContextMenu(prev => ({ ...prev, type: null }));
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <Clipboard className="w-3.5 h-3.5 text-blue-400" />
              Paste from Clipboard
            </button>
            <button 
              onClick={() => {
                setInput('');
                setContextMenu(prev => ({ ...prev, type: null }));
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              Clear text
            </button>
            <div className="h-px bg-white/5 my-1" />
            <div className="px-3 py-1 text-[10px] uppercase font-bold text-white/40 tracking-wider">Quick Templates</div>
            {[
              { label: 'Explain this Code', prompt: 'Please explain this code step-by-step:\n' },
              { label: 'Optimize performance', prompt: 'Optimize this code for maximum performance:\n' },
              { label: 'Find security bugs', prompt: 'Audit this code for security vulnerabilities:\n' }
            ].map(qp => (
              <button 
                key={qp.label}
                onClick={() => {
                  setInput(qp.prompt);
                  setContextMenu(prev => ({ ...prev, type: null }));
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {qp.label}
              </button>
            ))}
          </>
        )}

        {contextMenu.type === 'history' && (
          <>
            <button 
              onClick={() => {
                loadChat(contextMenu.data?.id);
                setContextMenu(prev => ({ ...prev, type: null }));
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              Open Conversation
            </button>
            <button 
              onClick={() => {
                handleRenameChat(contextMenu.data);
                setContextMenu(prev => ({ ...prev, type: null }));
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <Pencil className="w-3.5 h-3.5 text-indigo-400" />
              Rename Chat
            </button>
            <button 
              onClick={() => {
                handleTogglePin(contextMenu.data);
                setContextMenu(prev => ({ ...prev, type: null }));
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <Pin className="w-3.5 h-3.5 text-amber-400" />
              {contextMenu.data?.isPinned ? 'Unpin from top' : 'Pin to top'}
            </button>
            <button 
              onClick={() => {
                handleToggleArchive(contextMenu.data);
                setContextMenu(prev => ({ ...prev, type: null }));
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <Archive className="w-3.5 h-3.5 text-purple-400" />
              {contextMenu.data?.isArchived ? 'Unarchive' : 'Archive'}
            </button>
            <div className="h-px bg-white/5 my-1" />
            <button 
              onClick={() => {
                handleRequestDeleteChat(contextMenu.data);
                setContextMenu(prev => ({ ...prev, type: null }));
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              Delete Chat
            </button>
          </>
        )}
      </div>
    )}
    </>
  );
}
