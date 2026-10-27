# Elyra Admin: Supabase setup guide

This connects the website to a database and turns on the admin dashboard at **`/admin`**. It takes about 20 minutes, once.

The site keeps working throughout. Until step 4 is done, it runs from the built-in files as before.

---

## 1. Create the Supabase project

1. Go to **https://supabase.com** and sign up (free). Use a business email you will keep.
2. Click **New project**:
   - **Name:** `elyra`
   - **Database password:** generate a strong one and **save it in a password manager**
   - **Region:** **South Asia (Mumbai)**, closest to your customers
   - **Plan:** Free (you can upgrade later)
3. Wait about 2 minutes for the project to be ready.

> **Free plan note:** a free project **pauses after 7 days with no activity**. Website visits and admin logins count as activity. If it does pause, open the Supabase dashboard and click **Restore**. While it's paused, the website falls back to its built-in files, but new leads are not saved. The Pro plan (about $25/month) never pauses.

## 2. Create the tables and security rules

1. Open **`supabase/schema.sql`** in a text editor.
2. Near the bottom, replace **`OWNER_EMAIL_HERE`** with the email the owner will log in with.
3. In Supabase, go to **SQL Editor → New query**, paste the **whole file**, and click **Run**. It should say "Success. No rows returned."
4. Open a new query, paste the whole of **`supabase/seed.sql`**, and click **Run**. This copies in your current products, rates and business settings.

## 3. Configure login emails

In **Authentication → URL Configuration**:

| Setting | Value |
|---|---|
| Site URL | `https://elyrashree.com/admin/` |
| Redirect URLs | `https://elyrashree.com/admin/`, `https://www.elyrashree.com/admin/`, plus `http://localhost:8000/admin/` for local testing |

> Reset and sign-up emails only go to addresses in this list. Anything else falls back to the Site URL, so if the domain changes, update both or the email links break.

In **Authentication → Providers → Email**, keep **Email** enabled and **Confirm email** on.

> Supabase's built-in email sender is rate-limited and meant for testing. Send login emails from your own domain through **Resend** instead (step 6a), then paste the branded templates from `supabase/email-templates/`.

## 4. Connect the website

1. Go to **Project Settings → API**.
2. Copy the **Project URL** and the **`anon` `public`** key. **Never** use the `service_role` key on the website.
3. Paste both into **`assets/js/supabase-config.js`**:

   ```js
   window.ELYRA_SUPABASE = {
     url: "https://xxxxxxxxxxxx.supabase.co",
     anonKey: "eyJhbGciOi..."
   };
   ```

4. Commit and push (or ask Claude to). The live site now saves leads and reads products, rates, settings, reviews and blog posts from the database.

## 5. Create the owner account

1. Open **`<your site>/admin/#/signup`**, e.g. `https://elyra.kynyx.com/admin/#/signup`.
2. Sign up with the **owner email from step 2** and a strong password.
3. Click the confirmation link in your email, then log in at `/admin`.
4. To add staff, go to **Staff → Invite someone**. They sign up at the same `#/signup` link with the invited email.

An email that wasn't invited can create a login but sees "No access yet". The database rules block all data for it.

## 6a. Branded email through Resend

Resend (resend.com, free up to 3,000 emails a month) sends every Elyra email from `elyrashree.com`: login emails from Supabase and new-lead alerts.

1. **Sign up** at resend.com with the business email.
2. **Add the domain:** Domains → **Add domain** → `elyrashree.com`, region **Tokyo (ap-northeast-1)** or the closest to India.
3. **DNS:** Resend lists 3–4 records (an MX and a TXT on `send`, a TXT on `resend._domainkey`). Add each in **Cloudflare → DNS → Add record** exactly as shown, proxy **off** (grey cloud). They sit on sub-names, so they do not touch the existing email-forwarding MX records on `elyrashree.com`.
   Also add a DMARC record: Type `TXT`, Name `_dmarc`, Content `v=DMARC1; p=none; rua=mailto:shreeelyra@gmail.com`.
4. Click **Verify DNS records** in Resend and wait until the domain shows **Verified** (usually minutes).
5. **API key:** API Keys → **Create API key**, permission **Sending access**, domain `elyrashree.com`. Copy it (it is shown once).
6. **Supabase login emails:** Authentication → Emails → **SMTP settings** → enable **Custom SMTP**:

   | Field | Value |
   |---|---|
   | Sender email | `noreply@elyrashree.com` |
   | Sender name | `Elyra by Shree Creations` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | the Resend API key |

   Save, then raise **Authentication → Rate limits → emails per hour** (e.g. to 30); the built-in limit is very low.
7. **Templates:** paste the three files from `supabase/email-templates/` (see its README).
8. **Replies:** Resend can only send from `@elyrashree.com`, never from a Gmail address. Replies reach Gmail through **Cloudflare → Email → Email Routing**: rule `noreply@elyrashree.com` → `shreeelyra@gmail.com` (add more addresses, or a catch-all, the same way). Cloudflare manages the domain's MX and SPF records for this, so don't edit them by hand.

## 6b. Optional: email alerts for new leads

Uses the same Resend account and API key from 6a.

1. **Deploy the function:** Supabase → **Edge Functions → Deploy a new function → Via editor**. Name it **`lead-alert`**, paste **`supabase/functions/lead-alert/index.ts`**, and click **Deploy**.
   - In the function's settings, turn **off** "Verify JWT", because the webhook uses its own secret.
3. **Add secrets** in Edge Functions → **Secrets**:

   | Name | Value |
   |---|---|
   | `RESEND_API_KEY` | your Resend API key |
   | `ALERT_FROM` | `Elyra Leads <leads@elyrashree.com>` |
   | `WEBHOOK_SECRET` | any long random text |
   | `ADMIN_URL` | `https://elyrashree.com/admin/` |

4. **Create the webhook:** go to **Database → Webhooks → Create a new hook**:
   - **Table:** `leads`, **Events:** Insert
   - **Type:** Supabase Edge Functions → `lead-alert`
   - **HTTP header:** `x-webhook-secret` = the same `WEBHOOK_SECRET`
5. In the admin, go to **Rates & settings → New-lead email alerts**, add the email addresses, and save.

## 7. Check everything works

- [ ] Submit the **Contact** form on the website. It appears in **Admin → Leads** within seconds.
- [ ] Send a **bespoke** request with a photo. The photo shows on the lead.
- [ ] Change a product's stock or status. The website reflects it on reload.
- [ ] Change the gold rate in **Rates & settings**. Product prices update on the website.
- [ ] Publish a blog article. It appears on **Blog** and on the home page.
- [ ] Optional: you receive an alert email for a new lead.

---

### What's stored where

| Data | Table / bucket | Who can see it |
|---|---|---|
| Products, published blog posts, published reviews, site settings, rates | `products`, `posts`, `reviews`, `settings` | Everyone (read-only) |
| Leads, customers, orders | `leads`, `customers`, `orders` | Logged-in admins only. Visitors can only **submit** leads. |
| Product and blog images | Storage bucket `media` (public) | Everyone sees them; only admins upload |
| Customer photos (bespoke requests) | Storage bucket `lead-uploads` (private) | Admins only |
| Staff and roles | `profiles`, `staff_invites` | Admins see staff; only owners manage them |

### Privacy

Leads now hold personal data: names, phone numbers and photos. The privacy policy already covers this. Delete leads you no longer need, and remove staff access when someone leaves.
