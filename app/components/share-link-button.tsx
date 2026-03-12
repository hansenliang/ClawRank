'use client';

import { useEffect, useState } from 'react';

type ShareLinkButtonProps = {
 path: string;
 label: string;
};

export function ShareLinkButton({ path, label }: ShareLinkButtonProps) {
 const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

 useEffect(() => {
 if (status === 'idle') return;

 const timer = window.setTimeout(() => setStatus('idle'), 1800);
 return () => window.clearTimeout(timer);
 }, [status]);

 async function handleClick() {
 const url = new URL(path, window.location.origin).toString();

 try {
 await navigator.clipboard.writeText(url);
 setStatus('copied');
 } catch (error) {
 console.error('ClawRank: failed to copy share URL', error);
 setStatus('failed');
 }
 }

 return (
 <button type="button" className="action action-button" onClick={handleClick} aria-label={`Copy share link for ${label}`}>
 {status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : 'Share'}
 </button>
 );
}
