
"use client";

import * as React from "react";
import { useState, useContext, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Bot, Rocket, Crown, Star, Plus, Trash2, MessageSquare, Palette, Code, FileText, Languages, UserCheck, History as HistoryIcon, Sparkles, ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AppContext, Testimonial } from "@/context/AppContext";

const features = [
    {
        icon: <MessageSquare className="h-8 w-8" />,
        title: "Conversational AI Chat",
        description: "Engage in dynamic, context-aware conversations with multiple AI personalities."
    },
    {
        icon: <Palette className="h-8 w-8" />,
        title: "Image Generation Studio",
        description: "Create stunning, unique images from your text descriptions in various artistic styles."
    },
    {
        icon: <Code className="h-8 w-8" />,
        title: "AI Code Studio",
        description: "Describe a webpage, and watch as Ana generates the complete HTML, CSS, and JS code."
    },
    {
        icon: <FileText className="h-8 w-8" />,
        title: "Document Generator",
        description: "Quickly generate professional-looking PDF and DOCX documents from your content."
    },
    {
        icon: <Languages className="h-8 w-8" />,
        title: "Multi-Language Support",
        description: "Interact with the UI and receive AI responses in multiple languages, including Hindi & Bengali."
    },
    {
        icon: <HistoryIcon className="h-8 w-8" />,
        title: "Persistent Chat History",
        description: "All your conversations are saved, allowing you to revisit and continue them anytime."
    }
];

