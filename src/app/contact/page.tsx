
"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

export default function ContactPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle className="text-3xl">{t('contact.title')}</CardTitle>
                <CardDescription>{t('contact.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first-name">{t('contact.first_name')}</Label>
                            <Input id="first-name" placeholder="John"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last-name">{t('contact.last_name')}</Label>
                            <Input id="last-name" placeholder="Doe"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('contact.email')}</Label>
                        <Input id="email" type="email" placeholder="john@example.com"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">{t('contact.message')}</Label>
                        <Textarea id="message" placeholder={t('contact.message') + '...'}/>
                    </div>
                    <Button type="submit" className="w-full">{t('contact.button')}</Button>
                </form>
            </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
