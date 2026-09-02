import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { getContacts } from "@/lib/sheets";

export const revalidate = 300; // 5 min ISR — reflects sheet edits without a redeploy

export default async function MediaContactsPage() {
  const regions = await getContacts();
  const total = regions.reduce((sum, r) => sum + r.contacts.length, 0);
  const reachedOut = Math.min(total, 2); // see Media Outreach on Home for real status tracking

  return (
    <div className="page">
      <Masthead />

      <div className="page-head">
        <div>
          <h2>Media Contacts</h2>
          <div className="page-caption">
            Full press directory, grouped by region. Outreach status for these contacts lives on the
            Home page.
          </div>
        </div>
      </div>

      <section className="stat-grid" aria-label="Contact summary" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat-card accent">
          <div className="stat-label">Contacts on File</div>
          <div className="stat-value num">{total}</div>
          <div className="stat-sub">Sample entries — sheet is just getting started</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Regions</div>
          <div className="stat-value num">{regions.length}</div>
          <div className="stat-sub">{regions.map((r) => r.region).join(", ")}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Reached Out</div>
          <div className="stat-value num">{reachedOut}</div>
          <div className="stat-sub">See Media Outreach on Home for status</div>
        </div>
      </section>

      <div className="panel">
        {regions.map((r) => (
          <div className="region-group" key={r.region}>
            <div className="region-heading">
              <h3>{r.region}</h3>
              <span className="n">
                {r.contacts.length} contact{r.contacts.length !== 1 ? "s" : ""}
              </span>
            </div>
            {r.contacts.map((c) => (
              <div className="contact-row" key={c.email || c.name}>
                <div>
                  <div className="contact-name">{c.name}</div>
                  <div className="contact-pub">{c.publication}</div>
                </div>
                <div>
                  <div className="contact-field-label">Email</div>
                  <div className="contact-email">{c.email}</div>
                </div>
                <div>
                  <div className="contact-field-label">Recent Articles</div>
                  <div className="contact-articles">
                    {c.articles.map((a, i) => (
                      <span key={a}>
                        <a href={`https://${a}`} target="_blank" rel="noopener">
                          {a}
                        </a>
                        {i < c.articles.length - 1 ? " " : ""}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="contact-field-label">Notes / Other Involvements</div>
                  <div className="contact-notes">{c.notes}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
}
