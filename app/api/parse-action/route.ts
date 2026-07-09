import { NextRequest, NextResponse } from 'next/server';
import { parseAction } from '@/lib/action-parser/parser';
import { validateAction } from '@/lib/action-parser/validator';
import { generatePreview } from '@/lib/action-parser/executionPreview';

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  const parsed = parseAction(text);
  const validation = validateAction(parsed);
  const preview = generatePreview(parsed);

  const response = {
    ...parsed,
    ...validation,
    preview,
    mock_execution: validation.valid ? 'Ready to run' : 'Missing fields',
  };

  return NextResponse.json(response);
}
