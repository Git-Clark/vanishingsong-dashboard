# Setting up The Vanishing Song dashboard

This turns the coded site into something live on the internet, password protected, pulling real data from your Google Sheets. Four steps. Do them in order.

## Step 1: Get the code onto GitHub

1. Unzip the file I sent you.
2. Go to github.com, log in, click the "+" in the top right, then "New repository."
3. Name it something like `vanishing-song-dashboard`. Set it to **Private**. Do not check any of the boxes for README, .gitignore, or license, since the code already has those.
4. Click "Create repository." On the next page, look for "…or push an existing repository from the command line." You won't need that exact method. Instead, easier option below.
5. Download GitHub Desktop (desktop.github.com) if you don't have it, and sign in with your GitHub account.
6. In GitHub Desktop: File, Add local repository, then point it at the unzipped `vanishing-song-app` folder.
7. It'll show you the files as "changes." Click "Publish repository" at the top, choose the private repo you made in step 3 (or just publish under that name), and it uploads everything.

Your code is now on GitHub.

## Step 2: Connect your Google Sheets

This lets the site read your three sheets automatically. It takes about 10 minutes, all in your browser.

1. Go to console.cloud.google.com. Create a new project (top left dropdown, "New Project"). Name it something like "Vanishing Song Dashboard."
2. In the search bar, type "Google Sheets API" and click "Enable."
3. In the left menu, go to "APIs & Services," then "Credentials." Click "Create Credentials," then "Service account."
4. Give it any name, click through the defaults, click "Done."
5. Click on the service account you just made. Go to the "Keys" tab. Click "Add Key," then "Create new key," choose JSON, click "Create." A file downloads. **Keep this file private, don't email it or paste it anywhere public.**
6. Open that downloaded JSON file in a text editor. You'll need two values from it in Step 3: `client_email` and `private_key`.
7. Now share your three sheets with that service account, the same way you'd share a sheet with a person. Open each sheet, click "Share," and paste in the `client_email` value (it looks like an email address ending in `.iam.gserviceaccount.com`). Give it Viewer access. Do this for all three: Festival Submission Schedule, Contact list, Social Media Schedule.
8. From each sheet's URL, copy the long ID between `/d/` and `/edit`. You'll need all three IDs in Step 3.

## Step 3: Deploy to Vercel

1. Go to vercel.com, log in, click "Add New," then "Project."
2. Import the GitHub repo you made in Step 1.
3. Before clicking Deploy, open "Environment Variables" and add these one at a time:

| Name | Value |
|---|---|
| `SITE_PASSWORD` | Whatever password you want your bosses to use to log in |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The `client_email` from the JSON file |
| `GOOGLE_PRIVATE_KEY` | The `private_key` from the JSON file, quotes and all |
| `FESTIVALS_SHEET_ID` | The ID from the Festival Submission Schedule sheet |
| `CONTACTS_SHEET_ID` | The ID from the Contact list sheet |
| `SOCIAL_SHEET_ID` | The ID from the Social Media Schedule sheet |

4. Click "Deploy." Vercel builds and gives you a live link when it's done.

## Step 4: Share it

Send the Vercel link and the password (whatever you set as `SITE_PASSWORD`) to your producer and director. That's the whole dashboard, live.

## If something breaks

Send me the exact error message or a screenshot and I'll help you fix it. Common one: if the site loads but shows sample data instead of your real sheets, double check the sheet was shared with the service account email, and that the sheet IDs don't have extra spaces.
