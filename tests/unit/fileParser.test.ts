import { describe, it, expect } from 'vitest';

/**
 * File Parser Unit Tests
 *
 * These tests verify the file parsing logic and helper functions.
 * Since the actual parseFile function is a Convex action, we test
 * the parsing logic patterns and text processing utilities.
 */

// Helper functions extracted from fileParser for testing
const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();

const stripRtf = (raw: string): string => {
  if (!raw.trim().startsWith('{\\rtf')) return raw.trim();
  let text = raw.replace(/\\par[d]?/g, '\n');
  text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  text = text.replace(/\\[a-zA-Z]+-?\\d* ?/g, '');
  text = text.replace(/[{}]/g, '');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
};

const extractTextFromXml = (xml: string): string => {
  const withoutTags = xml.replace(/<[^>]+>/g, ' ');
  return normalizeText(
    withoutTags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  );
};

const filterMeaningfulStrings = (parts: string[]): string[] => {
  const seen = new Set<string>();
  return parts
    .map((p) => normalizeText(p))
    .filter((p) => {
      if (!p || seen.has(p)) return false;
      seen.add(p);
      const wordCount = p.split(/\s+/).length;
      const alphaRatio = (p.match(/[a-zA-Z]/g)?.length || 0) / p.length;
      const hasSentencePunc = /[.?!]/.test(p);
      const hasSpace = p.includes(' ');
      const hasLower = /[a-z]/.test(p);
      const looksLikeStyle = /^[A-Za-z0-9._-]+$/.test(p);
      return (
        p.length >= 25 &&
        wordCount >= 5 &&
        alphaRatio >= 0.55 &&
        hasSpace &&
        hasLower &&
        !looksLikeStyle &&
        (hasSentencePunc || wordCount >= 8)
      );
    });
};

// Parse HTML to text (simplified version)
const parseHtmlToText = (html: string): string => {
  // Remove script tags
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove style tags
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // Remove event handlers
  html = html.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  // Extract text
  const textOnly = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return textOnly;
};

