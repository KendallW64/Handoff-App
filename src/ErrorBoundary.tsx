import { Component, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main
          className="card"
          style={{ maxWidth: 600, margin: "12vh auto" }}
          role="alert"
        >
          <h1>Handoff couldn’t open this screen.</h1>
          <p>
            Please try a private browser window. If it still fails, share the
            exact page address, browser name, and the first red error in the
            developer console.
          </p>
          <button className="btn" onClick={() => window.location.reload()}>
            Reload Handoff
          </button>
        </main>
      );
    return this.props.children;
  }
}
