import Link from 'next/link';
import { ShareLinkButton } from './share-link-button';
import { formatCompact, formatStandard } from '@/src/lib/data';
import type { LeaderboardRow } from '@/src/contracts/clawrank';

function Avatar({ name }: { name: string }) {
  return <div className="avatar">{name.slice(0, 2).toUpperCase()}</div>;
}

export function LeaderboardTable({ rows, basePath = '/a' }: { rows: LeaderboardRow[]; basePath?: string }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Agent</th>
            <th>Tokens</th>
            <th>Tool calls</th>
            <th>Messages</th>
            <th>Git</th>
            <th>Top tools</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <span className="rank-badge">#{row.rank}</span>
              </td>
              <td>
                <div className="identity-row">
                  <Link href={`${basePath}/${row.detailSlug}`} className="identity">
                    <Avatar name={row.agentName} />
                    <div>
                      <div>{row.displayName}</div>
                      <div className="muted">{row.detailSlug}</div>
                    </div>
                  </Link>
                  <ShareLinkButton path={`${basePath}/${row.detailSlug}`} label={row.displayName} />
                </div>
              </td>
              <td>{formatCompact(row.tokenUsage.value)}</td>
              <td>{formatStandard(row.toolCalls.value)}</td>
              <td>{formatStandard(row.messageCount.value)}</td>
              <td className="muted">
                {formatStandard(row.commits.value)} commits · {formatStandard(row.filesTouched.value)} files
              </td>
              <td>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(row.topToolNames || []).map((tool) => (
                    <span className="pill" key={tool}>{tool}</span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
