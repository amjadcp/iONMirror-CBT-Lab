import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import MermaidBlock from './MermaidBlock';
import 'katex/dist/katex.min.css';

// Sanitize schema to allow inline SVGs for circuit and geometry diagrams
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'svg', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'ellipse', 'g'
  ],
  attributes: {
    ...(defaultSchema.attributes || {}),
    svg: ['viewBox', 'width', 'height', 'xmlns', 'style', 'class'],
    path: ['d', 'fill', 'stroke', 'stroke-width', 'strokeWidth', 'class'],
    circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width', 'strokeWidth', 'class'],
    rect: ['x', 'y', 'width', 'height', 'rx', 'ry', 'fill', 'stroke', 'stroke-width', 'strokeWidth', 'class'],
    line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width', 'strokeWidth', 'class'],
    polygon: ['points', 'fill', 'stroke', 'stroke-width', 'strokeWidth', 'class'],
    polyline: ['points', 'fill', 'stroke', 'stroke-width', 'strokeWidth', 'class'],
    ellipse: ['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'stroke-width', 'strokeWidth', 'class'],
    g: ['fill', 'stroke', 'stroke-width', 'strokeWidth', 'class', 'transform']
  },
};

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const isMermaid = match && match[1] === 'mermaid';

          if (isMermaid) {
            return <MermaidBlock chart={String(children).trim()} />;
          }

          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
