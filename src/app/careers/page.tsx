
"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Briefcase, Building2 } from "lucide-react";

export default function CareersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <Building2 className="mx-auto h-16 w-16 text-primary mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold">Careers at My Ana AI</h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
                Join our mission to revolutionize human-computer interaction. We're looking for passionate individuals to join our team.
            </p>
        </section>
        <section className="bg-muted py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-center mb-12">Open Positions</h2>
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="bg-card p-6 rounded-lg shadow-sm flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-semibold">Senior AI Engineer</h3>
                            <p className="text-muted-foreground">Remote</p>
                        </div>
                        <Briefcase className="w-6 h-6 text-primary"/>
                    </div>
                     <div className="bg-card p-6 rounded-lg shadow-sm flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-semibold">Frontend Developer (Next.js)</h3>
                            <p className="text-muted-foreground">New York, NY</p>
                        </div>
                        <Briefcase className="w-6 h-6 text-primary"/>
                    </div>
                     <div className="bg-card p-6 rounded-lg shadow-sm flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-semibold">Product Marketing Manager</h3>
                            <p className="text-muted-foreground">Remote</p>
                        </div>
                         <Briefcase className="w-6 h-6 text-primary"/>
                    </div>
                </div>
                 <p className="text-center text-muted-foreground mt-12">More positions coming soon. This is a placeholder page.</p>
            </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
