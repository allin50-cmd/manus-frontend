export type DocumentType = 'brief' | 'email' | 'transcript' | 'pleading';

export interface FetchedDocument {
  text: string;
  bytes: number;
  mime: string;
  source: string;
}

const MAX_BYTES = 10 * 1024 * 1024;

export async function fetchDocument(url: string): Promise<FetchedDocument> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Document fetch failed: ${res.status} ${res.statusText}`);
  }

  const contentLength = Number(res.headers.get('content-length') ?? 0);
  if (contentLength && contentLength > MAX_BYTES) {
    throw new Error(`Document too large: ${contentLength} bytes (max ${MAX_BYTES})`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > MAX_BYTES) {
    throw new Error(`Document too large after read: ${buffer.byteLength} bytes`);
  }

  const mime = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const text = await extractText(buffer, mime, url);

  return { text, bytes: buffer.byteLength, mime, source: url };
}

async function extractText(buffer: Buffer, mime: string, url: string): Promise<string> {
  if (mime === 'application/pdf' || url.toLowerCase().endsWith('.pdf')) {
    const { default: pdfParse } = await import('pdf-parse');
    const parsed = await pdfParse(buffer);
    return parsed.text.trim();
  }

  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    url.toLowerCase().endsWith('.docx')
  ) {
    const { default: mammoth } = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (mime.startsWith('text/html') || url.toLowerCase().endsWith('.html')) {
    return stripHtml(buffer.toString('utf8'));
  }

  if (mime.startsWith('text/') || mime === 'message/rfc822' || mime === '') {
    return buffer.toString('utf8').trim();
  }

  throw new Error(`Unsupported document MIME type: ${mime}`);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
