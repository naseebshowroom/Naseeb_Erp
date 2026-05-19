import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Installment from './models/Installment.js';
import Payment from './models/Payment.js';
import Customer from './models/Customer.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kiraya_erp';

async function run() {
  console.log('Connecting to database:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected!');

  console.log('--- Testing /installments/vasooli ---');
  try {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));

    const installments = await Installment.aggregate([
      { $match: { isDeleted: false, status: { $nin: ['completed', 'closed-rollover'] }, isCashSale: { $ne: true } } },
      {
        $addFields: {
          pastAndTodaySchedules: {
            $filter: {
              input: '$paymentSchedule',
              as: 'slot',
              cond: { $lte: ['$$slot.dueDate', endOfToday] }
            }
          },
          todaySchedules: {
            $filter: {
              input: '$paymentSchedule',
              as: 'slot',
              cond: {
                $and: [
                  { $gte: ['$$slot.dueDate', startOfToday] },
                  { $lte: ['$$slot.dueDate', endOfToday] }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          expectedUpToToday: { $round: [{ $multiply: [{ $size: '$pastAndTodaySchedules' }, '$perInstallmentAmount'] }, 0] },
          isDueToday: { $gt: [{ $size: '$todaySchedules' }, 0] }
        }
      },
      {
        $addFields: {
          cumulativeDue: { $round: [{ $subtract: ['$expectedUpToToday', '$totalPaid'] }, 0] }
        }
      },
      { $match: { cumulativeDue: { $gt: 0 } } },
      {
        $project: {
          customer: 1, category: 1, brand: 1, model: 1, khataNumber: 1,
          perInstallmentAmount: 1, remainingAmount: 1, totalPaid: 1,
          cumulativeDue: 1, isDueToday: 1, paymentSchedule: 1, scheduleType: 1, investorName: 1,
          daysOverdue: {
            $floor: { $divide: ['$cumulativeDue', '$perInstallmentAmount'] }
          }
        }
      },
      { $sort: { cumulativeDue: -1 } }
    ]);

    await Customer.populate(installments, { path: 'customer', select: 'fullName cnic phone khataNumber' });
    console.log('Success /installments/vasooli! Count:', installments.length);
  } catch (err) {
    console.error('Error in /installments/vasooli:', err);
  }

  console.log('--- Testing /payments ---');
  try {
    const page = 1;
    const limit = 1000;
    const startIndex = 0;
    const query = {};
    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('customer', 'fullName cnic phone')
      .populate('collectedBy', 'fullName name role')
      .populate({
        path: 'installment',
        select: 'category brand model khataNumber installmentPrice remainingAmount totalPaid status'
      })
      .sort({ paidDate: -1 })
      .skip(startIndex)
      .limit(limit)
      .lean();
    console.log('Success /payments! Count:', payments.length);
  } catch (err) {
    console.error('Error in /payments:', err);
  }

  await mongoose.disconnect();
  console.log('Disconnected.');
}

run();
