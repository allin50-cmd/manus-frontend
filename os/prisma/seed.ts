import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'chambersa' },
    update: {},
    create: {
      name: 'Chambers A',
      subdomain: 'chambersa',
      enabledVerticals: ['revenue', 'law', 'compliance'],
      defaultVertical: 'revenue',
      branding: { primaryColor: '#0f172a' },
    },
  });

  const raw = `uios_${randomBytes(24).toString('hex')}`;
  await prisma.apiKey.create({
    data: {
      tenantId: tenant.id,
      vertical: '*',
      keyHash: hashKey(raw),
      active: true,
    },
  });

  console.log('Seeded tenant:', tenant.subdomain);
  console.log('API key (save this — only shown once):', raw);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
