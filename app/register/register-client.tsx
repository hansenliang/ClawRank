'use client';

import { useEffect, useState, useCallback } from 'react';

interface LinkedAccount {
  provider: string;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  verified: boolean;
}

interface AgentInfo {
  id: string;
  slug: string;
  agentName: string;
  state: string;
}

interface TokenInfo {
  id: string;
  label: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

interface UserSession {
  authenticated: boolean;
  user?: { id: string; displayName: string | null; avatarUrl: string | null };
  linkedAccounts?: LinkedAccount[];
  agents?: AgentInfo[];
}

export function RegisterClient() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [tokenLabel, setTokenLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setSession(data);
      if (data.authenticated) {
        const tokRes = await fetch('/api/tokens');
        const tokData = await tokRes.json();
        setTokens(tokData.tokens || []);
      }
    } catch {
      setSession({ authenticated: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for error params
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) {
      setError(`Authentication failed: ${err}`);
      window.history.replaceState({}, '', '/register');
    }
    fetchSession();
  }, [fetchSession]);

  const createToken = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: tokenLabel || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create token');
        return;
      }
      const data = await res.json();
      setNewToken(data.token);
      setTokenLabel('');
      // Refresh token list
      const tokRes = await fetch('/api/tokens');
      const tokData = await tokRes.json();
      setTokens(tokData.tokens || []);
    } catch {
      setError('Failed to create token');
    } finally {
      setCreating(false);
    }
  };

  const revokeToken = async (id: string) => {
    try {
      await fetch(`/api/tokens/${id}`, { method: 'DELETE' });
      setTokens(tokens.filter(t => t.id !== id));
    } catch {
      setError('Failed to revoke token');
    }
  };

  const copyToken = async () => {
    if (!newToken) return;
    try {
      await navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession({ authenticated: false });
    setTokens([]);
    setNewToken(null);
  };

  if (loading) {
    return (
      <main className="shell" style={{ paddingTop: 48 }}>
        <div style={{ color: 'var(--text-3)' }}>▸ Loading...</div>
      </main>
    );
  }

  return (
    <main className="shell" style={{ paddingTop: 48 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 8,
        }}>
          ▸ Register
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>
          Sign in to get your API token for the ClawRank ingestion skill.
        </p>
      </div>

      {error && (
        <div style={{
          padding: '8px 12px',
          border: '1px solid var(--red)',
          color: 'var(--red)',
          fontSize: 13,
          marginBottom: 24,
        }}>
          {error}
        </div>
      )}

      {!session?.authenticated ? (
        /* ── Not authenticated ── */
        <section>
          <div style={{
            border: '1px solid var(--border)',
            padding: '24px',
          }}>
            <div style={{
              fontSize: 12,
              color: 'var(--text-4)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 16,
            }}>
              sign in with
            </div>
            <a
              href="/api/auth/github"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                border: '1px solid var(--border-accent)',
                color: 'var(--accent)',
                fontSize: 13,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              [github]
            </a>
            <div style={{
              fontSize: 12,
              color: 'var(--text-4)',
              marginTop: 16,
            }}>
              More providers coming soon.
            </div>
          </div>
        </section>
      ) : (
        /* ── Authenticated ── */
        <div>
          {/* User info */}
          <section style={{
            border: '1px solid var(--border)',
            padding: '16px 24px',
            marginBottom: 24,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {session.user?.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.avatarUrl}
                    alt=""
                    width={28}
                    height={28}
                    style={{ borderRadius: '50%', opacity: 0.9 }}
                  />
                )}
                <div>
                  <div style={{ fontSize: 14, color: 'var(--text)' }}>
                    {session.user?.displayName || 'User'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-4)' }}>
                    {session.linkedAccounts?.map(la =>
                      `${la.provider}: @${la.handle}`
                    ).join(' | ')}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  color: 'var(--text-3)',
                  padding: '4px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                [logout]
              </button>
            </div>
          </section>

          {/* Agents */}
          {session.agents && session.agents.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 12,
                color: 'var(--text-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}>
                ▸ your agents
              </div>
              <div style={{ border: '1px solid var(--border)' }}>
                {session.agents.map(a => (
                  <div key={a.id} style={{
                    padding: '10px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 13,
                  }}>
                    <span style={{ color: 'var(--text)' }}>{a.agentName}</span>
                    <span style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: a.state === 'live' ? 'var(--green)' : a.state === 'verified' ? 'var(--blue)' : 'var(--text-4)',
                    }}>
                      {a.state}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* New token alert */}
          {newToken && (
            <section style={{
              border: '1px solid var(--accent)',
              padding: '16px 24px',
              marginBottom: 24,
            }}>
              <div style={{
                fontSize: 12,
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 12,
              }}>
                ▸ your new api token
              </div>
              <div style={{
                fontSize: 11,
                color: 'var(--text-3)',
                marginBottom: 12,
              }}>
                Copy this token now — it won&apos;t be shown again.
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <code style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--accent)',
                  fontSize: 12,
                  wordBreak: 'break-all',
                  fontFamily: 'inherit',
                }}>
                  {newToken}
                </code>
                <button
                  onClick={copyToken}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-accent)',
                    color: copied ? 'var(--green)' : 'var(--accent)',
                    padding: '8px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {copied ? '✓ copied' : '[copy]'}
                </button>
              </div>
              <div style={{
                fontSize: 11,
                color: 'var(--text-4)',
                marginTop: 12,
                lineHeight: 1.6,
              }}>
                Add to your <code style={{ color: 'var(--text-3)' }}>~/.openclaw/openclaw.json</code>:
                <pre style={{
                  marginTop: 8,
                  padding: '12px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  fontSize: 11,
                  overflow: 'auto',
                  color: 'var(--text-2)',
                }}>
{`{
  "skills": {
    "entries": {
      "clawrank": {
        "enabled": true,
        "env": {
          "CLAWRANK_API_TOKEN": "${newToken}"
        }
      }
    }
  }
}`}
                </pre>
              </div>
            </section>
          )}

          {/* Create token */}
          <section style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 12,
              color: 'var(--text-4)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 12,
            }}>
              ▸ create api token
            </div>
            <div style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}>
              <input
                type="text"
                placeholder="label (optional, e.g. my-macbook)"
                value={tokenLabel}
                onChange={e => setTokenLabel(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <button
                onClick={createToken}
                disabled={creating}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-accent)',
                  color: creating ? 'var(--text-4)' : 'var(--accent)',
                  padding: '8px 16px',
                  fontSize: 13,
                  cursor: creating ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {creating ? 'creating...' : '[generate]'}
              </button>
            </div>
          </section>

          {/* Existing tokens */}
          {tokens.length > 0 && (
            <section>
              <div style={{
                fontSize: 12,
                color: 'var(--text-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}>
                ▸ active tokens
              </div>
              <div style={{ border: '1px solid var(--border)' }}>
                {tokens.map(t => (
                  <div key={t.id} style={{
                    padding: '10px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 13,
                  }}>
                    <div>
                      <span style={{ color: 'var(--text)' }}>
                        {t.label || 'unnamed'}
                      </span>
                      <span style={{ color: 'var(--text-4)', fontSize: 11, marginLeft: 12 }}>
                        created {new Date(t.createdAt).toLocaleDateString()}
                        {t.lastUsedAt && ` | last used ${new Date(t.lastUsedAt).toLocaleDateString()}`}
                      </span>
                    </div>
                    <button
                      onClick={() => revokeToken(t.id)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        color: 'var(--red)',
                        padding: '3px 10px',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      [revoke]
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
