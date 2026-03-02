
"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold">{t('about.title')}</h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
                {t('about.description')}
            </p>
        </section>
        <section className="bg-muted py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-center mb-12">{t('about.team.title')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
                    <Card className="text-center">
                        <CardContent className="pt-6">
                            <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-primary">
                                <AvatarImage src="https://picsum.photos/200/200" data-ai-hint="person" />
                                <AvatarFallback><Users/></AvatarFallback>
                            </Avatar>
                            <h3 className="text-xl font-semibold">Gulshan Prajapati</h3>
                            <p className="text-muted-foreground">Founder</p>
                        </CardContent>
                    </Card>
                    <Card className="text-center">
                         <CardContent className="pt-6">
                            <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-primary">
                                <AvatarImage src="https://picsum.photos/200/200" data-ai-hint="person" />
                                <AvatarFallback><Users/></AvatarFallback>
                            </Avatar>
                            <h3 className="text-xl font-semibold">Ankita Sharma</h3>
                            <p className="text-muted-foreground">Co-Founder</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}

    