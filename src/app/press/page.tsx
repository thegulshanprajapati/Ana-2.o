
"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PressPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <Newspaper className="mx-auto h-16 w-16 text-primary mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold">Press & Media</h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
                For all media inquiries, please download our press kit or contact us directly.
            </p>
             <div className="mt-8">
                <Button size="lg">Download Press Kit</Button>
            </div>
        </section>
         <section className="bg-muted py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-center mb-12">My Ana AI in the News</h2>
                <div className="max-w-4xl mx-auto space-y-4">
                    <p className="text-center text-muted-foreground">No press mentions yet. This is a placeholder page.</p>
                </div>
            </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
