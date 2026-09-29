import { typograph } from './typograph';

/**
 * Hast-плагин для Markdown/MDX (обработчик Sätteri в Astro 7): та же типографика, что у строк
 * интерфейса (`typograph`) — в текстах кейсов нет висячих предлогов, союзов и частиц и тире
 * в начале строки. (Старые rehype-плагины Sätteri молча пропускает — поэтому свой формат.)
 */
export const typographPlugin = {
  name: 'typograph',
  text(node: { type: 'text'; value: string }) {
    const value = typograph(node.value);
    if (value !== node.value) return { type: 'text' as const, value };
  },
};
