
"use client";

import * as React from "react";
import { useState, useContext, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Bot, Rocket, Crown, Star, Plus, Trash2, MessageSquare, Palette, Code, FileText, Languages, UserCheck, History as HistoryIcon } from "lucide-react";
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
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />

      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col justify-center items-center min-h-screen">
            <div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
                    {t('landing.title')}
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                    {t('landing.description')}
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <Button size="lg" asChild>
                    <Link href="/chat">{t('landing.cta.chat')}</Link>
                    </Button>
                </div>
            </div>
        </section>

        <section id="features" className="bg-muted py-20 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                 <h2 className="text-3xl sm:text-4xl font-bold text-center">
                    A Suite of Powerful AI Tools
                </h2>
                <p className="mt-2 text-center text-muted-foreground max-w-2xl mx-auto">
                    From creative writing to code generation, Ana is equipped with a wide range of capabilities to assist you.
                </p>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, i) => (
                        <Card key={i} className="text-center shadow-lg">
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit">
                                    {feature.icon}
                                </div>
                                <CardTitle>{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        <section className="bg-muted py-20 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-center">
                    What Our Users Say
                </h2>
                <p className="mt-2 text-center text-muted-foreground max-w-2xl mx-auto">
                    Real stories from people who have supercharged their productivity with My Ana AI.
                </p>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                    <AddReviewCard addTestimonial={addTestimonial} />
                    {sortedTestimonials.map((testimonial) => (
                        <Card key={testimonial.id} className="flex flex-col justify-between shadow-lg h-full relative group">
                             <CardContent className="pt-6">
                                <div className="flex items-center mb-4">
                                    <Avatar className="h-12 w-12 mr-4">
                                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.avatarHint} />
                                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{testimonial.name}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </div>
                                <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                            </CardContent>
                            <div className="p-6 pt-0">
                                <div className="flex items-center">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
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

    
