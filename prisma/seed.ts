import { PrismaClient } from '../app/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.team.upsert({
    where: { code: 'DEFAULT' },
    update: {},
    create: {
      name: 'Default Team',
      code: 'DEFAULT',
      description: 'Default team for new signups',
    },
  });
  console.log('Seeded team with code: DEFAULT');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
