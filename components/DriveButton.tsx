const DRIVE_URL =
  "https://drive.google.com/drive/folders/13QXG5DrB09woMHa_JX0MmI6qCoap7a01";

export default function DriveButton() {
  return (
    <a className="drive-button" href={DRIVE_URL} target="_blank" rel="noopener">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <polygon points="3,5 21,5 12,10.33" fill="#F4C542" />
        <polygon points="3,5 12,21 12,10.33" fill="#34A853" />
        <polygon points="21,5 12,21 12,10.33" fill="#4285F4" />
      </svg>
      Project Drive
    </a>
  );
}