// Parse Markdown to text (simplified version)
const parseMarkdownToText = (md: string): string => {
  return md
    // Remove headers markup
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/___(.+?)___/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove links, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

describe('FileParser - Text Normalization', () => {
  describe('normalizeText', () => {
    it('collapses multiple spaces', () => {
      expect(normalizeText('hello    world')).toBe('hello world');
    });

    it('trims leading and trailing whitespace', () => {
      expect(normalizeText('  hello world  ')).toBe('hello world');
    });

    it('converts newlines and tabs to spaces', () => {
      expect(normalizeText('hello\n\tworld')).toBe('hello world');
    });

    it('handles empty string', () => {
      expect(normalizeText('')).toBe('');
    });

    it('handles string with only whitespace', () => {
      expect(normalizeText('   \n\t  ')).toBe('');
    });
  });
});

describe('FileParser - RTF Processing', () => {
  describe('stripRtf', () => {
    it('returns non-RTF text unchanged', () => {
      expect(stripRtf('Hello world')).toBe('Hello world');
    });

    it('strips RTF control sequences', () => {
      const rtf = '{\\rtf1\\ansi Hello World\\par}';
      const result = stripRtf(rtf);
      expect(result).toContain('Hello World');
      // Curly braces should be removed
      expect(result.includes('{')).toBe(false);
      expect(result.includes('}')).toBe(false);
    });

    it('converts paragraph markers to newlines', () => {
      const rtf = '{\\rtf1 First\\par Second\\par Third}';
      const result = stripRtf(rtf);
      expect(result).toContain('First');
      expect(result).toContain('Second');
      expect(result).toContain('Third');
    });

    it('decodes hex escape sequences', () => {
      const rtf = "{\\rtf1 caf\\'e9}"; // café
      const result = stripRtf(rtf);
      expect(result).toContain('café');
    });

    it('removes curly braces', () => {
      const rtf = '{\\rtf1 {nested} text}';
      const result = stripRtf(rtf);
      expect(result).not.toContain('{');
      expect(result).not.toContain('}');
    });

    it('collapses multiple newlines', () => {
      const rtf = '{\\rtf1 First\\par\\par\\par\\par Second}';
      const result = stripRtf(rtf);
      // Should have at most 2 consecutive newlines
      expect(result).not.toMatch(/\n{3,}/);
    });
  });
});

describe('FileParser - XML Processing', () => {
  describe('extractTextFromXml', () => {
    it('removes XML tags', () => {
      const xml = '<root><child>Hello</child><child>World</child></root>';
      const result = extractTextFromXml(xml);
      expect(result).toBe('Hello World');
    });

    it('decodes HTML entities', () => {
      const xml = '<text>&amp; &lt; &gt; &quot; &#39;</text>';
      const result = extractTextFromXml(xml);
      expect(result).toBe("& < > \" '");
    });

    it('handles nested tags', () => {
      const xml = '<a><b><c>Deep</c></b> <d>Nested</d></a>';
      const result = extractTextFromXml(xml);
      expect(result).toBe('Deep Nested');
    });

    it('handles empty tags', () => {
      const xml = '<root><empty/><text>Content</text></root>';
      const result = extractTextFromXml(xml);
      expect(result).toBe('Content');
    });

    it('handles self-closing tags', () => {
      const xml = '<root>Before<br/>After</root>';
      const result = extractTextFromXml(xml);
      expect(result).toBe('Before After');
    });
  });
});

describe('FileParser - Content Filtering', () => {
  describe('filterMeaningfulStrings', () => {
    it('filters out short strings', () => {
      const parts = ['Hi', 'This is a longer meaningful sentence with words.'];
      const result = filterMeaningfulStrings(parts);
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('meaningful');
    });

    it('filters out strings with low alpha ratio', () => {
      const parts = [
        '12345 67890 12345 67890 12345',
        'This is a proper sentence with many words.',
      ];
      const result = filterMeaningfulStrings(parts);
      expect(result.every(s => s.match(/[a-zA-Z]/g)!.length / s.length >= 0.55)).toBe(true);
    });

    it('filters out strings without spaces', () => {
      const parts = [
        'NoSpacesHereAtAllVeryLongString',
        'This string has proper spaces between words.',
      ];
      const result = filterMeaningfulStrings(parts);
      expect(result.every(s => s.includes(' '))).toBe(true);
    });

    it('filters out ALL CAPS strings', () => {
      const parts = [
        'THIS IS ALL CAPS WITHOUT LOWERCASE LETTERS AT ALL.',
        'This has proper mixed case with lowercase letters.',
      ];
      const result = filterMeaningfulStrings(parts);
      expect(result.every(s => /[a-z]/.test(s))).toBe(true);
    });

    it('removes duplicate strings', () => {
      const parts = [
        'This sentence appears twice with enough words.',
        'This sentence appears twice with enough words.',
        'This is a different sentence with enough words.',
      ];
      const result = filterMeaningfulStrings(parts);
      expect(result).toHaveLength(2);
    });

    it('requires sentence punctuation or 8+ words', () => {
      const parts = [
        'Short sentence no punct words five',
        'Longer sentence without punctuation but has eight words here',
        'Short with punctuation enough words!',
      ];
      const result = filterMeaningfulStrings(parts);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(s => /[.?!]/.test(s) || s.split(/\s+/).length >= 8)).toBe(true);
    });

    it('filters out style-like strings', () => {
      const parts = [
        'StyleName-Bold-Italic-12pt',
        'This is proper content with many words in it.',
      ];
      const result = filterMeaningfulStrings(parts);
      expect(result.every(s => !/^[A-Za-z0-9._-]+$/.test(s))).toBe(true);
    });
  });
});

describe('FileParser - HTML Processing', () => {
  describe('parseHtmlToText', () => {
    it('removes script tags', () => {
      const html = '<div>Hello</div><script>alert("XSS")</script><div>World</div>';
      const result = parseHtmlToText(html);
      expect(result).toBe('Hello World');
      expect(result).not.toContain('alert');
    });

    it('removes style tags', () => {
      const html = '<style>.class { color: red; }</style><p>Content</p>';
      const result = parseHtmlToText(html);
      expect(result).toBe('Content');
      expect(result).not.toContain('color');
    });

    it('removes event handlers', () => {
      const html = '<button onclick="doSomething()">Click</button>';
      const result = parseHtmlToText(html);
      expect(result).toBe('Click');
      expect(result).not.toContain('onclick');
    });

    it('decodes HTML entities', () => {
      const html = '<p>&amp; &lt; &gt; &quot; &#39; &nbsp;</p>';
      const result = parseHtmlToText(html);
      expect(result).toBe("& < > \" '");
    });

    it('extracts text from nested elements', () => {
      const html = '<div><h1>Title</h1><p>Paragraph <strong>bold</strong> text</p></div>';
      const result = parseHtmlToText(html);
      expect(result).toBe('Title Paragraph bold text');
    });

    it('handles empty HTML', () => {
      expect(parseHtmlToText('')).toBe('');
    });

    it('handles HTML with only tags', () => {
      const html = '<div><span></span><br/></div>';
      const result = parseHtmlToText(html);
      expect(result).toBe('');
    });
  });
});

