# Elyra login email templates

Paste these into **Supabase → Authentication → Emails → Templates**. Set up your own email sender (SMTP) first; see `supabase/SETUP.md`.

| Supabase template | Subject | File |
|---|---|---|
| Confirm signup | Confirm your Elyra Admin account | `confirm-signup.html` |
| Reset password | Reset your Elyra Admin password | `reset-password.html` |
| Change email address | Confirm your new email for Elyra Admin | `change-email.html` |

For each one: open the template, replace the **Subject**, switch the body to the source/HTML view, paste the whole file, and click **Save**.

The `{{ .ConfirmationURL }}`, `{{ .Email }}` and `{{ .NewEmail }}` placeholders are filled in by Supabase. Leave them exactly as they are.
