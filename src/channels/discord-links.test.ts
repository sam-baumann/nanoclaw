import { describe, it, expect } from 'vitest';
import { createDiscordAdapter } from '@chat-adapter/discord';

import { unmaskBareLinks } from './discord.js';

function render(markdown: string): string {
  const adapter = createDiscordAdapter({ botToken: 't', publicKey: '0'.repeat(64), applicationId: 'a' });
  unmaskBareLinks(adapter);
  const fc = (adapter as unknown as { formatConverter: { renderPostable: (m: unknown) => string } }).formatConverter;
  return fc.renderPostable({ markdown });
}

describe('discord outbound links', () => {
  it('sends a bare URL as the bare URL', () => {
    expect(render('see https://example.com/a?b=1 now')).toBe('see https://example.com/a?b=1 now');
  });

  it('sends an autolink whose text equals the URL as the bare URL', () => {
    expect(render('<https://example.com>')).toBe('https://example.com');
  });

  it('bare URLs inside formatting and lists are unwrapped too', () => {
    expect(render('**https://example.com**')).toBe('**https://example.com**');
    expect(render('- https://example.com')).toContain('https://example.com');
    expect(render('- https://example.com')).not.toContain('](');
  });

  it('leaves masked links alone', () => {
    expect(render('[docs](https://example.com/docs)')).toBe('[docs](https://example.com/docs)');
  });
});
