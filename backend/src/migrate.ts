import { AppDataSource } from './data-source';

async function main() {
  await AppDataSource.initialize();
  const applied = await AppDataSource.runMigrations();
  console.log(`Applied ${applied.length} migration(s).`);
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error('Migration run failed:', err);
  process.exit(1);
});
