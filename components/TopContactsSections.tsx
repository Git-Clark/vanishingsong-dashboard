import type { TopContactSection } from "@/lib/sheets";

/**
 * The Top Contacts tab, inside a bar that is collapsed until it is clicked.
 *
 * Columns are reordered to match the Media List table, so the two sections
 * read the same way down the page. Team Member Involved is not shown as its
 * own column here. The three Category values stack in the first cell.
 */
export default function TopContactsSections({ sections }: { sections: TopContactSection[] }) {
  const total = sections.reduce((sum, s) => sum + s.contacts.length, 0);

  return (
    <details className="collapse-panel">
      <summary className="collapse-bar">
        <span className="collapse-label">Top Contacts</span>
        <span className="collapse-note">
          {total === 0
            ? "Nothing on this tab yet"
            : `${total} contact${total === 1 ? "" : "s"} across ${sections.length} section${
                sections.length === 1 ? "" : "s"
              }`}
        </span>
      </summary>

      <div className="collapse-body">
        {sections.length === 0 ? (
          <div className="empty-state">
            <strong>No top contacts to show yet</strong>
            This section reads the <code>Top Contacts</code> tab of the Media Contacts spreadsheet,
            including its own section headings. Once that spreadsheet is shared with the
            dashboard&rsquo;s service account, the contacts will appear here grouped exactly as they
            are grouped on the tab.
          </div>
        ) : (
          sections.map((section) => (
            <div className="region-group" key={section.title}>
              <div className="region-heading">
                <h3>{section.title}</h3>
                <span className="n">
                  {section.contacts.length} contact{section.contacts.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="table-wrap">
                <table className="full-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Publication</th>
                      <th>Email</th>
                      <th>Social or Contact Page</th>
                      <th>Region</th>
                      <th>Content Type</th>
                      <th>Recent Relevant Work</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.contacts.map((c, i) => (
                      <tr key={`${c.email || c.name}-${i}`}>
                        <td>
                          <div className="cat-stack">
                            {c.categories.length === 0 && <span className="cat-line">-</span>}
                            {c.categories.map((cat) => (
                              <span className="cat-line" key={cat}>
                                {cat}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="cell-strong">{c.name || "-"}</td>
                        <td className="cell-secondary">{c.role || "-"}</td>
                        <td className="cell-secondary">{c.publication || "-"}</td>
                        <td className="cell-secondary wrap-cell">{c.email || "-"}</td>
                        <td className="cell-secondary wrap-cell">{c.socialOrContactPage || "-"}</td>
                        <td className="cell-secondary">{c.region || "-"}</td>
                        <td className="cell-secondary">{c.contentType || "-"}</td>
                        <td className="cell-secondary wrap-cell">{c.recentWork || "-"}</td>
                        <td className="cell-secondary wrap-cell">{c.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </details>
  );
}
