
"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl prose dark:prose-invert">
            <div className="text-center mb-12">
                <FileText className="mx-auto h-16 w-16 text-primary" />
                <h1 className="text-4xl font-bold mt-4">Terms of Service</h1>
                <p className="text-muted-foreground">Last updated: October 26, 2023</p>
            </div>
            
            <h2>1. Introduction</h2>
            <p>
                Welcome to My Ana AI. These Terms of Service ("Terms") govern your use of our website and services. 
                This is a placeholder document.
            </p>

            <h2>2. Your Account</h2>
            <p>
                You are responsible for maintaining the confidentiality of your account and password.
            </p>
            
            <h2>3. Content</h2>
            <p>
                Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the Content that you post on or through the Service.
            </p>

             <h2>4. Limitation Of Liability</h2>
            <p>
                In no event shall My Ana AI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.
            </p>
            
             <h2>5. Governing Law</h2>
            <p>
                These Terms shall be governed and construed in accordance with the laws of the jurisdiction, without regard to its conflict of law provisions.
            </p>

        </div>
      </main>
      <AppFooter />
    </div>
  );
}
