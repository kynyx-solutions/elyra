# Elyra by Shree Creations: Phase 1 website

A fast, mobile-first catalogue website where customers order through WhatsApp. It has no backend, no monthly fees, and runs free on GitHub Pages.

## Page map

| Page | File | Purpose |
|---|---|---|
| Home | `index.html` | Hero, trust strip, categories, featured pieces, why Elyra, how ordering works, bridal, guides, founder note, reviews, CTA |
| Shop | `shop.html` | Full catalogue with filters (category, metal, price, occasion) and sorting; filters are shareable links, e.g. `shop.html?category=rings` |
| Product | `product.html?id=SKU` | One template for every product: photos, GST-inclusive price, natural-diamond disclosure, specifications, certificate, WhatsApp order and video-call buttons, related pieces |
| Bridal | `bridal.html` | Bridal categories, process and timeline, bridal products, planning tips |
| Diamond guide | `learn.html` | What a natural diamond is, natural vs lab-grown, 4Cs, six diamond shapes, reading a GIA/IGI certificate, gold purity and HUID, care, buying checklist |
| About | `about.html` | Story, values, team, business details (legal name, GSTIN, address) |
| Book a consultation | `consultation.html` | Booking form, sent to WhatsApp |
| Contact | `contact.html` | Phone, WhatsApp, email, studio, hours, map, message form |
| FAQ | `faq.html` | 16 common questions |
| Shipping & delivery | `shipping.html` | Policy |
| Returns, refunds & cancellations | `returns.html` | Policy |
| Exchange & buyback | `exchange-buyback.html` | Policy |
| Certification & hallmarking | `certification.html` | Disclosure and quality promise |
| Privacy policy | `privacy.html` | Written with the DPDP Act, 2023 in mind |
| Terms of use & sale | `terms.html` | Policy |
| Grievance redressal | `grievance.html` | Grievance Officer details (required by the Consumer Protection (E-Commerce) Rules, 2020) |
| 404 | `404.html` | Friendly "not found" page |

## Files you edit

| File | What's in it |
|---|---|
| `assets/js/config.js` | **All business details and policy terms**: phone, WhatsApp, address, GSTIN, return days, exchange %, grievance officer, analytics ID. Change them once and every page updates. |
| `assets/js/products.js` | The catalogue. Each product is one block; copy a block to add a piece. |
| `assets/img/products/` | Product photos (create this folder). Name them by SKU, e.g. `ELR-R001-1.jpg`, `ELR-R001-2.jpg`. |
| `assets/css/style.css` | Colours and design (brand colours at the top). |

You don't need to touch `assets/js/main.js`.

## Setup mode

Until everything is filled in, an **orange "Setup mode" banner** shows at the top of each page. It lists what is missing: placeholder contact details, sample products, and highlighted items on that page. Placeholders in the page text are outlined in **dashed orange** (`class="todo"`).

The site is ready to launch when the banner no longer appears on any page. Then set `showSetupBanner: false` in `config.js` as a final safeguard.

## Launch checklist

**Business details (`config.js`)**
- [ ] WhatsApp number, phone, email, studio address, hours
- [ ] Legal name exactly as on the GST certificate, and GSTIN
- [ ] Grievance Officer name, email, phone
- [ ] Return days, dispatch times, advance %, resize window
- [ ] Exchange and buyback % (decide with supplier and accountant, and only promise what you can honour)

**Catalogue (`products.js`)**
- [ ] Delete all `sample: true` entries
- [ ] Add 20–40 real pieces with real specifications and GST-inclusive prices
- [ ] 4–6 photos per piece: on a plain background, on the hand/ear/neck, and a close-up. Square, about 1600 × 1600 px, under 300 KB each (compress at squoosh.app).
- [ ] Mark 4 pieces `featured: true`

**Photos to replace (search for `class="ph"` in the HTML)**
- [ ] Home hero, 6 category tiles, bridal image, founder portrait
- [ ] Team photos on the About page
- [ ] `assets/img/og-image.jpg` (1200 × 630), the image shown when the link is shared on WhatsApp

**Words to write (search for `todo`)**
- [ ] Founder note (home) and our story (about)
- [ ] Team one-liners
- [ ] 3 real customer reviews, with permission. Never invent reviews.
- [ ] FAQ: natural diamonds answer, payment methods
- [ ] Courier partner, warranty months, Kimberley Process wording on invoices
- [ ] Have the privacy policy and terms reviewed by an adviser, then remove the review notes

**Before going live**
- [ ] Test every WhatsApp button on a real phone
- [ ] Check the site on mobile (most visitors come from Instagram)
- [ ] Confirm `elyrashree.com` loads over HTTPS before updating social links

## Publishing on GitHub Pages at elyrashree.com

The site is already configured for **https://elyrashree.com**: `config.js`, `sitemap.xml`, `robots.txt`, the JSON-LD in `index.html` and the `CNAME` file all use it.

1. Open the existing `elyralabgrown.github.io` repository on GitHub.
2. Replace its files with everything in this folder, including `CNAME`: **Add file → Upload files**, then drag the contents in.
3. Commit. The site updates in about a minute.
4. GitHub repository → **Settings → Pages → Custom domain**: enter `elyrashree.com`, save, and tick **Enforce HTTPS** once it is available.
5. At your domain provider (where you bought elyrashree.com), add these DNS records:

   | Type | Name / Host | Value |
   |---|---|---|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | elyralabgrown.github.io |

6. Wait for DNS to update. It usually takes under an hour, but can take up to 24 hours. The old `elyralabgrown.github.io` address then redirects to `elyrashree.com` automatically.

**Then connect your channels to the new address:**
- [ ] Instagram bio link → `https://elyrashree.com`, and update the bio (it still says "Lab Grown Diamond")
- [ ] Facebook page → Website field
- [ ] Google Business Profile → Website (it currently shows "Add website")
- [ ] WhatsApp Business profile → Website
- [ ] Pitch deck closing slide and any printed material
- [ ] Optional: email on the domain, e.g. `hello@elyrashree.com`, then update `email` in `config.js`

## After launch

1. **Google Analytics 4:** create a property, then paste the ID (`G-…`) into `ga4Id`. WhatsApp clicks and form sends are tracked automatically as `whatsapp_click` and `form_submit` events.
2. **Google Search Console:** verify the site and submit `sitemap.xml`.
3. **Google Business Profile:** add the website link and use exactly the same name, "Elyra by Shree Creations".
4. **Instagram and Facebook bios:** link to the website.
5. Keep a simple sheet logging enquiry → consultation → order → revenue → source. These are the numbers for the deck's traction slide.
