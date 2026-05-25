# RSS workflow — switch PAT_TOKEN → GITHUB_TOKEN (2026-05-23)

**Finding ID:** WA-2026-05-23-06
**Severity:** Low
**Type:** Software/Data Integrity Failures (OWASP A08, CWE-321)

## Background
`.github/workflows/rss.yml` runs hourly, fetches/builds the RSS cache
and commits/pushes back to `main`. It used `secrets.PAT_TOKEN`, a
long-lived personal access token, for both checkout and push.

A PAT:
- typically has broader scope than this single workflow needs;
- has no automatic rotation;
- if leaked (e.g. via a malicious npm postinstall in a future
  dependency, log surface, or compromised runner image) allows
  arbitrary writes to every repo it covers.

## Fix
Replace `secrets.PAT_TOKEN` with the workflow's built-in
`secrets.GITHUB_TOKEN`, which is auto-rotated per job and scoped only
to the current repository. The workflow already declares
`permissions: contents: write` at the job level, so `GITHUB_TOKEN`
has the access needed to push the daily commit.

## Verification
- Trigger the workflow via `workflow_dispatch`; the commit on `main`
  should be authored by `github-actions[bot]` and the push should
  succeed.
- The PAT can then be deleted from repo secrets (separate operational
  step).

Owner: @SpikeyCoder · Effort: S · Priority: P2
