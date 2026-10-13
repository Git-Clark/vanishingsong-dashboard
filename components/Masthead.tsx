import Nav from "./Nav";
import DriveButton from "./DriveButton";
import CalendarButton from "./CalendarButton";
import { todayHKLabel } from "@/lib/dates";

export default function Masthead({ variant = "inner" }: { variant?: "home" | "inner" }) {
  const todayLabel = todayHKLabel();

  return (
    <header className={`masthead${variant === "home" ? " masthead--home" : ""}`}>
      <div className="masthead-top">
        <div className="masthead-id">
          <h1 className="film-title">The Vanishing Song</h1>
          <div className="film-subtitle">Campaign Dashboard</div>
        </div>
        <div className="masthead-right">
          <div className="masthead-links">
            <DriveButton />
            <CalendarButton />
          </div>
          <div className="masthead-meta">
            <div className="today">{todayLabel}</div>
            <div>Hong Kong time</div>
          </div>
        </div>
      </div>
      <Nav />
    </header>
  );
}
