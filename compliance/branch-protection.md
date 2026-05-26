---
title: Branch Protection & Code Review Policy
tsc: CC5.1, CC5.2, CC8.1
owner: Kevin Armstrong
review-cadence: annually
---

# Branch Protection Policy — kevinarmstrong.io

## Protected Branch: `main`

| Setting | Value |
|---|---|
| Required status checks | `build` |
| Strict (up-to-date before merge) | Yes |
| Required PR reviews | No (see Compensating Control below) |
| Force pushes | Blocked |
| Branch deletions | Blocked |
| Enforce admins | No |

## Compensating Control — Single-Developer Organization

Armstrong HoldCo LLC is a single-developer organization. Requiring pull request approval reviews is not practical as there is no second reviewer available. The following compensating controls are in place:

1. **Automated CI validation** — every PR must pass the `build` status check before merging.
2. **Branch protection** — force pushes and branch deletions are blocked on `main`.
3. **PR-based workflow** — all changes go through pull requests, creating a full audit trail in GitHub.
4. **Automated daily audits** — security and usability scheduled tasks run daily and flag regressions.

This compensating control is documented per AICPA TSC CC5.2 (activities to mitigate risks) and will be revisited if the team grows beyond a single developer.
