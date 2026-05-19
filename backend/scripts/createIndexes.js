/**
 * MongoDB Index Migration Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Run ONCE after initial deployment (or any time you add new indexes):
 *
 *   node backend/scripts/createIndexes.js
 *
 * These indexes are critical for performance as data grows.
 * Without them, queries on 5000+ customer records will be slow.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kiraya_erp';

const createIndexes = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    const db = mongoose.connection.db;

    // ── Customers ──────────────────────────────────────────────────────────
    console.log('Creating Customer indexes...');
    const customers = db.collection('customers');
    await customers.createIndex({ cnic: 1 }, { unique: true });
    await customers.createIndex({ phone: 1 });
    await customers.createIndex({ status: 1 });
    await customers.createIndex({ isDeleted: 1 });
    await customers.createIndex(
      { fullName: 'text', cnic: 'text', phone: 'text' },
      { name: 'customer_text_search' }
    );
    console.log('  ✓ Customer indexes created');

    // ── Installments ────────────────────────────────────────────────────────
    console.log('Creating Installment indexes...');
    const installments = db.collection('installments');
    await installments.createIndex({ customer: 1 });
    await installments.createIndex({ status: 1 });
    await installments.createIndex({ category: 1 });
    await installments.createIndex({ status: 1, category: 1 });          // compound
    await installments.createIndex({ 'schedule.dueDate': 1, status: 1 }); // overdue queries
    await installments.createIndex({ distributor: 1 });
    console.log('  ✓ Installment indexes created');

    // ── Payments ────────────────────────────────────────────────────────────
    console.log('Creating Payment indexes...');
    const payments = db.collection('payments');
    await payments.createIndex({ installment: 1 });
    await payments.createIndex({ customer: 1 });
    await payments.createIndex({ paidDate: -1 });                      // sort by date desc
    await payments.createIndex({ collectedBy: 1, paidDate: -1 });       // per-worker reports
    await payments.createIndex({ paidDate: 1, installment: 1 });       // duplicate-check
    console.log('  ✓ Payment indexes created');

    // ── Users ───────────────────────────────────────────────────────────────
    console.log('Creating User indexes...');
    const users = db.collection('users');
    await users.createIndex({ username: 1 }, { unique: true });
    await users.createIndex({ role: 1 });
    console.log('  ✓ User indexes created');

    // ── Distributors ────────────────────────────────────────────────────────
    console.log('Creating Distributor indexes...');
    const distributors = db.collection('distributors');
    await distributors.createIndex({ name: 1 });
    await distributors.createIndex({ outstandingBalance: -1 });
    console.log('  ✓ Distributor indexes created');

    console.log('\n🎉 All indexes created successfully!');
    
    // Print summary
    const allIndexes = {
      customers:     await customers.indexes(),
      installments:  await installments.indexes(),
      payments:      await payments.indexes(),
      users:         await users.indexes(),
      distributors:  await distributors.indexes(),
    };
    
    console.log('\nIndex summary:');
    for (const [coll, indexes] of Object.entries(allIndexes)) {
      console.log(`  ${coll}: ${indexes.length} indexes`);
    }

  } catch (err) {
    console.error('❌ Error creating indexes:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed. Exiting.');
    process.exit(0);
  }
};

createIndexes();
