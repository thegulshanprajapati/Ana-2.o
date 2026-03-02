
"use client";

import { Suspense, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Loader2 } from 'lucide-react';

function CheckoutRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the home page as pricing is no longer available
        router.push('/');
    }, [router]);

    return (
        <main className="flex-1 flex flex-col items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </main>
    );
}

export default function CheckoutPage() {
    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <AppHeader />
            <Suspense fallback={
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                </div>
            }>
                <CheckoutRedirect />
            </Suspense>
            <AppFooter />
        </div>
    );
}
