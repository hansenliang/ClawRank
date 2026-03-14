'use client';

import { useEffect, useState } from 'react';

type PromptCopyButtonProps = {
  text: string;
  className?: string;
};

export function PromptCopyButton({ text, className = 'action action-button inline-code-copy-button' }: PromptCopyButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (status === 'idle') return;
    const timer = window.setTimeout(() => setStatus('idle'), 1800);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch (error) {
      console.error('ClawRank: failed to copy prompt', error);
      setStatus('failed');
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleCopy}
      aria-label="Copy OpenClaw prompt"
      data-status={status}
    >
      {status === 'copied' ? 'copied' : status === 'failed' ? 'retry copy' : 'copy prompt'}
    </button>
  );
}
