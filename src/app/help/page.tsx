
"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { LifeBuoy } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

const faqs = [
    {
        question: "What is My Ana AI?",
        answer: "My Ana AI is a powerful and friendly AI assistant designed to help with a wide range of tasks, from answering questions to generating creative content and code."
    },
    {
        question: "How does the free plan work?",
        answer: "The free plan allows you to try out Ana's basic features with a limited number of messages per month. It's a great way to get started and see what Ana can do."
    },
    {
        question: "Can I upgrade my plan at any time?",
        answer: "Yes, you can upgrade your plan at any time from your account settings page. Your new features will be available immediately."
    },
    {
        question: "Is my data secure?",
        answer: "We take data privacy and security very seriously. All conversations are encrypted, and we have strict policies in place to protect your information. Please see our Privacy Policy for more details."
    }
];

export default function HelpPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <LifeBuoy className="mx-auto h-16 w-16 text-primary mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold">Help Center</h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
                How can we help you?
            </p>
            <div className="mt-8 max-w-xl mx-auto">
                <Input placeholder="Search for help articles..." />
            </div>
        </section>
        <section className="bg-muted py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
                <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, i) => (
                         <AccordionItem key={i} value={`item-${i}`}>
                            <AccordionTrigger className="text-lg font-semibold">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-base text-muted-foreground">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                 <p className="text-center text-muted-foreground mt-12">This is a placeholder page.</p>
            </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
