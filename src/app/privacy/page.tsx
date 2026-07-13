
"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl prose dark:prose-invert">
            <div className="text-center mb-12">
                <ShieldCheck className="mx-auto h-16 w-16 text-primary" />
                <h1 className="text-4xl font-bold mt-4">Privacy Policy</h1>
                <p className="text-muted-foreground">Last updated: October 26, 2023</p>
            </div>
            
            <h2>1. Information We Collect</h2>
            <p>
                We collect information that you provide to us directly, such as when you create an account, and information that is automatically collected, such as your IP address.
                This is a placeholder document.
            </p>

            <h2>2. How We Use Your Information</h2>
            <p>
                We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to protect My Ana AI and our users.
            </p>
            
            <h2>3. Sharing of Information</h2>
            <p>
                We do not share your personal information with companies, organizations, or individuals outside of My Ana AI except in the following cases: with your consent, for external processing, or for legal reasons.
            </p>

             <h2>4. Data Security</h2>
            <p>
                We work hard to protect My Ana AI and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold.
            </p>

        </div>
      </main>
      <AppFooter />
    </div>
  );
}
