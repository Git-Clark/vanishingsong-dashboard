import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import TopContactsSections from "@/components/TopContactsSections";
import MediaListTable from "@/components/MediaListTable";
import TableModalButton from "@/components/TableModalButton";
import { getMediaList, getTopContacts, getContacted } from "@/lib/sheets";

export const revalidate = 300; // 5 min ISR, reflects sheet edits without a redeploy

// Columns of the Contacted tab, in the order the sheet has them. Nothing is
// remapped, the modal shows that tab as it comes.
const CONTACTED_COLUMNS = [
  "Region",
  "Publication",
  "Content Type",
  "Name",
  "Email",
  "Recent Articles",
  "Notes / Other Involvements",
];

export default async function MediaContactsPage() {
  const [mediaList, topSections, contacted] = await Promise.all([
    getMediaList(),
    getTopContacts(),
    getContacted(),
  ]);

  const contactedRows = contacted.map((c) => [
    c.region,
    c.publication,
    c.contentType,
    c.name,
    c.email,
    c.recentArticles,
    c.notes,
  ]);

  const topContactNames = topSections.flatMap((s) => s.contacts.map((c) => c.name));

  return (
    <div className="page">
      <Masthead />

      <div className="page-head">
        <div>
          <h2>Media Contacts</h2>
          <div className="page-caption">
            The press directory, read live from the Media Contacts spreadsheet. Top Contacts first,
            then the full Media List with search and per-column filters.
          </div>
        </div>
        <TableModalButton
          label="Contacted"
          title="Contacted"
          caption="Everyone we have already reached out to, straight from the Contacted tab."
          columns={CONTACTED_COLUMNS}
          rows={contactedRows}
          emptyTitle="No outreach logged yet"
          emptyHint="The Contacted tab has its headers in place but no rows. Anyone added there will show up in this window."
        />
      </div>

      <TopContactsSections sections={topSections} />

      <MediaListTable contacts={mediaList} topContactNames={topContactNames} />

      <Footer />
    </div>
  );
}
