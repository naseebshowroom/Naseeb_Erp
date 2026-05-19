/**
 * Generate a payment schedule array
 * @param {Date|String} startDate - The date of the first installment
 * @param {Number} remainingAmount - Total outstanding balance to be cleared
 * @param {Number} perInstallmentAmount - Per installment amount (Rs.)
 * @param {String} scheduleType - 'daily', 'weekly', '5day', '10day', 'monthly'
 * @returns {Array} Array of objects with dueDate, status, expectedAmount, paidAmount, shortfallAmount
 */
export const generatePaymentSchedule = (startDate, remainingAmount, perInstallmentAmount, scheduleType = 'monthly') => {
  const schedule = [];
  const currentDate = new Date(startDate);
  
  // Reset time to start of day for consistency
  currentDate.setHours(0, 0, 0, 0);

  const amount = Number(remainingAmount) || 0;
  const perInst = Number(perInstallmentAmount) || 0;

  if (amount <= 0 || perInst <= 0) return [];

  const count = Math.ceil(amount / perInst);
  let balanceTracker = amount;

  for (let i = 0; i < count; i++) {
    // Clone date to avoid mutating the same object
    const dueDate = new Date(currentDate);
    const expectedAmount = balanceTracker >= perInst ? perInst : balanceTracker;

    schedule.push({
      dueDate,
      status: 'pending',
      expectedAmount,
      paidAmount: 0,
      shortfallAmount: expectedAmount
    });

    balanceTracker -= expectedAmount;

    // Increment date based on scheduleType for the *next* iteration
    switch (scheduleType) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case '5-day':
      case '5day':
        currentDate.setDate(currentDate.getDate() + 5);
        break;
      case '10-day':
      case '10day':
        currentDate.setDate(currentDate.getDate() + 10);
        break;
      case 'monthly':
      default:
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  return schedule;
};
