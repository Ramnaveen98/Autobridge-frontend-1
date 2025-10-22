import { Component, ReactNode } from "react";

type State = { hasError: boolean };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: any) { console.error("Render error:", err); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-sm bg-red-500/10 border border-red-500/40 rounded">
          Something went wrong while rendering this page.
        </div>
      );
    }
    return this.props.children;
  }
}
