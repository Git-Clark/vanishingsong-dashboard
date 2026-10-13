import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import FestivalsTable from "@/components/FestivalsTable";
import { getFestivals } from "@/lib/sheets";

export const revalidate = 300; // 5 min ISR, reflects sheet edits without a redeploy

export default async function FestivalsPage() {
  const festivals = await getFestivals();
  const total = festivals.length;
  const counts = { Pending: 0, "Not accepted": 0, Accepted: 0 } as Record<string, number>;
  for (const f of festivals) counts[f.status] = (counts[f.status] ?? 0) + 1;

  return (
    <div className="page">
      <Masthead />

      <div className="page-head">
        <div>
          <h2>Festivals</h2>
          <div className="page-caption">
            Submission matrix across every festival we&rsquo;ve entered, with notification dates, event
            dates, and current status.
          </div>
        </div>
      </div>

      <section className="stat-grid" aria-label="Festival summary">
        <div className="stat-card accent">
          <div className="stat-label">Total Tracked</div>
          <div className="stat-value num">{total}</div>
          <div className="stat-sub">Full submission schedule</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value num">{counts.Pending}</div>
          <div className="stat-sub">Awaiting notification</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Accepted</div>
          <div className="stat-value num">{counts.Accepted}</div>
          <div className="stat-sub">Confirmed screenings</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Not Accepted</div>
          <div className="stat-value num">{counts["Not accepted"]}</div>
          <div className="stat-sub">Decisions received so far</div>
        </div>
      </section>

      <FestivalsTable festivals={festivals} />

      <Footer />
    </div>
  );
}
