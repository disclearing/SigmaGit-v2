import { Link, createFileRoute } from "@tanstack/react-router";
import { Briefcase, Heart, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_main/careers")({
  component: CareersPage,
});

function CareersPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Help us build the future of Git hosting and developer collaboration.
        </p>
      </div>

      <div className="space-y-16">
        <section>
          <h2 className="text-3xl font-semibold mb-6">Why Work at sigmagit?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border border-border bg-card">
              <Zap className="size-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Fast-Paced Innovation</h3>
              <p className="text-muted-foreground">
                Work on cutting-edge technology and help shape the future of developer tools.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <Users className="size-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Great Team</h3>
              <p className="text-muted-foreground">
                Collaborate with talented developers who are passionate about what they build.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <Heart className="size-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Work-Life Balance</h3>
              <p className="text-muted-foreground">
                We believe in sustainable work practices and supporting our team's well-being.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <Briefcase className="size-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Remote First</h3>
              <p className="text-muted-foreground">
                Work from anywhere. We're a distributed team that values flexibility and autonomy.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold mb-6">Open Positions</h2>
          <div className="space-y-4">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-xl font-semibold mb-2">Senior Full-Stack Engineer</h3>
              <p className="text-muted-foreground mb-4">
                We're looking for an experienced full-stack engineer to help us build and scale sigmagit. 
                You'll work on everything from the API to the frontend, helping shape the product.
              </p>
              <Button variant="outline" asChild>
                <a href="mailto:careers@sigmagit.com?subject=Senior Full-Stack Engineer Application">
                  Apply Now
                </a>
              </Button>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-xl font-semibold mb-2">DevOps Engineer</h3>
              <p className="text-muted-foreground mb-4">
                Help us build and maintain our infrastructure. You'll work on deployment, monitoring, 
                and ensuring our platform is fast and reliable.
              </p>
              <Button variant="outline" asChild>
                <a href="mailto:careers@sigmagit.com?subject=DevOps Engineer Application">
                  Apply Now
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="text-center p-8 rounded-lg border border-border bg-card">
          <h2 className="text-2xl font-semibold mb-4">Don't see a role that fits?</h2>
          <p className="text-muted-foreground mb-6">
            We're always looking for talented people. Send us your resume and let's talk!
          </p>
          <Button asChild>
            <a href="mailto:careers@sigmagit.com?subject=General Application">
              Get in Touch
            </a>
          </Button>
        </section>
      </div>
    </div>
  );
}
