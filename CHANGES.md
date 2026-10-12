# What changed, and what you need to do

Three steps on your side. Everything else is done.

## Step 1: upload the code

Unzip and replace your local `vanishing-song-app` folder, then upload to GitHub as usual.

One thing to fix while you are there. Two files keep getting lost every time you upload through the GitHub web page, because macOS hides any file whose name starts with a dot and the uploader skips them. They are `.gitignore` and `.env.example`. Before you drag the folder in, press **Cmd + Shift + period** in Finder. Hidden files appear, you drag everything, and they make it this time. Press it again afterwards to re-hide them.

`.gitignore` is the one that matters. Without it you risk committing the `node_modules` folder, which is hundreds of megabytes.

## Step 2: share the two new spreadsheets

The dashboard reads your sheets through a service account, and it can only see sheets that have been shared with it. The two new ones have not been.

Open each of these, click Share, paste in your service account address, give it Viewer:

- The Vanishing Song Media Contacts
- Event Screenings

The address is the `client_email` value from the JSON key file you downloaded during the original setup. It ends in `.iam.gserviceaccount.com`.

Skip this and both pages will load completely empty, with no error to tell you why.

## Step 3: update two environment variables in Vercel

Settings, then Environment Variables.

**Change** `CONTACTS_SHEET_ID` to:

```
1MoUS-ztIgK09GrL609UViTqcib4b0CzxtCOwd2EOkLo
```

**Add** `SCREENINGS_SHEET_ID`:

```
1XRCN7IM10uGciBURn5rLkEtwJ274fBJ_AJZZEh5DU4Y
```

Then redeploy, from Deployments and the three dots on the latest one.

You can also delete `META_PAGE_ACCESS_TOKEN`, `META_PAGE_ID`, `META_IG_USER_ID` and `BLOB_READ_WRITE_TOKEN` if they are there. Nothing reads them any more.

## What you will see

Everything except Media List is empty in your sheets right now, so most of the dashboard will show empty states explaining what to add where. That is correct, not broken. Media Contacts will show its 113 rows as soon as Step 2 is done.

## What changed in the dashboard

**Screenings**, new page, sitting between Promo Campaign and Festivals. Shows the Upcoming/ Possible tab. Confirmed, Pending and Not Contacted each get their own coloured chip. A button opens the completed screenings in a popup. Confirmed screenings also now appear on the Calendar alongside the festival dates.

**Media Contacts**, rebuilt. The statistics boxes are gone. A Contacted button sits to the right of the heading and opens the Contacted tab in a popup. Top Contacts is a drop-down bar under the heading, with its columns reordered to match Media List and the three Category values stacked in one cell. It groups rows under whatever section labels you put in the sheet, so you can add more sections and it will follow.

Below that, the Media List: search box top right matching every field, a table of fixed height that scrolls inside itself, 25 rows a page. Every column header filters to the values in that column, except Name and Email which sort alphabetically instead. Anyone who also appears on Top Contacts carries a star in their Category cell. Accents and capitals are ignored when matching names, so Renee and Renée are the same person.

**Promo Campaign**. Each platform keeps its Upcoming table. Instagram and Facebook also get a drop-down, closed by default, holding the three most recent completed posts with their link, views, hearts and comments. The other four platforms do not have it.

**Publish** is gone, along with every piece of Meta API code behind it.

**Home** is unchanged in layout. Its Media Outreach panel now pulls the first five real contacts from your Media List rather than sample data.

## If something looks wrong

Tell me what page and what you see. The most likely cause by far is Step 2, since an unshared sheet fails silently by design.
