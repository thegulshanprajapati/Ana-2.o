
"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function SearchPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold mb-4">{t('search.title')}</h1>
            <p className="text-muted-foreground mb-8">
              {t('search.description')}
            </p>
            <div className="max-w-md mx-auto flex items-center gap-2">
                <Input placeholder={t('search.placeholder')}/>
                <Button size="icon">
                    <SearchIcon/>
                </Button>
            </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
