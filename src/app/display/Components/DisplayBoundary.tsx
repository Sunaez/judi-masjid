'use client';

import React from 'react';

/** Contains a failed panel while allowing clocks and other panels to continue. */
export default class DisplayBoundary extends React.Component<
  { children: React.ReactNode }, { failed: boolean }
> {
  state = { failed: false };
  private timer?: ReturnType<typeof setTimeout>;
  private retryDelay = 30_000;
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) {
    console.error('[Display] Panel failed; scheduling recovery:', error);
    this.timer = setTimeout(() => this.setState({ failed: false }), this.retryDelay);
    this.retryDelay = Math.min(this.retryDelay * 2, 5 * 60_000);
  }
  componentWillUnmount() { clearTimeout(this.timer); }
  render() {
    return this.state.failed ? <div role="status" className="flex h-full items-center justify-center text-2xl">
      This panel is temporarily unavailable. Retrying…
    </div> : this.props.children;
  }
}
