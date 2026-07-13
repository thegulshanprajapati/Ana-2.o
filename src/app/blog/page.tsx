
"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Rss } from "lucide-react";
import Image from "next/image";

const blogPosts = [
    {
        title: "The Future of Generative AI",
        description: "Exploring the next wave of innovation in AI and what it means for society.",
        date: "October 26, 2023",
        author: "Alice Johnson",
        image: "https://picsum.photos/600/400",
        imageHint: "technology abstract"
    },
    {
        title: "Building with Next.js and Firebase",
        description: "A technical deep-dive into the stack that powers My Ana AI.",
        date: "October 20, 2023",
        author: "Bob Williams",
        image: "https://picsum.photos/600/400",
        imageHint: "code screen"
    },
    {
        title: "The Ethics of AI Companions",
        description: "A thoughtful discussion on the responsibility of creating friendly and safe AI.",
        date: "October 15, 2023",
        author: "Charlie Brown",
        image: "https://picsum.photos/600/400",
        imageHint: "robot human"
    }
];

export default function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <Rss className="mx-auto h-16 w-16 text-primary mb-4" />
                <h1 className="text-4xl md:text-5xl font-bold">The My Ana AI Blog</h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                    News, updates, and thoughts on the future of artificial intelligence.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogPosts.map(post => (
                    <Card key={post.title} className="flex flex-col overflow-hidden">
                        <Image src={post.image} alt={post.title} data-ai-hint={post.imageHint} width={600} height={400} className="w-full h-48 object-cover" />
                        <CardHeader>
                            <CardTitle>{post.title}</CardTitle>
                            <CardDescription>{post.author} - {post.date}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{post.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
             <p className="text-center text-muted-foreground mt-12">This is a placeholder page with sample blog posts.</p>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

    