export default function LandingPage() {
  const { t } = useTranslation();
  const { isAdmin, testimonials, addTestimonial, deleteTestimonial } = useContext(AppContext);
  const { toast } = useToast();

  const sortedTestimonials = useMemo(() => {
    return [...testimonials].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [testimonials]);
  
  const handleDelete = async (id: string) => {
    await deleteTestimonial(id);
    toast({
        title: "Testimonial Deleted",
        description: "The review has been removed.",
    });
  };


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      {/* Developer Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <AppHeader />

      <main className="flex-1 relative z-10">
        {/* Rich Hero Section (Strictly Fits in 100vh) */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col justify-center items-center h-[calc(100vh-4rem)] min-h-[650px] overflow-hidden relative">
            <div className="max-w-4xl mx-auto space-y-4 pt-4">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium animate-pulse mb-1">
                    <Sparkles className="h-3 w-3" /> Introducing My Ana AI v2.0
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-sm">
                        {t('landing.title')}
                    </span>
                </h1>
                <p className="max-w-2xl mx-auto text-sm md:text-base text-muted-foreground leading-relaxed">
                    {t('landing.description')}
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 items-center">
                    <Button size="default" className="shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 transition-all font-bold gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 text-white border-none hover:opacity-95" asChild>
                        <a href="https://chat.myana.site" target="_blank" rel="noopener noreferrer">
                            Use AnaChat (Messaging) <MessageSquare className="h-4 w-4" />
                        </a>
                    </Button>
                    <Button size="default" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold gap-2" asChild>
                        <Link href="/chat">
                            Start Chatting Now <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button size="default" variant="outline" className="backdrop-blur-sm border-muted-foreground/20 hover:bg-muted/50" asChild>
                        <a href="#features">Explore Features</a>
                    </Button>
                </div>
            </div>

            {/* Compressed Interactive Dashboard / Chat Mockup Preview */}
            <div className="mt-8 w-full max-w-4xl rounded-xl border border-muted/50 bg-card/60 p-2 shadow-2xl backdrop-blur-md relative group max-h-[300px]">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-xl group-hover:opacity-30 transition duration-1000" />
                <div className="relative rounded-lg overflow-hidden border border-muted bg-background/90 shadow-inner flex flex-col h-[260px]">
                    {/* Mock Browser Header */}
                    <div className="bg-muted/50 border-b px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono bg-background px-6 py-0.5 rounded border border-muted-foreground/10">my-ana-ai.chat</div>
                        <div className="w-12" />
                    </div>
                    {/* Mock Content */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Mock sidebar */}
                        <div className="w-40 border-r bg-muted/20 p-2.5 hidden sm:flex flex-col gap-1.5">
                            <div className="h-5 bg-primary/10 rounded w-full flex items-center px-2 text-[9px] font-bold text-primary">💬 New Chat</div>
                            <div className="h-3 bg-muted rounded w-3/4 mt-2" />
                            <div className="h-3 bg-muted rounded w-5/6" />
                            <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                        {/* Mock chat window */}
                        <div className="flex-1 p-4 flex flex-col justify-between">
                            <div className="space-y-3 max-w-lg mx-auto w-full">
                                <div className="flex items-start gap-2.5">
                                    <Avatar className="h-7 w-7">
                                        <AvatarImage src="/logo.png" />
                                        <AvatarFallback>A</AvatarFallback>
                                    </Avatar>
                                    <div className="bg-muted p-2.5 rounded-lg text-[11px] leading-relaxed max-w-[85%] text-left">
                                        Hello! I'm Ana, your premium AI companion. Select a persona and let's start creating!
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5 justify-end">
                                    <div className="bg-primary text-primary-foreground p-2.5 rounded-lg text-[11px] leading-relaxed max-w-[85%] text-left">
                                        Hey Ana! Teach me Bhojpuri or generate a coding template.
                                    </div>
                                </div>
                            </div>
                            <div className="border rounded-full p-1.5 bg-background flex items-center gap-2 max-w-lg mx-auto w-full">
                                <span className="text-[11px] text-muted-foreground px-3 text-left flex-1">Type your message...</span>
                                <Button size="sm" className="rounded-full h-7 px-3 text-xs">Send</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Bento Grid Features Section */}
        <section id="features" className="relative py-24 border-t border-muted/30 bg-muted/20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                 <h2 className="text-4xl sm:text-5xl font-extrabold text-center tracking-tight">
                    Powering Your Creative Limits
                </h2>
                <p className="mt-4 text-center text-muted-foreground max-w-2xl mx-auto text-lg">
                    Discover our suite of state-of-the-art AI utilities engineered for developers, writers, and thinkers.
                </p>
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, i) => (
                        <Card key={i} className="group relative overflow-hidden backdrop-blur-md bg-gradient-to-b from-card/85 to-card/45 border-muted/40 hover:border-primary/45 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5">
                            <CardHeader className="text-left">
                                <div className="bg-primary/10 text-primary p-3 rounded-xl w-fit group-hover:scale-115 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                    {feature.icon}
                                </div>
                                <CardTitle className="mt-4 text-xl font-bold">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-left">
                                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* Premium Testimonials Section */}
        <section className="py-24 border-t border-muted/50 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-center tracking-tight">
                    Loved By Creators Worldwide
                </h2>
                <p className="mt-4 text-center text-muted-foreground max-w-2xl mx-auto text-lg">
                    Here's what our early users say about how My Ana AI transforms their daily workflow.
                </p>
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                    <AddReviewCard addTestimonial={addTestimonial} />
                    {sortedTestimonials.map((testimonial) => (
                        <Card key={testimonial.id} className="flex flex-col justify-between shadow-lg h-full relative group backdrop-blur-md bg-card/50 border-muted/50 hover:border-primary/30 transition-all duration-300">
                             <CardContent className="pt-6 text-left">
                                <div className="flex items-center mb-4">
                                    <Avatar className="h-12 w-12 mr-4 border border-muted">
                                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.avatarHint} />
                                        <AvatarFallback className="font-bold">{testimonial.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-foreground">{testimonial.name}</p>
                                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </div>
                                <p className="text-muted-foreground italic leading-relaxed">"{testimonial.text}"</p>
                            </CardContent>
                            <div className="p-6 pt-0 text-left">
                                <div className="flex items-center">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4.5 w-4.5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            {isAdmin && testimonial.id && (
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleDelete(testimonial.id!)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </section>

      </main>

      <AppFooter />
    </div>
  );
}

function AddReviewCard({ addTestimonial }: { addTestimonial: (testimonial: Omit<Testimonial, 'id' | 'avatar' | 'avatarHint' | 'createdAt'>) => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const text = formData.get("review") as string;
    
    if (!name || !role || !text || rating === 0) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill out all fields and provide a rating.",
      });
      return;
    }

    await addTestimonial({ name, role, text, rating });

    setIsOpen(false);
    setRating(0);
    formRef.current?.reset();
    toast({
        title: "Thank you for your feedback!",
        description: "Your review has been submitted.",
    });
  }

  return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
              <Card className="flex flex-col justify-center items-center text-center p-6 border-2 border-dashed border-muted-foreground/50 hover:border-primary transition-colors h-full cursor-pointer">
                  <CardHeader>
                      <CardTitle>Share Your Experience</CardTitle>
                      <CardDescription>Let others know what you think about My Ana AI.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Your Review
                      </Button>
                  </CardContent>
              </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>Add Your Review</DialogTitle>
                  <DialogDescription>
                      We appreciate your feedback! Please fill out the form below.
                  </DialogDescription>
              </DialogHeader>
              <form ref={formRef} onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                              Name
                          </Label>
                          <Input name="name" id="name" placeholder="John Doe" className="col-span-3" required />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="role" className="text-right">
                              Role
                          </Label>
                          <Input name="role" id="role" placeholder="e.g. Developer" className="col-span-3" required />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="review" className="text-right">
                              Review
                          </Label>
                          <Textarea name="review" id="review" placeholder="What do you think?" className="col-span-3" required />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">
                              Rating
                          </Label>
                           <div className="col-span-3 flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-6 w-6 cursor-pointer ${ (hoverRating >= star || rating >= star) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground' }`}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  onClick={() => setRating(star)}
                                />
                              ))}
                            </div>
                      </div>
                  </div>
                  <DialogFooter>
                      <Button type="submit">Submit Review</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
  )
}

    
