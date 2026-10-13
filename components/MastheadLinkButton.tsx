/**
 * The white pill link that sits in the top right of the masthead.
 *
 * Shared by Project Drive and Calendar so the two buttons are identical
 * apart from their icon, label and destination. Both open in a new tab.
 */
export default function MastheadLinkButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  /** A small inline SVG, 18 by 18, already marked aria-hidden. */
  icon: React.ReactNode;
}) {
  return (
    <a
      className="masthead-button"
      href={href}
      target="_blank"
      rel="noopener"
      // On a phone the pill shrinks to an icon in a circle and the label is
      // visually hidden, so the title and aria-label carry it instead.
      title={label}
      aria-label={label}
    >
      {icon}
      <span className="masthead-button-label">{label}</span>
    </a>
  );
}
