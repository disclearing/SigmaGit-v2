"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Copy } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn, getApiUrl } from "@/lib/utils";

interface CloneUrlProps {
  username: string;
  repoName: string;
  className?: string;
}

export function CloneUrl({ username, repoName, className }: CloneUrlProps) {
  const [copied, setCopied] = useState(false);
  const [protocol, setProtocol] = useState<"https" | "ssh">("https");

  const httpsUrl = `${getApiUrl()}/${username}/${repoName}.git`;
  const sshUrl = `git@sigmagit.com:${username}/${repoName}.git`;

  const url = protocol === "https" ? httpsUrl : sshUrl;

  async function copyToClipboard() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("flex w-full items-stretch gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "default", className: "shrink-0" }), "h-10")}>
          {protocol.toUpperCase()}
          <ChevronDown className="size-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setProtocol("https")}>HTTPS</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setProtocol("ssh")}>SSH</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="relative min-w-0 flex-1">
        <Input value={url} readOnly className="pr-10 font-mono text-xs bg-muted/50 h-10" />
        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 size-7 -translate-y-1/2" onClick={copyToClipboard}>
          {copied ? <CheckCircle2 className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}
