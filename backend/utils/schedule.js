/**
 * Generate a payment schedule array
 * @param {Date|String} startDate - The date of the first installment
 * @param {Number} count - Total number of installments
 * @param {String} scheduleType - 'daily', 'weekly', '5day', '10day', 'monthly'
 * @returns {Array} Array of objects with dueDate and status
 */
export const generatePaymentSchedule = (startDate, count, scheduleType) => {
  const schedule = [];
  const currentDate = new Date(startDate);
  
  // Reset time to start of day for consistency
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    // Clone date to avoid mutating the same object
    const dueDate = new Date(currentDate);
    
    schedule.push({
      dueDate,
      status: 'pending',
    });

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
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      default:
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  return schedule;
};
