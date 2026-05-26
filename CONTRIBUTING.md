# Contributing

Thanks for taking the time to contribute. This repository powers
[kevinarmstrong.io](https://kevinarmstrong.io). It is a static site served
through Cloudflare Pages with a small Cloudflare Worker (`_worker.js`) and a
handful of Supabase edge functions backing the booking and blog features.

## Ground rules

- All changes land on `main` through a pull request. Direct pushes to `main`
  are disabled by branch protection.
- Every PR must (a) pass the GitHub Actions checks, (b) include a short
  description of what changed and why, and (c) be reviewed by the project
  maintainer (currently @SpikeyCoder).
- Security-sensitive changes (auth, headers, CSP, RLS, secrets handling,
  edge functions) must reference the relevant finding ID from
  `compliance/` and update the corresponding compliance doc in the same PR.

## Branch naming

| Prefix       | Use for                                  |
|--------------|------------------------------------------|
| `feature/`   | new functionality                        |
| `fix/`       | non-security bug fixes                   |
| `security/`  | security fixes / hardening               |
| `compliance/`| SOC 2 / policy docs                      |
| `chore/`     | dependency bumps, formatting             |

## Reporting a vulnerability

Use the private channel described in [SECURITY.md](./SECURITY.md). Do not file
a public issue for security-sensitive findings.

## Local development

```bash
# Static site
python3 -m http.server 8080

# Supabase edge functions (Deno)
cd supabase && supabase functions serve
```

## Code review checklist

- [ ] Tests added or updated where applicable.
- [ ] No secrets, API keys, or `.env` content committed (see `.gitignore`).
- [ ] CSP / security headers unchanged unless intentional; updated
      `_worker_csp_hashes.js` if inline-script hashes need to change.
- [ ] Migration files are idempotent and version-controlled.
- [ ] If user-facing copy changed, the privacy/terms pages still apply.
