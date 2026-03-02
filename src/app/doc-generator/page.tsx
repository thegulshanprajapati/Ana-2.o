
"use client";

import { useEffect, useState } from 'react';
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, FileType, FileUp, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { getToolFeatureSettings } from '@/lib/local-data';
import { DevelopmentPhaseScreen } from '@/components/DevelopmentPhaseScreen';

export default function DocGeneratorPage() {
    const [featureBlocked, setFeatureBlocked] = useState<boolean | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState<"pdf" | "docx" | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        let isMounted = true;
        const loadSettings = async () => {
            try {
                const settings = await getToolFeatureSettings();
                if (isMounted) {
                    setFeatureBlocked(settings.docGeneratorInDevelopment);
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
        return <DevelopmentPhaseScreen featureName="Doc Generator" />;
    }

    const handleGenerate = (format: "pdf" | "docx") => {
        if (!title || !content) {
            toast({
                variant: "destructive",
                title: "Content is required",
                description: "Please enter a title and content for your document.",
            });
            return;
        }

        setIsLoading(format);

        // Simulate API call and file download
        setTimeout(() => {
            toast({
                title: "Generation Complete",
                description: `Your ${format.toUpperCase()} document is ready for download. (This is a demo)`,
            });
            setIsLoading(null);
        }, 2000);
    };


    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <AppHeader />
            <main className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-3xl shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-2">
                           <FileText className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-3xl">AI Document Generator</CardTitle>
                        <CardDescription>Create professional documents from your text content.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                             <Input
                                placeholder="Document Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-lg"
                                disabled={!!isLoading}
                            />
                            <Textarea
                                placeholder="Start writing your document content here..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="min-h-[300px] text-base"
                                disabled={!!isLoading}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button
                                    onClick={() => handleGenerate('pdf')}
                                    disabled={!!isLoading}
                                    size="lg"
                                    variant="outline"
                                >
                                    {isLoading === 'pdf' ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating PDF...
                                        </>
                                    ) : (
                                       <>
                                            <FileType className="mr-2" />
                                            Generate PDF
                                       </>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => handleGenerate('docx')}
                                    disabled={!!isLoading}
                                    size="lg"
                                >
                                     {isLoading === 'docx' ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating DOCX...
                                        </>
                                    ) : (
                                       <>
                                            <FileType className="mr-2" />
                                            Generate DOCX
                                       </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
            <AppFooter />
        </div>
    );
}
