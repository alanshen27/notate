"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Wand2, Bot, Merge, FileText, Plus } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div>
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative isolate bg-linear-65 from-purple-200 to-pink-200">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Note Taking</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Notate
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Transform your notes with AI. Get instant summaries, smart organization, and let AI enhance your content with a single click.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/notes">
                <Button size="lg">
                  Start Creating
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/notes">
                <Button variant="outline" size="lg">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">AI-Powered Features</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Your Intelligent Note-Taking Assistant
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Experience the future of note-taking with AI that understands, enhances, and transforms your content.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <Merge className="h-5 w-5 flex-none text-primary" aria-hidden="true" />
                Smart Enhancement
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p className="flex-auto">One-click AI enhancement that combines your notes with summaries and adds relevant context.</p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <Wand2 className="h-5 w-5 flex-none text-primary" aria-hidden="true" />
                Intelligent Organization
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p className="flex-auto">AI automatically categorizes and tags your notes, suggesting connections between related content.</p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <Bot className="h-5 w-5 flex-none text-primary" aria-hidden="true" />
                Smart Suggestions
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p className="flex-auto">Get AI-powered suggestions for additional content, related topics, and missing information.</p>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-pink-200">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">How It Works</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Experience the Power of AI
            </p>
          </div>
          <div className="mx-auto max-w-2xl lg:max-w-none mt-20">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <FileText className="h-5 w-5 flex-none text-primary" aria-hidden="true" />
                  1. Write Your Notes
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">Create your notes naturally - our AI analyzes your content in real-time.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <Plus className="h-5 w-5 flex-none text-primary" aria-hidden="true" />
                  2. One-Click Enhancement
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">Click to enhance your notes with AI-generated summaries, context, and additional insights.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <Sparkles className="h-5 w-5 flex-none text-primary" aria-hidden="true" />
                  3. Enhanced Content
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">Get a comprehensive note that combines your content with AI-generated enhancements.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Transform Your Note-Taking?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Experience the power of AI-enhanced notes with just one click.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/notes">
              <Button size="lg">
                Start Your Journey
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
