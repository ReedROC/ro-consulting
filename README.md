# ROC Consulting — Site Deployment Guide


## Directory structure

```
roc-site/
├── index.html        ← main site
├── worker.js         ← contact form backend (Cloudflare Worker)
├── schema.sql        ← D1 database schema
├── wrangler.toml     ← Worker configuration
├── README.md         ← this file
└── images/
    ├── lobster-farms-vietnam.jpg
    ├── fish-farm-kivu.jpg
    ├── field-mission-cdi.jpg
    ├── drone-survey-cdi.jpg
    ├── government-presentation-abidjan.jpg
    ├── fish-farm-aboisso.jpg
    ├── seaweed-farm-vietnam.jpg
    ├── lake-kivu-farm.jpg
    ├── seaweed-harvest-vietnam.jpg
    └── snail-survey-bandama.jpg
```

---

## Step 1 — Download your images from WordPress

Each image below maps from its current WordPress URL to its local filename.
Download each one and save it into the `images/` folder with the exact filename shown.

| Save as | WordPress source URL |
|---|---|
| `lobster-farms-vietnam.jpg` | https://ro-consulting.uk/wp-content/uploads/2025/10/20240926_103118.jpg |
| `fish-farm-kivu.jpg` | https://ro-consulting.uk/wp-content/uploads/2025/10/20240419_092922.jpg |
| `field-mission-cdi.jpg` | https://ro-consulting.uk/wp-content/uploads/2025/10/pxl_20220302_115852271.jpg |
| `drone-survey-cdi.jpg` | https://ro-consulting.uk/wp-content/uploads/2025/10/pxl_20220301_155545470.jpg |
| `government-presentation-abidjan.jpg` | https://ro-consulting.uk/wp-content/uploads/2025/10/img-20220303-wa0012.jpg |
| `fish-farm-aboisso.jpg` | https://ro-consulting.uk/wp-content/uploads/2025/10/pxl_20220311_073515007.jpg |
| `seaweed-farm-vietnam.jpg` | https://ro-consulting.uk/wp-content/uploads/2025/10/20240926_111756.jpg |
| `lake-kivu-farm.jpg` | https://ro-consulting.uk/wp-content/uploads/2025/10/timephoto_20240419_101307.jpg |
| `seaweed-harvest-vietnam.jpg` | https://ro-consulting.uk/wp-content/uploads/2025/10/20240926_112205.jpg |
| `snail-survey-bandama.jpg` | https://ro-consulting.uk/wp-content/uploads/2025/10/img_0823.jpg |

---

## Step 2 — Deploy the static site to Cloudflare Pages

1. Log in to https://dash.cloudflare.com
2. Go to **Workers & Pages → Create → Pages → Upload assets**
3. Name the project `roc-site`
4. Upload the entire `roc-site/` folder (index.html + images/ folder)
5. Click **Deploy site**
6. Test the preview URL (e.g. `roc-site.pages.dev`) before pointing your domain

---

## Step 3 — Create the D1 database

1. In Cloudflare dashboard → **Workers & Pages → D1 → Create database**
2. Name it: `roc-contacts`
3. Once created, click into it → **Console** tab
4. Paste in the contents of `schema.sql` and click **Execute**
5. Copy the **Database ID** shown on the database overview page
6. Paste it into `wrangler.toml` replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`

---

## Step 4 — Deploy the Worker

This requires Node.js installed on your computer.

```bash
# Install Wrangler (Cloudflare's CLI) if you haven't already
npm install -g wrangler

# Log in to your Cloudflare account
wrangler login

# From inside the roc-site/ folder:
wrangler deploy
```

The Worker handles all POST requests to `roconsulting.uk/api/contact`.
Everything else (the HTML and images) is served by Pages.

---

## Step 5 — Connect your domain

1. In your Pages project → **Custom Domains → Set up a custom domain**
2. Enter `roconsulting.uk`
3. If your domain DNS is already in Cloudflare, the CNAME is added automatically
4. If not, update your domain registrar's nameservers to Cloudflare's
   (shown under **Websites → roconsulting.uk → DNS → Nameservers** in Cloudflare)

---

## Viewing contact form submissions

All enquiries are stored in your D1 database. To view them:

- Cloudflare dashboard → **D1 → roc-contacts → Console**
- Run: `SELECT * FROM enquiries ORDER BY submitted_at DESC;`

You will also receive an email notification at ozretich.roc@gmail.com for each submission (via MailChannels, which is free with Cloudflare Workers).

---

## Updating the site later

To update content, edit `index.html` locally, then:

1. Cloudflare Pages dashboard → your project → **Deployments → Upload assets**
2. Re-upload the updated files

Or connect your Pages project to a GitHub repo for automatic deploys on push.
