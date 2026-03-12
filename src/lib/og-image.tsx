import React from 'react';
import { ImageResponse } from 'next/og';
import { formatCompact, formatPeriodLabel, getShareDetail } from '@/src/lib/data';

const h = React.createElement;

const C = {
  bg: '#0f0f0e',
  border: 'rgba(155,153,145,0.15)',
  text: '#faf9f5',
  text2: '#c1bfb5',
  text3: '#9b9991',
  text4: '#6b6963',
  accent: '#d87756',
};

const T = {
  kicker: {
    size: 24,
    tracking: 3.5,
    color: C.text3,
  },
  title: {
    size: 72,
    tracking: -2,
    color: C.text,
  },
  byline: {
    size: 34,
    tracking: 0,
    color: C.text2,
  },
  metric: {
    size: 112,
    tracking: -4,
    color: C.accent,
  },
  metricUnit: {
    size: 44,
    tracking: -1,
    color: C.text2,
  },
  railLabel: {
    size: 22,
    tracking: 2.75,
    color: C.text3,
  },
  railValue: {
    size: 46,
    tracking: -1.5,
    color: C.text,
  },
  footer: {
    size: 22,
    tracking: 2,
    color: C.text3,
  },
  footerBrand: {
    size: 24,
    tracking: -0.5,
    color: C.accent,
  },
};

let fontData: ArrayBuffer | null = null;
let fontBoldData: ArrayBuffer | null = null;

async function loadFonts() {
  if (!fontData) {
    const [regular, bold] = await Promise.all([
      fetch('https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPQ.ttf').then((r) => r.arrayBuffer()),
      fetch('https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8L6tjPQ.ttf').then((r) => r.arrayBuffer()),
    ]);
    fontData = regular;
    fontBoldData = bold;
  }
}

export async function renderOgImage(detailSlug: string, mode: 'baked' | 'live' = 'live') {
  const detail = await getShareDetail(detailSlug, mode);

  if (!detail) {
    return new Response('Not found', { status: 404 });
  }

  await loadFonts();

  const tokenText = formatCompact(detail.tokenUsage);
  const periodText = formatPeriodLabel(detail.periodStart, detail.periodEnd);
  const toolCalls = detail.stats.find((stat) => stat.label === 'Tool calls');
  const messages = detail.stats.find((stat) => stat.label === 'Messages');
  const sessions = detail.stats.find((stat) => stat.label === 'Sessions');
  const railStats = [
    { label: 'Tool calls', value: toolCalls ? formatCompact(toolCalls.value) : '—' },
    { label: 'Messages', value: messages ? formatCompact(messages.value) : '—' },
    { label: 'Sessions', value: sessions ? formatCompact(sessions.value) : '—' },
  ];

  return new ImageResponse(
    h(
      'div',
      {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: C.bg,
          color: C.text,
          fontFamily: 'JetBrains Mono',
          padding: 0,
        },
      },
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            padding: '24px 42px',
            borderBottom: `1px solid ${C.border}`,
            color: C.text4,
            fontSize: 24,
          },
        },
        h('div', { style: { display: 'flex', gap: 12, marginRight: 24 } },
          h('span', { style: { width: 18, height: 18, borderRadius: 999, background: '#c75050', display: 'flex' } }),
          h('span', { style: { width: 18, height: 18, borderRadius: 999, background: '#d4a84b', display: 'flex' } }),
          h('span', { style: { width: 18, height: 18, borderRadius: 999, background: '#5fb87a', display: 'flex' } }),
        ),
        h('span', null, `$ clawrank show ${detail.detailSlug}`),
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'stretch',
            flex: 1,
            padding: '42px 48px 34px',
            gap: 40,
          },
        },
        h(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1,
              minWidth: 0,
            },
          },
          h(
            'div',
            {
              style: {
                display: 'flex',
                color: T.kicker.color,
                fontSize: T.kicker.size,
                letterSpacing: T.kicker.tracking,
                textTransform: 'uppercase',
                marginBottom: 18,
              },
            },
            `#${detail.rank} this week`,
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'baseline',
                gap: 18,
                flexWrap: 'wrap',
                marginBottom: 34,
              },
            },
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  fontSize: T.title.size,
                  fontWeight: 700,
                  letterSpacing: T.title.tracking,
                  lineHeight: 1,
                  color: T.title.color,
                },
              },
              detail.agentName,
            ),
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  color: T.byline.color,
                  fontSize: T.byline.size,
                  lineHeight: 1,
                },
              },
              `by @${detail.ownerName}`,
            ),
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'baseline',
                gap: 18,
                flexWrap: 'wrap',
                marginBottom: 14,
              },
            },
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  fontSize: T.metric.size,
                  fontWeight: 700,
                  color: T.metric.color,
                  lineHeight: 0.9,
                  letterSpacing: T.metric.tracking,
                },
              },
              tokenText,
            ),
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  color: T.metricUnit.color,
                  fontSize: T.metricUnit.size,
                  fontWeight: 400,
                  lineHeight: 1,
                  letterSpacing: T.metricUnit.tracking,
                },
              },
              'tokens',
            ),
          ),
        ),
        h(
          'div',
          {
            style: {
              width: 250,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              borderLeft: `1px solid ${C.border}`,
              paddingLeft: 28,
              gap: 22,
            },
          },
          ...railStats.map((stat) =>
            h(
              'div',
              {
                key: stat.label,
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                },
              },
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    color: T.railLabel.color,
                    fontSize: T.railLabel.size,
                    textTransform: 'uppercase',
                    letterSpacing: T.railLabel.tracking,
                  },
                },
                stat.label,
              ),
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    color: T.railValue.color,
                    fontSize: T.railValue.size,
                    fontWeight: 700,
                    letterSpacing: T.railValue.tracking,
                    lineHeight: 1,
                  },
                },
                stat.value,
              ),
            ),
          ),
        ),
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '24px 42px',
            borderTop: `1px solid ${C.border}`,
            color: T.footer.color,
            fontSize: T.footer.size,
          },
        },
        h('span', { style: { display: 'flex', letterSpacing: T.footer.tracking } }, `▸ ${periodText}`),
        h('span', { style: { display: 'flex', color: T.footerBrand.color, fontSize: T.footerBrand.size, letterSpacing: T.footerBrand.tracking } }, 'clawrank.dev'),
      ),
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'JetBrains Mono', data: fontData!, weight: 400, style: 'normal' as const },
        { name: 'JetBrains Mono', data: fontBoldData!, weight: 700, style: 'normal' as const },
      ],
    },
  );
}
