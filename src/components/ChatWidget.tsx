
"use client";

import { useState, useRef, useEffect, type FormEvent, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Send, MessageSquare, X, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { generateResponse } from "@/ai/flows/generate-response";
import { AppContext } from "@/context/AppContext";
import ReactMarkdown from "react-markdown";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const WIDGET_INITIAL_MESSAGE = "Hello! I'm a support assistant for My Ana AI. How can I help you with our website or services today?";
const WIDGET_PROMPT_CHARACTER = `defaultt`;

export function ChatWidget() {
    const { user } = useContext(AppContext);
    const [isOpen, setIsOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [currentPath, setCurrentPath] = useState("");
    
    useEffect(() => {
        setIsClient(true);
        if (typeof window !== "undefined") {
            setCurrentPath(window.location.pathname);
        }
    }, [isOpen]);
    
    const [widgetMessages, setWidgetMessages] = useState<Message[]>([]);
    
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (widgetMessages.length === 0) {
            setWidgetMessages([
                {
                    role: "assistant",
                    content: WIDGET_INITIAL_MESSAGE,
                }
            ]);
        }
    }, [widgetMessages.length]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [widgetMessages, isOpen]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        
        const userMessage: Message = { role: "user", content: input };
        const newMessages = [...widgetMessages, userMessage];
        setWidgetMessages(newMessages);
        const currentInput = input;
        setInput("");
        setIsLoading(true);

        try {
            const result = await generateResponse({
                message: currentInput,
                character: WIDGET_PROMPT_CHARACTER,
                history: newMessages,
                userId: user?.id || undefined,
                userGender: user?.gender || "not specified",
            });
            setWidgetMessages(prev => [...prev, {
                role: "assistant",
                content: result.response,
            }]);
        } catch (error) {
            console.error("Error generating response:", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with the support bot. Please try again.",
            });
            // Revert the user message on error
            setWidgetMessages(prev => prev.slice(0, prev.length -1));
        } finally {
            setIsLoading(false);
        }
    };
    
    // hide widget on initial server render, dedicated chat page, and any connect profile pages
    if (!isClient || currentPath === "/chat" || currentPath.startsWith("/connect")) {
        return null;
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="default"
                    size="icon"
                    className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
                >
                    {isOpen ? <X className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
                    <span className="sr-only">Toggle Chat</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="end"
                className="w-[380px] h-[540px] p-0 border-0 shadow-2xl rounded-lg flex flex-col"
                sideOffset={20}
            >
                <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4">
                    <div className="flex items-center gap-2">
                        <Bot className="h-6 w-6 text-primary" />
                        <h2 className="text-lg font-semibold">Support Assistant</h2>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </header>
                <main className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="space-y-6 p-4">
                            {widgetMessages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                                >
                                    {message.role === "assistant" && (
                                        <Avatar className="h-8 w-8 border">
                                            <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div
                                        className={`max-w-[80%] rounded-lg p-3 text-sm ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                                    >
                                        <div className="prose prose-sm prose-p:my-0 max-w-full">
                                          <ReactMarkdown>{message.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                    {message.role === "user" && (
                                        <Avatar className="h-8 w-8 border">
                                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                             {isLoading && (
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8 border">
                                    <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="max-w-[80%] rounded-lg bg-muted p-3">
                                    <div className="flex items-center justify-center space-x-1">
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-foreground delay-0"></span>
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-foreground delay-150"></span>
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-foreground delay-300"></span>
                                    </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>
                </main>
                <footer className="border-t bg-card p-4">
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-1"
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </footer>
            </PopoverContent>
        </Popover>
    );
}
