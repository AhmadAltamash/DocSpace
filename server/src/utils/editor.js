// Converts plain text / very light markdown into Tiptap-compatible
// ProseMirror JSON, so imported files land in the editor as real,
// editable structured content (not a single opaque blob).
//
// Supported on import: "# / ## / ###" headings, "- " or "* " bullet
// lists, "1. " ordered lists, and plain paragraphs. This is
// intentionally not a full markdown parser (see README/ARCHITECTURE
// for the scope cut).
import * as cheerio from 'cheerio';

function textRun(text) {
  return text.length ? [{ type: 'text', text }] : [];
}

export function textToDoc(rawText) {
  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  const content = [];
  let listBuffer = null; // { type: 'bulletList' | 'orderedList', items: [] }

  const flushList = () => {
    if (listBuffer && listBuffer.items.length) {
      content.push({
        type: listBuffer.type,
        content: listBuffer.items.map((item) => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: textRun(item) }],
        })),
      });
    }
    listBuffer = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    const bullet = line.match(/^[-*]\s+(.*)$/);
    const ordered = line.match(/^\d+\.\s+(.*)$/);

    if (heading) {
      flushList();
      content.push({ type: 'heading', attrs: { level: heading[1].length }, content: textRun(heading[2]) });
    } else if (bullet) {
      if (!listBuffer || listBuffer.type !== 'bulletList') {
        flushList();
        listBuffer = { type: 'bulletList', items: [] };
      }
      listBuffer.items.push(bullet[1]);
    } else if (ordered) {
      if (!listBuffer || listBuffer.type !== 'orderedList') {
        flushList();
        listBuffer = { type: 'orderedList', items: [] };
      }
      listBuffer.items.push(ordered[1]);
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      content.push({ type: 'paragraph', content: textRun(line) });
    }
  }
  flushList();

  if (content.length === 0) content.push({ type: 'paragraph', content: [] });

  return { type: 'doc', content };
}

export function emptyDoc() {
  return { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
}

// Rough plain-text extraction from Tiptap JSON, used nowhere critical
// today but handy for search/preview snippets later.
export function docToText(doc) {
  if (!doc || !doc.content) return '';
  const walk = (nodes) =>
    nodes
      .map((n) => {
        if (n.type === 'text') return n.text || '';
        if (n.content) return walk(n.content) + (n.type === 'paragraph' || n.type === 'heading' ? '\n' : '');
        return '';
      })
      .join('');
  return walk(doc.content).trim();
}

function inlineNodes($, element) {
  const nodes = [];

  $(element)
    .contents()
    .each((_, node) => {
      if (node.type === 'text') {
        const text = node.data || '';

        if (text) {
          nodes.push({
            type: 'text',
            text,
          });
        }

        return;
      }

      if (node.type !== 'tag') return;

      const tag = node.name.toLowerCase();

      if (['strong', 'b', 'em', 'i', 'u'].includes(tag)) {
        const children = inlineNodes($, node);

        const mark =
          tag === 'strong' || tag === 'b'
            ? 'bold'
            : tag === 'em' || tag === 'i'
              ? 'italic'
              : 'underline';

        children.forEach((child) => {
          child.marks = [
            ...(child.marks || []),
            { type: mark },
          ];
        });

        nodes.push(...children);
        return;
      }

      if (tag === 'br') {
        nodes.push({ type: 'hardBreak' });
        return;
      }

      if (tag === 'a') {
        const children = inlineNodes($, node);

        children.forEach((child) => {
          child.marks = [
            ...(child.marks || []),
            {
              type: 'link',
              attrs: {
                href: $(node).attr('href') || '',
              },
            },
          ];
        });

        nodes.push(...children);
        return;
      }

      nodes.push(...inlineNodes($, node));
    });

  return nodes;
}

export function htmlToDoc(html) {
  const $ = cheerio.load(html, {
    xmlMode: false,
  });

  const content = [];

  $('body')
    .children()
    .each((_, element) => {
      const tag = element.name?.toLowerCase();

      if (!tag) return;

      // Headings
      const headingMatch = tag.match(/^h([1-3])$/);

      if (headingMatch) {
        const children = inlineNodes($, element);

        content.push({
          type: 'heading',
          attrs: {
            level: Number(headingMatch[1]),
          },
          content: children.length ? children : undefined,
        });

        return;
      }

      // Paragraph
      if (tag === 'p') {
        const children = inlineNodes($, element);

        content.push({
          type: 'paragraph',
          content: children.length ? children : undefined,
        });

        return;
      }

      // Bullet list
      if (tag === 'ul') {
        const items = [];

        $(element)
          .children('li')
          .each((_, li) => {
            const children = inlineNodes($, li);

            items.push({
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: children.length ? children : undefined,
                },
              ],
            });
          });

        if (items.length) {
          content.push({
            type: 'bulletList',
            content: items,
          });
        }

        return;
      }

      // Numbered list
      if (tag === 'ol') {
        const items = [];

        $(element)
          .children('li')
          .each((_, li) => {
            const children = inlineNodes($, li);

            items.push({
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: children.length ? children : undefined,
                },
              ],
            });
          });

        if (items.length) {
          content.push({
            type: 'orderedList',
            content: items,
          });
        }

        return;
      }

      // Fallback for unsupported block elements
      const text = $(element).text().trim();

      if (text) {
        content.push({
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text,
            },
          ],
        });
      }
    });

  if (!content.length) {
    return emptyDoc();
  }

  return {
    type: 'doc',
    content,
  };
}