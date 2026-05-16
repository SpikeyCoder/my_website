---
title: Branch Protection — Documented Control State
tsc: CC5.1, CC5.2, CC8.1
owner: Kevin Armstrong
review-cadence: quarterly
last-reviewed: 2026-05-16
applies-to: kevinarmstrong.io (SpikeyCoder/my_website)
---

# Branch Protection — kevinarmstrong.io (SpikeyCoder/my_website)

This document captures the *intended* GitHub branch-protection control set
for the `main` branch of the repository, the *as-found* state observed on
2026-05-16, and the remediation steps required to reach the intended state.

It exists so an auditor can map AICPA TSC **CC5.1 / CC5.2** (control
activities are selected and developed) and **CC8.1** (change-management
authorisation and review) to a single concrete artefact rather than to a
prose paragraph in `SECURITY.md`.

The repo is a single-owner property (`@SpikeyCoder` is the only push
identity). The control posture below is calibrated to that reality: it
prevents accidental force-pushes / deletions and requires PR review of
changes (review is performed by Kevin Armstrong reading the diff in the
PR UI, sometimes after an automated review by Claude / Codex / a CI bot),
but it does NOT pretend a multi-developer separation-of-duties exists.

## Intended control state for `main`

| Control | Setting | Justification (TSC) |
|---|---|---|
| Require pull-request review before merging | **On**, minimum **1** approving review | CC5.1, CC8.1 |
| Dismiss stale reviews on new commits | **On** | CC8.1 |
| Require status checks to pass before merging | **On** (no checks listed today; placeholder for a future `pr-validation.yml`) | CC8.1 |
| Require branches to be up to date before merging | **On** | CC8.1 |
| Require conversation resolution before merging | **On** | CC5.2 |
| Require linear history | **On** (merge commits OFF; squash-merge or rebase only) | CC8.1 |
| Allow force-pushes | **Off** | CC8.1, CC6.1 |
| Allow deletions | **Off** | CC6.1 |
| Require signed commits | **Off** (single-owner repo; SSH-key push identity is the integrity signal) | n/a |
| Restrict who can push | **Off** (no extra collaborators) | n/a |
| Enforce for administrators | **On** (the owner is the only admin; this is the binding constraint) | CC5.1 |

## As-found state on 2026-05-16

`GET /repos/SpikeyCoder/my_website/branches/main/protection` returns
`404 Branch not protected`. No branch-protection rule is currently
configured against `main`.

```
$ curl -s -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    https://api.github.com/repos/SpikeyCoder/my_website/branches/main/protection
{
  "message": "Branch not protected",
  "documentation_url": "..."
}
```

PR-based change management is in place by *convention* — every change
since 2026-05-04 has landed via a numbered PR and not a direct push —
but there is no GitHub-enforced control preventing a future direct push
to `main`.

## Remediation steps

The owner applies the intended state via the GitHub web UI under
**Settings → Branches → Add branch protection rule** for `main`, with the
boxes checked as listed in the table above. The equivalent API call is:

```bash
curl -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/SpikeyCoder/my_website/branches/main/protection \
  -d @- <<'JSON'
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
```

## Verification

After the rule is applied, the same `GET` call returns a populated
protection object whose fields match the table above. A test branch
push followed by an attempted direct `git push origin main` from a
non-PR commit must be rejected with `protected branch hook declined`.

## References

- AICPA TSC 2017 (with 2022 points of focus): CC5.1, CC5.2, CC6.1, CC8.1
- GitHub Docs: Branch protection rules — <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches>
- ISO/IEC 27001 Annex A 8.32 (Change management)
