
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
import { Bot, Send, User, Plus, Paperclip, XCircle, File as FileIcon, Home, History, Loader2, Volume2, BotIcon, MessageSquare, Trash2, Clipboard, Check, ChevronDown, ThumbsUp, ThumbsDown, RefreshCw, Square, Sun, Moon, Bell, Languages, Globe, Search, BadgeCheck, Crown } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AppContext, AppMessage, Language, Notification } from "@/context/AppContext";
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


const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        toast({ title: "Copied to clipboard!" });
        setTimeout(() => setIsCopied(false), 2000);
    };

    return !inline && match ? (
        <div className="relative">
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between bg-muted-foreground/20 px-4 py-1.5 rounded-t-md">
                <span className="text-xs font-sans text-foreground/80">{match[1]}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                    {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                    <span className="sr-only">Copy code</span>
                </Button>
            </div>
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
                className="p-4 pt-10 rounded-md bg-muted-foreground/10 my-4 overflow-x-auto"
            >
                {code}
            </SyntaxHighlighter>
        </div>
    ) : (
        <code className={className} {...props}>
            {children}
        </code>
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
  } = useContext(AppContext);

  const { t, language, setLanguage } = useTranslation();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState<AppMessage | null>(null);
  const [stopTyping, setStopTyping] = useState(false);
  const [guestChatCount, setGuestChatCount] = useState(0);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
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

  // Feedback state
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({});
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<{ content: string, index: number } | null>(null);

  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        toast({ title: "PDF Processing", description: "PDF analysis is a work in progress. I will be aware that you uploaded this file, but I cannot read its content yet." });
        fileContent = `The user has uploaded a PDF named '${file.name}'. All subsequent questions will be about the content of this document. Acknowledge this and ask the user to paste the relevant text from the PDF if they want to discuss a specific part.`;
      } else {
        toast({ variant: "destructive", title: "Unsupported FileType", description: "Please upload an image or PDF file." });
        setIsLoading(false);
        return;
      }
      setUploadedFile({ name: file.name, type: file.type, content: fileContent });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not process the uploaded file." });
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const generateAndStreamResponse = async (prompt: string, currentHistory: AppMessage[], currentLanguage: Language) => {
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
    if ((!input.trim() && !uploadedFile) || isLoading || isTyping) return;

    if (!isLoggedIn && !isAdmin && guestChatCount >= GUEST_CHAT_LIMIT) {
      setShowLimitDialog(true);
      return;
    }

    if (!isLoggedIn && !isAdmin) {
      const newGuestCount = guestChatCount + 1;
      setGuestChatCount(newGuestCount);
      localStorage.setItem('guestChatCount', newGuestCount.toString());
    }

    const userMessage: AppMessage = { role: "user", content: input, createdAt: new Date().toISOString() };
    const conversationHistory = [...messages, userMessage];
    const isFirstUserMessage = messages.filter(m => m.role === 'user').length === 0;

    addMessage(userMessage);

    if (isFirstUserMessage && activeChatId) {
      generateTitle({ message: input }).then(({ title }) => {
        updateChatTitle(activeChatId, title);
      });
    }

    const currentInput = input;
    setInput("");
    setUploadedFile(null);
    
    await generateAndStreamResponse(currentInput, messages, language);
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
  
  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChat(chatId);
    toast({
      title: "Chat Deleted",
      description: "The conversation has been removed.",
    });
  }
  
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
                            {history.map(chat => (
                                <SidebarMenuItem key={chat.id} className="relative group/item">
                                    <SidebarMenuButton
                                        onClick={() => loadChat(chat.id)}
                                        isActive={chat.id === activeChatId}
                                        className="w-full justify-start pr-8"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="truncate">{chat.title}</span>
                                    </SidebarMenuButton>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2 h-6 w-6 opacity-0 group-hover/item:opacity-100">
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete this chat. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={(e) => handleDeleteChat(e, chat.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </SidebarMenuItem>
                            ))}
                            </SidebarMenu>
                            {history.length === 0 && (
                                <p className="text-sm text-muted-foreground px-2 group-data-[collapsible=icon]:hidden">No chat history yet.</p>
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
             <header className="flex items-center justify-between p-2 border-b h-16 shrink-0">
                <div className="flex items-center gap-2">
                    <SidebarTrigger/>
                    <BotIcon className="w-6 h-6 text-primary"/>
                    <h1 className="font-semibold text-lg">{t('chat.ana_name')}</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleTheme}>
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">{t('theme.changer.aria')}</span>
                    </Button>

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
                            {userPlan === 'Business' && (
                                <Badge variant="outline" className="gap-1 border-blue-500/60 bg-blue-500/10 text-blue-700 dark:text-blue-300">
                                    <BadgeCheck className="h-3.5 w-3.5 fill-blue-500 text-blue-500" />
                                    <span className="hidden md:inline">Business</span>
                                </Badge>
                            )}
                            {userPlan === 'Enterprise' && (
                                <Badge className="gap-1 bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 hover:from-amber-400 hover:to-yellow-300">
                                    <Crown className="h-3.5 w-3.5" />
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

            <div className="relative flex-1 h-0">
                 <ScrollArea className="h-full" onScroll={handleScroll} viewportRef={scrollAreaRef}>
                    <div className="space-y-4 p-4 md:p-6">
                        {messages.map((message, index) => {
                            if ((message as any).isSearchInfo) {
                                return (
                                <div key={index} className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                    <Search className="h-3 w-3" />
                                    <span>{message.content}</span>
                                </div>
                                )
                            }
                            return (
                            <div key={index} className="group/message">
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
                                    <div className="text-sm leading-6 prose prose-sm prose-p:my-0 max-w-full">
                                        <ReactMarkdown components={{ code: CodeBlock }}>
                                            {message.content}
                                        </ReactMarkdown>
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
                                    </div>
                                )}
                            </div>
                        )})}

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
            </div>
           

            <div className="border-t p-4 bg-background">
              {uploadedFile && (
                <div className="mb-2 flex items-center justify-between rounded-lg border bg-muted p-2 text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileIcon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{uploadedFile.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setUploadedFile(null)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <form ref={formRef} onSubmit={handleFormSubmit} className="flex items-start gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" disabled={isLoading || isTyping}>
                          <Plus className="h-5 w-5" />
                          <span className="sr-only">More options</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" side="top" align="start">
                        <div className="grid gap-4">
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                                <div className="flex items-center space-x-2">
                                    <Globe className="h-5 w-5" />
                                    <Label htmlFor="search-mode" className="font-semibold">Web Search</Label>
                                </div>
                                <Switch
                                    id="search-mode"
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
                  placeholder={t('chat.placeholder')}
                  className="flex-1 resize-none"
                  rows={1}
                  disabled={isLoading || isTyping}
                  autoComplete="off"
                />
                 {isTyping ? (
                     <Button type="button" size="icon" variant="destructive" onClick={() => setStopTyping(true)} aria-label="Stop generation">
                        <Square className="h-4 w-4" />
                    </Button>
                 ) : (
                    <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || isTyping || (!input.trim() && !uploadedFile)}
                    aria-label={t('chat.send_aria')}
                    >
                    <Send className="h-4 w-4" />
                    </Button>
                 )}
              </form>
                <p className="text-xs text-center text-muted-foreground mt-2">
                    {isMobile ? "Press Enter for a new line" : "Press Shift + Enter for a new line"}
                </p>
            </div>
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
    </>
  );
}
