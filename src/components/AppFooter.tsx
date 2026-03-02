
"use client";

import Link from "next/link";
import { Bot, Github, Twitter, Linkedin, Users } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function AppFooter() {
    const { t } = useTranslation();
    return (
        <footer className="border-t bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                    <Bot className="w-8 h-8 text-primary" />
                    <span>My Ana AI</span>
                </Link>
                <p className="text-sm text-muted-foreground mt-2">{t('footer.tagline')}</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">{t('footer.company')}</h4>
              <nav className="flex flex-col gap-2 text-sm">
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.about')}</Link>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.contact')}</Link>
                <Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.careers')}</Link>
                <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.blog')}</Link>
                 <Link href="/press" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.press')}</Link>
                 <Link href="/anaconnect" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <Users className="w-4 h-4" /> AnaConnect
                 </Link>
                 <Link href="/community" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                    <Users className="w-4 h-4" /> Community
                 </Link>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">{t('footer.resources')}</h4>
              <nav className="flex flex-col gap-2 text-sm">
                 <Link href="/api-docs" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.api')}</Link>
                 <Link href="/search" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.search')}</Link>
                 <Link href="/image-generator" className="text-muted-foreground hover:text-primary transition-colors">Image Generator</Link>
                 <Link href="/doc-generator" className="text-muted-foreground hover:text-primary transition-colors">Doc Generator</Link>
                 <Link href="/code-studio" className="text-muted-foreground hover:text-primary transition-colors">AI Code Studio</Link>
                 <Link href="/help" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.help')}</Link>
                 <Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.admin')}</Link>
              </nav>
            </div>
             <div className="space-y-4">
              <h4 className="font-semibold text-foreground">{t('footer.legal')}</h4>
              <nav className="flex flex-col gap-2 text-sm">
                 <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.terms')}</Link>
                 <Link href="/privacy" className="text-muted-foreground hovertext-primary transition-colors">{t('footer.privacy')}</Link>
              </nav>
            </div>
            <div className="space-y-4">
               <h4 className="font-semibold text-foreground">{t('footer.connect')}</h4>
               <div className="flex items-center gap-4">
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Github className="w-6 h-6"/></Link>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="w-6 h-6"/></Link>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="w-6 h-6"/></Link>
               </div>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center">
             <p className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} My Ana AI. {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    )
}
