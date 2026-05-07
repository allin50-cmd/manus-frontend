import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { validateBody } from '../server/middleware/validate.js';

const mockReq = (body: unknown) => ({ body } as any);
const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const TestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

describe('validateBody middleware', () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    next = vi.fn();
  });

  it('calls next() when body matches schema', () => {
    const req = mockReq({ name: 'Alice', email: 'alice@example.com' });
    const res = mockRes();
    validateBody(TestSchema)(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('replaces req.body with parsed/coerced data when valid', () => {
    const req = mockReq({ name: 'Alice', email: 'alice@example.com' });
    const res = mockRes();
    validateBody(TestSchema)(req, res, next);
    expect(req.body).toEqual({ name: 'Alice', email: 'alice@example.com' });
  });

  it('calls res.status(400) when body fails schema', () => {
    const req = mockReq({ name: '', email: 'not-an-email' });
    const res = mockRes();
    validateBody(TestSchema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('calls res.json() with error message when body fails schema', () => {
    const req = mockReq({ name: 'Alice', email: 'bad' });
    const res = mockRes();
    validateBody(TestSchema)(req, res, next);
    expect(res.json).toHaveBeenCalled();
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg).toHaveProperty('error');
    expect(jsonArg).toHaveProperty('errors');
  });

  it('does NOT call next() when body fails schema', () => {
    const req = mockReq({ name: 'Alice', email: 'bad' });
    const res = mockRes();
    validateBody(TestSchema)(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('fails when required field is missing', () => {
    const req = mockReq({ email: 'alice@example.com' });
    const res = mockRes();
    validateBody(TestSchema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
