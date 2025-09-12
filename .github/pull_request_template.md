# PR Checklist

Please confirm and check all that apply:

- [ ] Code builds and tests pass locally
- [ ] Updated/added tests where appropriate
- [ ] Documentation updated (README/docs) if needed

## Environment variables

If this PR introduces or changes environment variables:

- [ ] Added placeholders and comments in `.env.example`
- [ ] Updated `config/env.required.json` for the right environments (development/preview/production)
- [ ] If secrets are required in Preview/Production, ensure they are set in Vercel (Project → Settings → Environment Variables)
- [ ] Verified CI passes the environment verification step

List variables introduced/changed (server vs public):

- Server: `VAR_A`, `VAR_B`
- Public (`NEXT_PUBLIC_*`): `NEXT_PUBLIC_VAR_X`

Notes for reviewers:

- Any migration steps for ops?
- Any default values or fallbacks added?
