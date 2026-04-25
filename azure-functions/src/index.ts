import * as df from 'durable-functions';
import { app, InvocationContext } from '@azure/functions';

// ─── Types ────────────────────────────────────────────────────────────────────

type BundleInput = {
  bundleId: number;
  orchestrationId: string;
  tenantId: string;
  caseId: number;
};

type ValidationResult = {
  valid: boolean;
  bundleId: number;
  tenantId: string;
  caseId: number;
  documents: Array<{ id: number; fileName: string; blobPath: string | null }>;
  reason?: string;
};

type RenderResult = {
  pageCount: number;
  pdfBuffer: Buffer;
};

// ─── Orchestrator ─────────────────────────────────────────────────────────────

const bundleOrchestrator = df.orchestrator(function* (context: df.OrchestrationContext) {
  const input: BundleInput = context.df.getInput();

  // 1. Validate bundle eligibility
  const validation: ValidationResult = yield context.df.callActivity(
    'validateBundle',
    input,
  );

  if (!validation.valid) {
    yield context.df.callActivity('failBundle', {
      bundleId: input.bundleId,
      tenantId: input.tenantId,
      reason: validation.reason,
    });
    return { status: 'failed', reason: validation.reason };
  }

  // 2. Render pages in parallel (one activity per document)
  const renderTasks = validation.documents.map((doc) =>
    context.df.callActivity('renderDocumentPage', {
      ...doc,
      tenantId: input.tenantId,
    }),
  );
  const pages: RenderResult[] = yield context.df.Task.all(renderTasks);

  // 3. Merge pages into a single PDF bundle
  const pdfBlobPath: string = yield context.df.callActivity('mergeBundlePDF', {
    bundleId: input.bundleId,
    tenantId: input.tenantId,
    caseId: input.caseId,
    pages,
    documents: validation.documents,
  });

  // 4. Finalize: write blob path, audit hash, mark ready
  yield context.df.callActivity('finalizeBundle', {
    bundleId: input.bundleId,
    tenantId: input.tenantId,
    caseId: input.caseId,
    pdfBlobPath,
    orchestrationId: input.orchestrationId,
  });

  return { status: 'ready', pdfBlobPath };
});

df.app.orchestration('bundleOrchestrator', bundleOrchestrator);

// ─── Activity: validateBundle ─────────────────────────────────────────────────

df.app.activity('validateBundle', {
  handler: async (input: BundleInput): Promise<ValidationResult> => {
    // Query the database for case documents approved for bundle
    // (Omitted: wire up DB connection as in server/trpc/db.ts)
    const documents: Array<{ id: number; fileName: string; blobPath: string | null }> = [];

    if (documents.length === 0) {
      return {
        valid: false,
        bundleId: input.bundleId,
        tenantId: input.tenantId,
        caseId: input.caseId,
        documents: [],
        reason: 'No documents approved for bundle',
      };
    }

    return {
      valid: true,
      bundleId: input.bundleId,
      tenantId: input.tenantId,
      caseId: input.caseId,
      documents,
    };
  },
});

// ─── Activity: renderDocumentPage ────────────────────────────────────────────

df.app.activity('renderDocumentPage', {
  handler: async (input: {
    id: number;
    fileName: string;
    blobPath: string | null;
    tenantId: string;
  }): Promise<RenderResult> => {
    // Download blob → render page(s) → return buffer
    // Implementation: use @azure/storage-blob to download, pdflib to process
    return { pageCount: 1, pdfBuffer: Buffer.alloc(0) };
  },
});

// ─── Activity: mergeBundlePDF ─────────────────────────────────────────────────

df.app.activity('mergeBundlePDF', {
  handler: async (input: {
    bundleId: number;
    tenantId: string;
    caseId: number;
    pages: RenderResult[];
    documents: Array<{ id: number; fileName: string }>;
  }): Promise<string> => {
    // Merge all page buffers with pdflib
    // Upload merged PDF to Azure Blob Storage
    // Return blob path
    const blobPath = `tenants/${input.tenantId}/bundles/${input.bundleId}/bundle.pdf`;
    return blobPath;
  },
});

// ─── Activity: finalizeBundle ─────────────────────────────────────────────────

df.app.activity('finalizeBundle', {
  handler: async (input: {
    bundleId: number;
    tenantId: string;
    caseId: number;
    pdfBlobPath: string;
    orchestrationId: string;
  }): Promise<void> => {
    // Update bundle record in DB: status = 'ready', pdfBlobPath, auditHash
    // Write audit event
    console.log(`[FinalizeBundle] Bundle ${input.bundleId} ready at ${input.pdfBlobPath}`);
  },
});

// ─── Activity: failBundle ─────────────────────────────────────────────────────

df.app.activity('failBundle', {
  handler: async (input: { bundleId: number; tenantId: string; reason?: string }): Promise<void> => {
    // Update bundle record: status = 'failed'
    console.error(`[FailBundle] Bundle ${input.bundleId} failed: ${input.reason}`);
  },
});

// ─── Service Bus trigger: start orchestration ─────────────────────────────────

app.serviceBusTrigger('startBundleOrchestration', {
  queueName: 'clerkos-bundles',
  connection: 'AzureWebJobsServiceBus',
  handler: async (message: BundleInput, context: InvocationContext): Promise<void> => {
    const client = df.getClient(context);
    await client.startNew('bundleOrchestrator', {
      instanceId: message.orchestrationId,
      input: message,
    });
    context.log(`[StartOrchestration] Instance ${message.orchestrationId} started`);
  },
});
