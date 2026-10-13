import MastheadLinkButton from "./MastheadLinkButton";

// The shared Google Calendar the producer and director both subscribe to.
const CALENDAR_URL =
  "https://calendar.google.com/calendar/u/0/r?cid=NzBiNjVmMjgyZGE2MDc0MTIwMmUyZGQwZmFhMTNjNzYxYmNkZTMzYjlkYWE2MmI3YzExNjZjMjE4MWRmMDNhOEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&es=3&pli=1";

export default function CalendarButton() {
  return (
    <MastheadLinkButton
      href={CALENDAR_URL}
      label="Calendar"
      icon={
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.8" />
          <line x1="8" y1="3" x2="8" y2="6.5" stroke="currentColor" strokeWidth="1.8" />
          <line x1="16" y1="3" x2="16" y2="6.5" stroke="currentColor" strokeWidth="1.8" />
          <rect x="7" y="13" width="3.6" height="3.2" rx="0.8" fill="currentColor" />
        </svg>
      }
    />
  );
}
