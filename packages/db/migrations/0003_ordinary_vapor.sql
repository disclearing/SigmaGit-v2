CREATE TABLE "gist_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gist_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gist_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gist_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"content" text NOT NULL,
	"language" text,
	"size" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gist_forks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gist_id" uuid NOT NULL,
	"forked_from_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gist_stars" (
	"user_id" text NOT NULL,
	"gist_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gist_stars_user_id_gist_id_pk" PRIMARY KEY("user_id","gist_id")
);
--> statement-breakpoint
CREATE TABLE "gists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"description" text,
	"visibility" text DEFAULT 'public' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "migration_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"migration_id" uuid NOT NULL,
	"auth_token" text,
	"auth_type" text DEFAULT 'token',
	"ssh_key" text,
	"ssh_key_passphrase" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "release_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" uuid NOT NULL,
	"name" text NOT NULL,
	"label" text,
	"content_type" text NOT NULL,
	"size" bigint NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"storage_key" text NOT NULL,
	"uploader_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "release_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "release_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_id" uuid,
	"comment_id" uuid,
	"user_id" text NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"tag_name" text NOT NULL,
	"name" text NOT NULL,
	"body" text,
	"is_draft" boolean DEFAULT false NOT NULL,
	"is_prerelease" boolean DEFAULT false NOT NULL,
	"target_commitish" text DEFAULT 'main' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository_migrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid,
	"user_id" text NOT NULL,
	"source" text NOT NULL,
	"source_url" text NOT NULL,
	"source_base_url" text,
	"source_owner" text,
	"source_repo" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"options" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nostr_public_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nostr_linked_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nwc_connection_string" text;--> statement-breakpoint
ALTER TABLE "gist_comments" ADD CONSTRAINT "gist_comments_gist_id_gists_id_fk" FOREIGN KEY ("gist_id") REFERENCES "public"."gists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gist_comments" ADD CONSTRAINT "gist_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gist_files" ADD CONSTRAINT "gist_files_gist_id_gists_id_fk" FOREIGN KEY ("gist_id") REFERENCES "public"."gists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gist_forks" ADD CONSTRAINT "gist_forks_gist_id_gists_id_fk" FOREIGN KEY ("gist_id") REFERENCES "public"."gists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gist_forks" ADD CONSTRAINT "gist_forks_forked_from_id_gists_id_fk" FOREIGN KEY ("forked_from_id") REFERENCES "public"."gists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gist_forks" ADD CONSTRAINT "gist_forks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gist_stars" ADD CONSTRAINT "gist_stars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gist_stars" ADD CONSTRAINT "gist_stars_gist_id_gists_id_fk" FOREIGN KEY ("gist_id") REFERENCES "public"."gists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gists" ADD CONSTRAINT "gists_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "migration_credentials" ADD CONSTRAINT "migration_credentials_migration_id_repository_migrations_id_fk" FOREIGN KEY ("migration_id") REFERENCES "public"."repository_migrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_assets" ADD CONSTRAINT "release_assets_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_assets" ADD CONSTRAINT "release_assets_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_comments" ADD CONSTRAINT "release_comments_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_comments" ADD CONSTRAINT "release_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_reactions" ADD CONSTRAINT "release_reactions_release_id_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."releases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_reactions" ADD CONSTRAINT "release_reactions_comment_id_release_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."release_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_reactions" ADD CONSTRAINT "release_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_migrations" ADD CONSTRAINT "repository_migrations_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_migrations" ADD CONSTRAINT "repository_migrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gist_comments_gist_id_idx" ON "gist_comments" USING btree ("gist_id");--> statement-breakpoint
CREATE INDEX "gist_files_gist_id_idx" ON "gist_files" USING btree ("gist_id");--> statement-breakpoint
CREATE INDEX "gist_forks_gist_id_idx" ON "gist_forks" USING btree ("gist_id");--> statement-breakpoint
CREATE INDEX "gists_owner_id_idx" ON "gists" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "gists_created_at_idx" ON "gists" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "migration_creds_migration_id_idx" ON "migration_credentials" USING btree ("migration_id");--> statement-breakpoint
CREATE INDEX "release_assets_release_id_idx" ON "release_assets" USING btree ("release_id");--> statement-breakpoint
CREATE INDEX "release_comments_release_id_idx" ON "release_comments" USING btree ("release_id");--> statement-breakpoint
CREATE INDEX "release_reactions_release_id_idx" ON "release_reactions" USING btree ("release_id");--> statement-breakpoint
CREATE INDEX "release_reactions_comment_id_idx" ON "release_reactions" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "releases_repository_id_idx" ON "releases" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "releases_repo_tag_idx" ON "releases" USING btree ("repository_id","tag_name");--> statement-breakpoint
CREATE INDEX "repo_migrations_user_id_idx" ON "repository_migrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "repo_migrations_status_idx" ON "repository_migrations" USING btree ("status");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_nostr_public_key_unique" UNIQUE("nostr_public_key");