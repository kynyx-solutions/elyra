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
| Site URL | `https://elyra.kynyx.com/admin/` (later `https://elyrashree.com/admin/`) |
| Redirect URLs | add the same address, plus `http://localhost:8080/admin/` for local testing |

In **Authentication → Providers → Email**, keep **Email** enabled and **Confirm email** on.

> Supabase's built-in email sender is rate-limited and meant for testing. Before you invite several staff, add your own SMTP under **Authentication → Emails → SMTP settings**. Resend, Zoho Mail or your domain's email all work.

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

## 6. Optional: email alerts for new leads

This needs a free **Resend** account (resend.com) and, ideally, your own domain (elyrashree.com) verified in Resend.

1. **Resend:** sign up, verify your domain (Domains → Add), and create an **API key**.
2. **Deploy the function:** Supabase → **Edge Functions → Deploy a new function → Via editor**. Name it **`lead-alert`**, paste **`supabase/functions/lead-alert/index.ts`**, and click **Deploy**.
   - In the function's settings, turn **off** "Verify JWT", because the webhook uses its own secret.
3. **Add secrets** in Edge Functions → **Secrets**:

   | Name | Value |
   |---|---|
   | `RESEND_API_KEY` | your Resend API key |
   | `ALERT_FROM` | `Elyra Leads <leads@elyrashree.com>` |
   | `WEBHOOK_SECRET` | any long random text |
   | `ADMIN_URL` | `https://elyra.kynyx.com/admin/` |

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
