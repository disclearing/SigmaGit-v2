import { createFileRoute } from "@tanstack/react-router";
import { GitBranch, Users, Code, Heart } from "lucide-react";

export const Route = createFileRoute("/_main/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">About sigmagit</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A modern Git hosting platform built by developers, for developers.
        </p>
      </div>

      <div className="space-y-16">
        <section>
          <h2 className="text-3xl font-semibold mb-4">Our Mission</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            At sigmagit, we believe that code hosting should be simple, fast, and accessible to everyone. 
            We're building a platform that combines the power of Git with modern collaboration tools, 
            making it easier for teams to build amazing things together.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-semibold mb-6">What We Offer</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border border-border bg-card">
              <GitBranch className="size-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Git Hosting</h3>
              <p className="text-muted-foreground">
                Full Git support with SSH and HTTPS. Clone, push, and pull just like you're used to.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <Users className="size-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Work together seamlessly with pull requests, issues, and discussions.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <Code className="size-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Open Source</h3>
              <p className="text-muted-foreground">
                Built with transparency in mind. Self-host or use our cloud platform.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <Heart className="size-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Developer First</h3>
              <p className="text-muted-foreground">
                Every feature is designed with developers in mind, prioritizing speed and simplicity.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold mb-4">Our Story</h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-4">
            sigmagit was born out of frustration with existing Git hosting solutions. We wanted something 
            that was fast, reliable, and didn't get in the way of our workflow. So we built it ourselves.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Today, sigmagit powers thousands of repositories and helps teams around the world collaborate 
            more effectively. We're committed to keeping it open, transparent, and focused on what matters: 
            making developers' lives easier.
          </p>
        </section>
      </div>
    </div>
  );
}
