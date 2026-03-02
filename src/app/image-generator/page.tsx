
"use client";

import { useState, useContext, useEffect } from 'react';
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Image as ImageIcon, Loader2, Sparkles, Wand2, Download, Eye } from "lucide-react";
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { generateImage } from '@/ai/flows/generate-image';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AppContext } from '@/context/AppContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { getToolFeatureSettings } from '@/lib/local-data';
import { DevelopmentPhaseScreen } from '@/components/DevelopmentPhaseScreen';

const styles = [
    "Photorealistic", "Anime", "Digital Art", "Comic Book", "Fantasy Art", "Neon-punk", "3D Model", "Cinematic", "Abstract"
];

export default function ImageGeneratorPage() {
    const [featureBlocked, setFeatureBlocked] = useState<boolean | null>(null);
    const [prompt, setPrompt] = useState("");
    const [style, setStyle] = useState("Photorealistic");
    const [aspectRatio, setAspectRatio] = useState("1:1");
    const [hdQuality, setHdQuality] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generationCount, setGenerationCount] = useState(0);
    
    const { toast } = useToast();
    const { isAdmin } = useContext(AppContext);

    useEffect(() => {
        let isMounted = true;
        const loadSettings = async () => {
            try {
                const settings = await getToolFeatureSettings();
                if (isMounted) {
                    setFeatureBlocked(settings.imageGeneratorInDevelopment);
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
        return <DevelopmentPhaseScreen featureName="Image Generator" />;
    }

    const handleGenerate = async () => {
        if (!prompt) {
            toast({
                variant: "destructive",
                title: "Prompt is required",
                description: "Please enter a prompt to generate an image.",
            });
            return;
        }
        if (hdQuality && !isAdmin) {
             toast({
                variant: "destructive",
                title: "Pro Feature",
                description: "HD Quality is available for Pro users. Please upgrade your plan.",
            });
            return;
        }

        setIsLoading(true);
        setGeneratedImage(null);
        try {
            const fullPrompt = `${prompt}, ${style} style, ${aspectRatio} aspect ratio${hdQuality ? ', hd quality' : ''}`;
            const result = await generateImage({ prompt: fullPrompt });
            if (result.imageUrl) {
                setGeneratedImage(result.imageUrl);
                setGenerationCount(prev => prev + 1);
            } else {
                 toast({
                    variant: "destructive",
                    title: "Image generation failed",
                    description: "Could not generate image. Please try again.",
                });
            }
        } catch (error) {
            console.error("Error generating image:", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with the image generator. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const downloadFileName = `ana_generated_${generationCount}.png`;

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <AppHeader />
            <main className="flex-1 flex flex-col items-center p-4 gap-8">
                <Card className="w-full max-w-2xl shadow-lg">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Wand2 className="w-6 h-6" />
                            <CardTitle className="text-2xl">Image Generation Studio</CardTitle>
                        </div>
                        <CardDescription>Describe the image you want to create in detail.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="prompt">Your Prompt</Label>
                            <Textarea
                                id="prompt"
                                placeholder="e.g., A majestic lion wearing a crown, sitting on a throne in a jungle, cinematic lighting"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="min-h-[120px] text-base"
                                disabled={isLoading}
                            />
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="style">Artistic Style</Label>
                                 <Select value={style} onValueChange={setStyle} disabled={isLoading}>
                                    <SelectTrigger id="style">
                                        <SelectValue placeholder="Select style" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {styles.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>Aspect Ratio</Label>
                                <div className="flex gap-2">
                                    {["1:1", "16:9", "9:16"].map(ratio => (
                                        <Button
                                            key={ratio}
                                            variant={aspectRatio === ratio ? 'default' : 'outline'}
                                            onClick={() => setAspectRatio(ratio)}
                                            className="flex-1"
                                            disabled={isLoading}
                                        >
                                            {ratio}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="hd-quality" className="font-semibold flex items-center gap-1">
                                    <Sparkles className="text-yellow-500" />
                                    HD Quality
                                </Label>
                                 <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Badge variant="outline" className="text-xs font-bold text-primary border-primary">{isAdmin ? 'ADMIN' : 'PRO'}</Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>HD quality is available for Pro and Admin users.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Switch id="hd-quality" checked={hdQuality} onCheckedChange={setHdQuality} disabled={isLoading || !isAdmin}/>
                        </div>


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
                                <ImageIcon className="mr-2" />
                                Generate Image
                               </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {isLoading && (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p>Generating your masterpiece...</p>
                        <p className="text-xs">This can take up to 30 seconds.</p>
                    </div>
                )}
                
                {generatedImage && !isLoading && (
                    <Card className="w-full max-w-2xl shadow-lg">
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2"><Eye/> Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative aspect-square w-full rounded-lg border-2 border-dashed flex items-center justify-center bg-card/50 overflow-hidden p-2">
                                <Image src={generatedImage} alt="Generated image" width={1024} height={1024} className="object-contain h-full w-full rounded-md" />
                                <Image
                                    src="/logo.png"
                                    alt="Watermark"
                                    width={80}
                                    height={80}
                                    className="absolute bottom-4 right-4 opacity-75 pointer-events-none"
                                />
                            </div>
                            <Button asChild className="w-full" size="lg">
                                <a href={generatedImage} download={downloadFileName}>
                                    <Download className="mr-2" />
                                    Download Image
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {!generatedImage && !isLoading && (
                    <div className="w-full max-w-2xl aspect-square rounded-lg border-2 border-dashed flex items-center justify-center bg-card/50 overflow-hidden shadow-lg p-4">
                         <div className="flex flex-col items-center gap-2 text-muted-foreground text-center">
                            <Image src="/logo.png" alt="Ana AI Logo" width={150} height={150} className="opacity-20" />
                            <h3 className="font-semibold text-lg mt-4">Your image will appear here</h3>
                            <p className="text-sm">Enter a prompt and click generate to see the magic happen.</p>
                        </div>
                    </div>
                )}

            </main>
            <AppFooter />
        </div>
    );
}
