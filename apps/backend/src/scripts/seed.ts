import '../load-env.js';
import mongoose from 'mongoose';

/**
 * Verifies MongoDB connectivity. Demo users, products, and orders were removed;
 * create real accounts via POST /api/v1/auth/register.
 */
async function seed(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/agentic_ecommerce';
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB');
  console.log('  No demo data is inserted. Register a store at /auth/register (or POST /api/v1/auth/register).');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
