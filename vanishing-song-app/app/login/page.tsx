export default function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const hasError = searchParams?.error === "1";

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-eyebrow">
          <span className="dot">●</span> Internal — Not for Distribution
        </div>
        <div className="login-title">The Vanishing Song</div>
        <div className="login-subtitle">Campaign Dashboard · Producer &amp; Director</div>

        <form action="/api/login" method="POST">
          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoFocus required autoComplete="current-password" />
          </div>
          <button className="login-submit" type="submit">
            Enter
          </button>
        </form>

        {hasError && <div className="login-error">Incorrect password. Try again.</div>}

        <div className="login-footnote">Access is restricted to the production team.</div>
      </div>
    </div>
  );
}
