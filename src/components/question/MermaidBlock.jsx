import { useEffect, useRef, useId } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'neutral' });

export default function MermaidBlock({ chart }) {
  const ref = useRef(null);
  // Generate a clean ID for the SVG container
  const rawId = useId();
  const id = `mermaid-${rawId.replace(/:/g, '')}`;

  useEffect(() => {
    let cancelled = false;

    const renderChart = async () => {
      try {
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = `<pre style="color: red; padding: 10px; font-size: 11px;">Error rendering diagram: ${err.message || 'Syntax error'}</pre>`;
        }
      }
    };

    renderChart();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  return <div ref={ref} className="mermaid-block" style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }} />;
}
