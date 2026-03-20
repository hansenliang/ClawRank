/**
 * Recreated WindowChrome for Remotion.
 * Same CSS classes as app/components/chrome.tsx.
 */
import React from 'react';

export function WindowChrome({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="window">
      <div className="window-bar">
        <div className="window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="window-title">{title}</div>
      </div>
      {children}
    </div>
  );
}
