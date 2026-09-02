import Nav from "./Nav";
import DriveButton from "./DriveButton";
import { todayHKLabel } from "@/lib/dates";

export default function Masthead({ variant = "inner" }: { variant?: "home" | "inner" }) {
  const todayLabel = todayHKLabel();

  return (
    <header className={`masthead${variant === "home" ? " masthead--home" : ""}`}>
      <div className="masthead-top">
        <div className="masthead-id">
          <div className="eyebrow">
            <span className="dot">●</span> Internal — Not for Distribution
          </div>
          <h1 className="film-title">The Vanishing Song</h1>
          <div className="film-subtitle">Campaign Dashboard · Producer &amp; Director</div>
        </div>
        <div className="masthead-right">
          <DriveButton />
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
