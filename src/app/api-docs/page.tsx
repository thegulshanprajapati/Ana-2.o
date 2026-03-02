
"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

export default function ApiDocsPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-4">{t('api.title')}</h1>
            <p className="text-muted-foreground mb-8">
                {t('api.description')}
            </p>

            <Card>
                <CardHeader>
                    <CardTitle>{t('api.endpoint.title')}</CardTitle>
                    <CardDescription>/api/generate</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">{t('api.endpoint.description')}</p>
                    <h4 className="font-semibold mb-2">{t('api.request_body')}</h4>
                    <pre className="bg-muted p-4 rounded-md text-sm mb-4">
                        <code>
{`{
  "message": "Hello, how are you?",
  "character": "Friendly",
  "language": "English"
}`}
                        </code>
                    </pre>

                     <h4 className="font-semibold mb-2">{t('api.response')}</h4>
                    <pre className="bg-muted p-4 rounded-md text-sm">
                        <code>
{`{
  "response": "I'm doing great, thank you for asking! How can I help you today?"
}`}
                        </code>
                    </pre>
                </CardContent>
            </Card>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
