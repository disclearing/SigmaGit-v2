import { Link, createFileRoute } from "@tanstack/react-router";
import { BookOpen, Code2, GitBranch, Shield, Terminal, User } from "lucide-react";
import { createMeta } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_main/features")({
  head: () => ({ meta: createMeta({ title: "Features", description: "Git hosting, pull requests, issues, team collaboration, security, and CI/CD. Everything you need to ship code." }) }),
  component: FeaturesPage,
});

const FEATURES = [
  {
    icon: <GitBranch className="size-6" />,
    title: "Git Hosting",
    description:
      "Full Git support with SSH and HTTPS. Clone, push, and pull just like you're used to.",
  },
  {
    icon: <Code2 className="size-6" />,
    title: "Pull Requests",
    description:
      "Review code, discuss changes, and merge with confidence. Built-in code review tools.",
  },
  {
    icon: <BookOpen className="size-6" />,
    title: "Issues & Discussions",
    description:
      "Track bugs, plan features, and discuss ideas. Keep your team aligned and organized.",
  },
  {
    icon: <User className="size-6" />,
    title: "Team Collaboration",
    description:
      "Work together seamlessly with fine-grained permissions and team management.",
  },
  {
    icon: <Shield className="size-6" />,
    title: "Security First",
    description:
      "Enterprise-grade security with 2FA, SSO, and advanced access controls.",
  },
  {
    icon: <Terminal className="size-6" />,
    title: "CI/CD Integration",
    description:
      "Connect with your favorite CI/CD tools. Automate your workflow from code to deployment.",
  },
];

function FeaturesPage() {
  return (
    <div className="container">
      <section className="py-16 lg:py-24">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Features
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">SigmaGit features</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features to help you build, collaborate, and ship faster
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h2 className="text-lg font-semibold mb-2">{feature.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get started
              </Button>
            </Link>
            <Link to="/explore">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Explore repositories
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
