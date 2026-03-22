import type { CSSProperties } from 'react';

/**
 * Base scene fill: charcoal plus layered radial glows (warm accent + soft rim light)
 * so dark window/table UI reads clearly off the background.
 */
export const UI_SCENE_BACKDROP_STYLE: CSSProperties = {
  backgroundColor: '#0f0f0e',
  backgroundImage: [
    'radial-gradient(ellipse 100% 88% at 50% 44%, rgba(216, 119, 86, 0.065) 0%, transparent 56%)',
    'radial-gradient(ellipse 72% 58% at 82% 78%, rgba(216, 119, 86, 0.045) 0%, transparent 50%)',
    'radial-gradient(ellipse 88% 42% at 50% -6%, rgba(250, 249, 245, 0.038) 0%, transparent 40%)',
  ].join(', '),
};
