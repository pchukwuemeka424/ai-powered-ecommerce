import '../load-env.js';
import mongoose from 'mongoose';
import { Product } from '../models/index.js';

/**
 * Backfills `isNewArrival` and `isFeatured` on existing product documents (MongoDB
 * does not apply Mongoose defaults to documents that already exist) and syncs
 * indexes for the Product collection.
 *
 * Run: pnpm --filter backend migrate:products
 */
async function migrate(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/agentic_ecommerce';
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB');

  const newArrival = await Product.updateMany(
    { isNewArrival: { $exists: false } },
    { $set: { isNewArrival: false } },
  );
  const featured = await Product.updateMany(
    { isFeatured: { $exists: false } },
    { $set: { isFeatured: false } },
  );
  console.log(`  isNewArrival: matched ${newArrival.matchedCount}, modified ${newArrival.modifiedCount}`);
  console.log(`  isFeatured: matched ${featured.matchedCount}, modified ${featured.modifiedCount}`);

  const indexNames = await Product.syncIndexes();
  console.log('✓ Product indexes synced:', indexNames.length ? indexNames.join(', ') : '(none new)');

  await mongoose.disconnect();
  console.log('✓ Disconnected');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
