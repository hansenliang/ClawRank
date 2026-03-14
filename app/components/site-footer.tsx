import type { ReactNode } from 'react';

type SiteFooterProps = {
  leftContent?: ReactNode;
};

export function SiteFooter({ leftContent }: SiteFooterProps) {
  return (
    <div className="footer-note footer-note-row">
      <div>{leftContent ?? 'ClawRank by @Hansen Liang. All rights reserved.'}</div>
      <div className="footer-note-links">
        <a href="https://x.com/HansenIsSo" target="_blank" rel="noopener noreferrer" className="muted footer-note-link">X</a>
        <a href="https://github.com/hansenliang" target="_blank" rel="noopener noreferrer" className="muted footer-note-link">GitHub</a>
        <a href="https://www.hansenliang.com" target="_blank" rel="noopener noreferrer" className="muted footer-note-link">Web</a>
      </div>
    </div>
  );
}
