"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { INTL_DRAFT_STORAGE_KEY } from "@/lib/admissions/intl-submission";

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  private resetForm = () => {
    try {
      localStorage.removeItem(INTL_DRAFT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    this.setState({ error: null });
    window.location.reload();
  };

  private tryAgain = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
          <div className="max-w-md rounded-xl border border-[#E5E5E0] bg-white p-8 shadow-sm text-center">
            <p className="text-lg font-semibold text-[#1A1A1A]">
              Something went wrong on this step.
            </p>
            <p className="mt-2 text-sm text-[#6B7280]">
              {this.state.error.message || "An unexpected error occurred."}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={this.tryAgain}
                className="rounded-lg border border-[#E5E5E0] px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#FAFAF8]"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={this.resetForm}
                className="rounded-lg bg-[#2D5A27] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#244a20]"
              >
                Reset form
              </button>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