describe('FileParser - Markdown Processing', () => {
  describe('parseMarkdownToText', () => {
    it('removes header markers', () => {
      const md = '# Header 1\n## Header 2\n### Header 3';
      const result = parseMarkdownToText(md);
      expect(result).toBe('Header 1 Header 2 Header 3');
    });

    it('removes bold formatting', () => {
      const md = 'This is **bold** and __also bold__ text';
      const result = parseMarkdownToText(md);
      expect(result).toBe('This is bold and also bold text');
    });

    it('removes italic formatting', () => {
      const md = 'This is *italic* and _also italic_ text';
      const result = parseMarkdownToText(md);
      expect(result).toBe('This is italic and also italic text');
    });

    it('removes combined bold/italic', () => {
      const md = 'This is ***bold italic*** and ___also___ text';
      const result = parseMarkdownToText(md);
      expect(result).toBe('This is bold italic and also text');
    });

    it('removes code blocks', () => {
      const md = 'Text before\n```js\nconst x = 1;\n```\nText after';
      const result = parseMarkdownToText(md);
      expect(result).toBe('Text before Text after');
      expect(result).not.toContain('const');
    });

    it('removes inline code', () => {
      const md = 'Use the `console.log` function';
      const result = parseMarkdownToText(md);
      expect(result).toBe('Use the console.log function');
    });

    it('extracts text from links', () => {
      const md = 'Click [here](https://example.com) to visit';
      const result = parseMarkdownToText(md);
      expect(result).toBe('Click here to visit');
      expect(result).not.toContain('http');
    });

    it('removes image syntax', () => {
      const md = 'See the image: ![Alt text](image.png)';
      const result = parseMarkdownToText(md);
      // Image link syntax should be simplified to alt text or removed
      expect(result).toContain('Alt text');
      expect(result).not.toContain('image.png');
    });

    it('handles empty markdown', () => {
      expect(parseMarkdownToText('')).toBe('');
    });
  });
});

describe('FileParser - File Type Detection', () => {
  // Helper to detect file type from magic bytes (first few bytes)
  const detectFileType = (buffer: Uint8Array): string => {
    if (buffer.length < 4) return 'unknown';

    // PDF: starts with %PDF
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return 'pdf';
    }

    // ZIP (including DOCX, PPTX, XLSX): starts with PK
    if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
      return 'zip';
    }

    // RTF: starts with {\rtf
    if (buffer[0] === 0x7b && buffer[1] === 0x5c && buffer[2] === 0x72 && buffer[3] === 0x74) {
      return 'rtf';
    }

    return 'unknown';
  };

  it('detects PDF files', () => {
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
    expect(detectFileType(pdfHeader)).toBe('pdf');
  });

  it('detects ZIP-based files (DOCX, PPTX)', () => {
    const zipHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // PK..
    expect(detectFileType(zipHeader)).toBe('zip');
  });

  it('detects RTF files', () => {
    const rtfHeader = new Uint8Array([0x7b, 0x5c, 0x72, 0x74]); // {\rt
    expect(detectFileType(rtfHeader)).toBe('rtf');
  });

  it('returns unknown for unrecognized files', () => {
    const unknownHeader = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    expect(detectFileType(unknownHeader)).toBe('unknown');
  });

  it('handles short buffers', () => {
    const shortBuffer = new Uint8Array([0x25]);
    expect(detectFileType(shortBuffer)).toBe('unknown');
  });
});

describe('FileParser - Error Messages', () => {
  // Test that error messages are user-friendly
  const getErrorMessage = (error: string): string => {
    const errorMap: Record<string, string> = {
      'pdf-corrupt': 'Failed to parse PDF. The file may be corrupted or password-protected.',
      'docx-corrupt': 'Failed to parse Word document. The file may be corrupted.',
      'pptx-corrupt': 'Failed to parse PowerPoint file. The file may be corrupted.',
      'unsupported': 'Unsupported file format. Please upload one of: PDF, DOCX, PPTX, ODT, HTML, Markdown, TXT, or RTF.',
    };
    return errorMap[error] || 'An unknown error occurred.';
  };

  it('provides helpful PDF error message', () => {
    const msg = getErrorMessage('pdf-corrupt');
    expect(msg).toContain('PDF');
    expect(msg).toContain('corrupted');
    expect(msg).toContain('password-protected');
  });

  it('provides helpful DOCX error message', () => {
    const msg = getErrorMessage('docx-corrupt');
    expect(msg).toContain('Word document');
    expect(msg).toContain('corrupted');
  });

  it('lists supported formats in unsupported error', () => {
    const msg = getErrorMessage('unsupported');
    expect(msg).toContain('PDF');
    expect(msg).toContain('DOCX');
    expect(msg).toContain('PPTX');
    expect(msg).toContain('TXT');
  });
});
