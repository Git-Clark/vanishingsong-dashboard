import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import PostComposer from "@/components/PostComposer";
import { getConnectionStatus } from "@/lib/meta";

// Always checked live — a token problem should show up on reload, never from
// a cached render. (The other pages use 5-minute ISR; this one must not.)
export const dynamic = "force-dynamic";

export default async function PublishPage() {
  const status = await getConnectionStatus();
  const uploadEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  return (
    <div className="page">
      <Masthead />

      <div className="page-head">
        <div>
          <h2>Publish</h2>
          <div className="page-caption">
            Post to the film&rsquo;s Instagram and Facebook Page from here. Every post goes through a
            preview and an explicit confirm, so nothing is sent on a single click.
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head">
          <div className="panel-title">Account connections</div>
          <div className="panel-note">Checked live on each page load</div>
        </div>
        <div className="panel-caption">
          Both accounts are reached with one long-lived Page Access Token. Instagram publishes
          through the Facebook Page it is linked to.
        </div>

        {!status.configured ? (
          <div className="empty-state">
            <strong>Publishing isn&rsquo;t connected yet</strong>
            Follow <code>SETUP-META.md</code> in the project to create the Meta app, get a long-lived
            Page Access Token, and add <code>META_PAGE_ACCESS_TOKEN</code>, <code>META_PAGE_ID</code>{" "}
            and <code>META_IG_USER_ID</code> in Vercel. The rest of the dashboard works normally in
            the meantime.
          </div>
        ) : (
          <ul className="conn-list">
            <li className="conn-row">
              <span className={`status-chip ${status.instagram.connected ? "good" : "critical"}`}>
                Instagram · {status.instagram.connected ? "Connected" : "Not connected"}
              </span>
              <div className="conn-detail">
                {status.instagram.connected
                  ? status.instagram.username
                    ? `@${status.instagram.username}`
                    : "Linked professional account confirmed"
                  : status.instagram.error}
              </div>
            </li>
            <li className="conn-row">
              <span className={`status-chip ${status.facebook.connected ? "good" : "critical"}`}>
                Facebook · {status.facebook.connected ? "Connected" : "Not connected"}
              </span>
              <div className="conn-detail">
                {status.facebook.connected ? status.facebook.pageName : status.facebook.error}
              </div>
            </li>
          </ul>
        )}

        {status.configured && (!status.instagram.connected || !status.facebook.connected) && (
          <div className="compose-hint" style={{ marginTop: 14 }}>
            A token that has stopped working is the usual cause. <code>SETUP-META.md</code> walks
            through re-issuing it.
          </div>
        )}
      </div>

      <PostComposer
        igConnected={status.instagram.connected}
        fbConnected={status.facebook.connected}
        uploadEnabled={uploadEnabled}
      />

      <Footer />
    </div>
  );
}
