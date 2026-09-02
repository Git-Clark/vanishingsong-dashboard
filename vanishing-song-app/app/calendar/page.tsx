import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import CalendarList from "@/components/CalendarList";
import { getFestivals, getSocialPosts } from "@/lib/sheets";
import { buildCalendarEntries } from "@/lib/calendar";
import { todayHK } from "@/lib/dates";

export const revalidate = 300; // 5 min ISR — reflects sheet edits without a redeploy

export default async function CalendarPage() {
  const [festivals, posts] = await Promise.all([getFestivals(), getSocialPosts()]);
  const entries = buildCalendarEntries(festivals, posts);
  const today = todayHK();
  const todayIso = today.toISOString().slice(0, 10);

  return (
    <div className="page">
      <Masthead />

      <div className="page-head">
        <div>
          <h2>Calendar</h2>
          <div className="page-caption">
            Master schedule across festival notifications, festival events, and social posts. Toggle
            categories below.
          </div>
        </div>
      </div>

      <CalendarList entries={entries} todayIso={todayIso} />

      <Footer />
    </div>
  );
}
