import { typograph } from './typograph';

type Node = { type: string; tagName?: string; value?: string; children?: Node[] };

/**
 * Rehype-плагин для MDX: та же типографика, что у строк интерфейса (`typograph`) —
 * висячих предлогов и тире в начале строки нет и в текстах кейсов. Код не трогаем.
 */
export default function rehypeTypograph() {
  const walk = (node: Node) => {
    if (node.type === 'element' && (node.tagName === 'code' || node.tagName === 'pre')) return;
    if (node.type === 'text' && node.value) node.value = typograph(node.value);
    node.children?.forEach(walk);
  };
  return (tree: Node) => walk(tree);
}
