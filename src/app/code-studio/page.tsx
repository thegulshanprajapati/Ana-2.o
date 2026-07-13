
"use client";

import { useEffect, useState } from 'react';
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Code, Eye, Loader2, Wand2, Clipboard } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { generateWebpage } from '@/ai/flows/generate-webpage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Splitter, SplitterPanel } from "@/components/ui/splitter";
import { getToolFeatureSettings } from '@/lib/local-data';
import { DevelopmentPhaseScreen } from '@/components/DevelopmentPhaseScreen';

export default function CodeStudioPage() {
    const [featureBlocked, setFeatureBlocked] = useState<boolean | null>(null);
    const [prompt, setPrompt] = useState("");
    const [generatedCode, setGeneratedCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        let isMounted = true;
        const loadSettings = async () => {
            try {
                const settings = await getToolFeatureSettings();
                if (isMounted) {
                    setFeatureBlocked(settings.codeStudioInDevelopment);
                }
            } catch {
                if (isMounted) {
                    setFeatureBlocked(false);
                }
            }
        };
        loadSettings();
        return () => {
            isMounted = false;
        };
    }, []);

    if (featureBlocked === null) {
        return (
            <div className="flex min-h-screen flex-col bg-muted/40">
                <AppHeader />
                <main className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </main>
                <AppFooter />
            </div>
        );
    }

    if (featureBlocked) {
        return <DevelopmentPhaseScreen featureName="AI Code Studio" />;
    }

    const handleGenerate = async () => {
        if (!prompt) {
            toast({
                variant: "destructive",
                title: "Prompt is required",
                description: "Please describe the webpage you want to create.",
            });
            return;
        }
        setIsLoading(true);
        setGeneratedCode("");
        try {
            const result = await generateWebpage({ prompt });
            setGeneratedCode(result.html);
        } catch (error)
            {
            console.error("Error generating webpage:", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "There was a problem generating the code. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (!generatedCode) {
            toast({ variant: "destructive", title: "Nothing to copy" });
            return;
        }
        navigator.clipboard.writeText(generatedCode);
        toast({ title: "Copied to clipboard!" });
    };

    const previewSrcDoc = generatedCode;

    return (
        <div className="flex flex-col h-screen bg-muted/40">
            <AppHeader />
            <main className="flex-1 overflow-hidden">
                <Splitter className="h-full">
                    <SplitterPanel defaultSize={35} minSize={25} className="p-4">
                        <Card className="w-full h-full shadow-lg flex flex-col">
                            <CardHeader>
                                <div className="flex items-center gap-2 text-primary">
                                    <Wand2 className="w-6 h-6" />
                                    <CardTitle>AI Prompt</CardTitle>
                                </div>
                                <CardDescription>Describe the component or webpage you want to build.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col flex-1 gap-4">
                                <Textarea
                                    id="prompt"
                                    placeholder="e.g., A modern login form with a title, email and password fields, and a blue login button."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="flex-1 text-base"
                                    disabled={isLoading}
                                />
                                <Button
                                    onClick={handleGenerate}
                                    disabled={isLoading}
                                    className="w-full"
                                    size="lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                       <>
                                        <Wand2 className="mr-2" />
                                        Generate
                                       </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </SplitterPanel>
                    <SplitterPanel defaultSize={65} minSize={40} className="p-4 pl-0">
                         <Tabs defaultValue="preview" className="w-full h-full flex flex-col">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="code" className="flex items-center gap-2"><Code /> Code</TabsTrigger>
                                <TabsTrigger value="preview" className="flex items-center gap-2"><Eye /> Preview</TabsTrigger>
                            </TabsList>
                            <TabsContent value="code" className="flex-1 h-0 mt-2">
                                <Card className="h-full flex flex-col relative">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-3 right-3 z-10"
                                        onClick={handleCopy}
                                        disabled={!generatedCode}
                                    >
                                        <Clipboard className="w-5 h-5"/>
                                        <span className="sr-only">Copy Code</span>
                                    </Button>
                                    <CardHeader>
                                        <CardTitle>Generated Code</CardTitle>
                                        <CardDescription>This is the HTML, CSS, and JS generated by the AI.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-0">
                                        <ScrollArea className="h-full">
                                            <pre className="p-4 text-sm font-code">
                                                <code>{generatedCode || "Click 'Generate' to see code here..."}</code>
                                            </pre>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="preview" className="flex-1 h-0 mt-2">
                                <Card className="h-full flex flex-col">
                                    <CardHeader>
                                        <CardTitle>Live Preview</CardTitle>
                                        <CardDescription>This is a live render of the generated code.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-0 bg-white">
                                        {generatedCode ? (
                                            <iframe
                                                srcDoc={previewSrcDoc}
                                                title="Preview"
                                                className="w-full h-full border-0"
                                                sandbox="allow-scripts allow-same-origin"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                <p>Preview will appear here.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </SplitterPanel>
                </Splitter>
            </main>
        </div>
    );
}
