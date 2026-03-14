'use client';

import { useEffect, useState } from 'react';

type SharePayloadButtonProps = {
  payload: string;
  label: string;
};

export function SharePayloadButton({ payload, label }: SharePayloadButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (status === 'idle') return;

    const timer = window.setTimeout(() => setStatus('idle'), 1800);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(payload);
      setStatus('copied');
    } catch (error) {
      console.error('ClawRank: failed to copy share payload', error);
      setStatus('failed');
    }
  }

  return (
    <button
      type="button"
      className="action action-button"
      onClick={handleClick}
      aria-label={`Copy share payload for ${label}`}
      data-status={status}
    >
      {status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : 'Share'}
    </button>
  );
}
