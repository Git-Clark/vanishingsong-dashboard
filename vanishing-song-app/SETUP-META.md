# Turning on the Publish page (Instagram + Facebook)

The Publish page posts to the film's own Instagram and Facebook Page. Because you
own and manage both accounts, you do not need Meta's app review. Development mode
with Standard Access is enough.

Do these steps in order. Everything happens in a browser.

## Before you start

You need all three of these to be true:

1. The Instagram account is a **Professional** account (Business or Creator). In the
   Instagram app: Settings, Account type and tools, Switch to professional account.
2. The Instagram account is **linked to the Facebook Page**. In Meta Business Suite
   (business.facebook.com), open the Page's settings and link the Instagram account.
3. You are an **admin** of the Facebook Page.

## Step 1: Create a Meta app

1. Go to developers.facebook.com, log in with the account that administers the Page.
2. My Apps, then Create App. Pick **Business** as the type. Name it something like
   "Vanishing Song Dashboard."
3. On the app dashboard, add the **Instagram** product and the **Facebook Login**
   product. You do not need to configure either beyond adding them.
4. Leave the app in Development mode. Do not submit it for review.

## Step 2: Get a long-lived Page Access Token

1. Go to developers.facebook.com/tools/explorer (the Graph API Explorer).
2. Top right, choose your app from the dropdown.
3. Click "Generate Access Token" and approve these permissions:
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`,
   `instagram_basic`, `instagram_content_publish`, `business_management`.
4. That gives you a **User** token, which expires in a couple of hours. You need a
   **Page** token instead. In the Explorer, run this request:
   `me/accounts?fields=name,id,access_token`
   The `access_token` in the result for your Page is a Page Access Token.
5. Page Access Tokens generated from a long-lived user token do not expire. To be
   sure yours is long-lived, paste it into developers.facebook.com/tools/debug/accesstoken
   and check that Expires says **Never**. If it shows a date, exchange your user token
   for a long-lived one first (Access Token Tool, "Extend Access Token"), then redo
   step 4.

**Keep this token private.** It can post as the Page. Do not paste it into email or chat.

## Step 3: Find the two IDs

In the Graph API Explorer, with the Page token selected:

- **Page ID**: run `me?fields=id,name`. The `id` is your `META_PAGE_ID`.
- **Instagram User ID**: run `{page-id}?fields=instagram_business_account{id,username}`
  (paste your real page id). The `id` inside `instagram_business_account` is your
  `META_IG_USER_ID`. Check the `username` is the film's account.

## Step 4: Add them in Vercel

Vercel, your project, Settings, Environment Variables. Add:

| Name | Value |
|---|---|
| `META_PAGE_ACCESS_TOKEN` | The Page token from Step 2 |
| `META_PAGE_ID` | The Page ID from Step 3 |
| `META_IG_USER_ID` | The Instagram User ID from Step 3 |

Leave `META_GRAPH_VERSION` unset unless you have a reason to pin a version.

Then redeploy (Deployments, the three dots on the latest one, Redeploy). Open the
Publish page: the connection panel at the top should show Instagram and Facebook as
Connected, with the Page name and the Instagram @handle.

## Step 5 (optional): File uploads

Instagram's API never accepts a file directly, only a public web address for the
image. The Publish page always works by pasting a public image URL. If you would
rather pick a file from your laptop, create a Blob store: Vercel, your project,
Storage, Create, Blob. Vercel then sets `BLOB_READ_WRITE_TOKEN` for you. Redeploy and
the file picker on the Publish page turns on.

## What the Publish page will and won't do

- Instagram image posts and Reels, and Facebook Page posts (photo, text, or text plus
  a link).
- Every post shows a full preview and needs an explicit "Yes, publish now" click.
- Images should be **JPEG**. Instagram rejects some PNGs and most other formats.
- Posting to both at once reports each one separately. If one succeeds and one fails,
  only retry the one that failed, otherwise you will double-post.
- Not supported: Instagram carousels, Stories, scheduling for later, editing or
  deleting a post after it goes out. Do those in the apps.

## If something breaks

The red error text on the page is Meta's own message, which is usually specific.
The two most common ones:

- *Invalid OAuth access token*. The token was regenerated or revoked. Redo Step 2.
- *The image is not a valid JPEG* or a media download failure. The image URL is not
  publicly reachable, or isn't a JPEG. Open the URL in a private browser window to
  check that it loads without logging in.
