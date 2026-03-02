CREATE TABLE "runners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"token" text NOT NULL,
	"labels" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'offline' NOT NULL,
	"last_seen_at" timestamp,
	"current_job_id" uuid,
	"ip_address" text,
	"os" text,
	"arch" text,
	"version" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "runners_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_ssh_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"public_key" text NOT NULL,
	"algorithm" text NOT NULL,
	"fingerprint_sha256" text NOT NULL,
	"last_used_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_ssh_keys_fingerprint_sha256_unique" UNIQUE("fingerprint_sha256")
);
--> statement-breakpoint
CREATE TABLE "workflow_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"name" text NOT NULL,
	"runner_id" uuid,
	"status" text DEFAULT 'queued' NOT NULL,
	"conclusion" text,
	"workflow_definition" jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"triggered_by" text,
	"commit_sha" text NOT NULL,
	"branch" text NOT NULL,
	"event_name" text NOT NULL,
	"event_payload" jsonb,
	"status" text DEFAULT 'queued' NOT NULL,
	"conclusion" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"exit_code" integer,
	"log_output" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"content" text NOT NULL,
	"triggers" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_ssh_keys" ADD CONSTRAINT "user_ssh_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_jobs" ADD CONSTRAINT "workflow_jobs_run_id_workflow_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."workflow_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_jobs" ADD CONSTRAINT "workflow_jobs_runner_id_runners_id_fk" FOREIGN KEY ("runner_id") REFERENCES "public"."runners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_job_id_workflow_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."workflow_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "runners_status_idx" ON "runners" USING btree ("status");--> statement-breakpoint
CREATE INDEX "runners_token_idx" ON "runners" USING btree ("token");--> statement-breakpoint
CREATE INDEX "user_ssh_keys_user_id_idx" ON "user_ssh_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_ssh_keys_revoked_at_idx" ON "user_ssh_keys" USING btree ("revoked_at");--> statement-breakpoint
CREATE INDEX "workflow_jobs_run_id_idx" ON "workflow_jobs" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "workflow_jobs_status_idx" ON "workflow_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workflow_jobs_runner_id_idx" ON "workflow_jobs" USING btree ("runner_id");--> statement-breakpoint
CREATE INDEX "workflow_runs_repository_id_idx" ON "workflow_runs" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "workflow_runs_workflow_id_idx" ON "workflow_runs" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "workflow_runs_status_idx" ON "workflow_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workflow_steps_job_id_idx" ON "workflow_steps" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "workflows_repository_id_idx" ON "workflows" USING btree ("repository_id");