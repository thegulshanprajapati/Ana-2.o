"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export function DevelopmentPhaseScreen({ featureName }: { featureName: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <AppHeader />
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 rounded-full bg-primary/10 p-3 text-primary">
              <Wrench className="h-6 w-6" />
            </div>
            <CardTitle>{featureName}</CardTitle>
            <CardDescription>Development Phase</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            This feature is currently under development. Please check back soon.
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
