/**
 * Trigger a workflow run for a repository event.
 *
 * Queries active workflows matching the event, creates workflow_runs and
 * workflow_jobs rows in "queued" state. Runners pick them up via heartbeat.
 */
import { db, workflows, workflowRuns, workflowJobs } from '@sigmagit/db';
import { eq, and } from 'drizzle-orm';

type TriggerEvent = 'push' | 'pull_request' | 'workflow_dispatch';

interface TriggerOptions {
  repoId: string;
  branch: string;
  commitSha: string;
  eventName: TriggerEvent;
  eventPayload?: Record<string, unknown>;
  triggeredBy?: string;
  /** For workflow_dispatch — only trigger a specific workflow */
  workflowId?: string;
}

/**
 * Very minimal YAML job parser — extracts top-level `jobs:` keys and their
 * definitions from a GitHub Actions workflow YAML string.
 */
function parseJobsFromYaml(content: string): Array<{ name: string; definition: Record<string, unknown> }> {
  const jobs: Array<{ name: string; definition: Record<string, unknown> }> = [];
  const lines = content.split('\n');

  let inJobs = false;
  let currentJob: string | null = null;
  let jobLines: string[] = [];
  let jobIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    if (indent === 0 && trimmed.startsWith('jobs:')) {
      inJobs = true;
      jobIndent = 2;
      continue;
    }

    if (inJobs) {
      // Another top-level key — end of jobs
      if (indent === 0 && trimmed && !trimmed.startsWith('#')) {
        if (currentJob) {
          jobs.push({ name: currentJob, definition: { _yaml: jobLines.join('\n') } });
          currentJob = null;
          jobLines = [];
        }
        inJobs = false;
        continue;
      }

      // A new job key at indent=2
      if (indent === jobIndent && trimmed && !trimmed.startsWith('#')) {
        if (currentJob) {
          jobs.push({ name: currentJob, definition: { _yaml: jobLines.join('\n') } });
          jobLines = [];
        }
        currentJob = trimmed.replace(/:.*/, '').trim();
        continue;
      }

      if (currentJob) {
        jobLines.push(line);
      }
    }
  }

  if (currentJob) {
    jobs.push({ name: currentJob, definition: { _yaml: jobLines.join('\n') } });
  }

  // Default to a single "build" job if none found
  if (jobs.length === 0) {
    jobs.push({ name: 'build', definition: {} });
  }

  return jobs;
}

function branchMatches(branch: string, patterns: string[] | undefined): boolean {
  if (!patterns || patterns.length === 0) return true;
  return patterns.some((pattern) => {
    if (pattern === '*' || pattern === '**') return true;
    if (pattern.endsWith('*')) return branch.startsWith(pattern.slice(0, -1));
    return branch === pattern;
  });
}

export async function triggerWorkflows(options: TriggerOptions): Promise<string[]> {
  const { repoId, branch, commitSha, eventName, eventPayload = {}, triggeredBy, workflowId } = options;

  const runIds: string[] = [];

  try {
    // Query active workflows for this repo
    const query = workflowId
      ? [await db.query.workflows.findFirst({
          where: and(
            eq(workflows.id, workflowId),
            eq(workflows.repositoryId, repoId),
            eq(workflows.active, true)
          ),
        })]
      : await db.query.workflows.findMany({
          where: and(eq(workflows.repositoryId, repoId), eq(workflows.active, true)),
        });

    for (const workflow of query) {
      if (!workflow) continue;

      // Check trigger matching (skip for workflow_dispatch)
      if (eventName !== 'workflow_dispatch') {
        const triggers = workflow.triggers ?? {};
        if (eventName === 'push') {
          if (!triggers.push) continue;
          if (!branchMatches(branch, triggers.push.branches)) continue;
        } else if (eventName === 'pull_request') {
          if (!triggers.pull_request) continue;
          if (!branchMatches(branch, triggers.pull_request.branches)) continue;
        }
      } else {
        const triggers = workflow.triggers ?? {};
        if (!triggers.workflow_dispatch) continue;
      }

      // Create workflow run
      const [run] = await db
        .insert(workflowRuns)
        .values({
          workflowId: workflow.id,
          repositoryId: repoId,
          triggeredBy: triggeredBy ?? null,
          commitSha,
          branch,
          eventName,
          eventPayload,
          status: 'queued',
        })
        .returning({ id: workflowRuns.id });

      runIds.push(run.id);

      // Parse jobs from workflow YAML and create job rows
      const jobs = parseJobsFromYaml(workflow.content);
      for (const job of jobs) {
        await db.insert(workflowJobs).values({
          runId: run.id,
          name: job.name,
          workflowDefinition: {
            ...job.definition,
            workflowContent: workflow.content,
            workflowPath: workflow.path,
          },
          status: 'queued',
        });
      }

      console.log(
        `[Workflows] Triggered workflow "${workflow.name}" (run: ${run.id}) for ${eventName} on ${branch}`
      );
    }
  } catch (err) {
    console.error('[Workflows] triggerWorkflows error:', err);
  }

  return runIds;
}
