import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

// ─── Helpers ─────────────────────────────────────────────────────────────────
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const addWeeks = (date, weeks) => addDays(date, weeks * 7);

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const buildSchedule = (startDate, count, type, expectedAmount) => {
  const schedule = [];
  for (let i = 1; i <= count; i++) {
    let dueDate;
    if (type === 'daily')     dueDate = addDays(startDate, i);
    else if (type === 'weekly')    dueDate = addWeeks(startDate, i);
    else if (type === '5-day')     dueDate = addDays(startDate, i * 5);
    else if (type === '10-day')    dueDate = addDays(startDate, i * 10);
    else                           dueDate = addMonths(startDate, i);   // monthly

    const isPast = dueDate < new Date();
    schedule.push({
      dueDate,
      expectedAmount,
      status: isPast ? (Math.random() > 0.15 ? 'paid' : 'missed') : 'pending',
      paidDate: isPast && Math.random() > 0.15 ? addDays(dueDate, Math.floor(Math.random() * 3)) : undefined,
    });
  }
  return schedule;
};

const calcPaid = (schedule, perAmt) => {
  const paidCount = schedule.filter(s => s.status === 'paid').length;
  schedule.forEach(s => { if (s.status === 'paid') s.paidAmount = perAmt; });
  return { paidCount, totalPaid: paidCount * perAmt };
};

// ─── Raw Data ─────────────────────────────────────────────────────────────────

const DISTRIBUTORS_DATA = [
  { name: 'Khalid Hussain', companyName: 'Al-Madina Motors', phone: '0321-4567890', address: 'Main Bazar, Khuzdar', cnic: '54301-1234567-1', category: 'motorcycle' },
  { name: 'Zubair Ahmad',   companyName: 'Zubair Electronics',phone: '0333-7654321', address: 'Circular Road, Hub',   cnic: '43201-9876543-2', category: 'electronics' },
  { name: 'Tariq Mehmood',  companyName: 'TM Auto House',      phone: '0300-1122334', address: 'Quetta Road, Khuzdar', cnic: '54301-5678901-3', category: 'motorcycle' },
  { name: 'Amjad Baloch',   companyName: 'Baloch Gadgets',     phone: '0345-9988776', address: 'Jinnah Chowk, Khuzdar',cnic: '54301-3456789-4', category: 'electronics' },
];

const CUSTOMERS_DATA = [
  // ── Weekly Customers ──────────────────────────────────────────────
  {
    fullName: 'Muhammad Aslam', fatherName: 'Ghulam Nabi', cnic: '54301-1111111-1',
    phone: '0301-1234567', address: 'Mohallah Ismail Khan, Khuzdar', city: 'Khuzdar',
    guarantors: [{ type: 'business', fullName: 'Naseer Ahmad', cnic: '54301-2222222-2', phone: '0302-1234567', address: 'Main Bazar, Khuzdar', businessName: 'Naseer General Store', businessType: 'Retail' }]
  },
  {
    fullName: 'Abdul Rehman', fatherName: 'Allah Bakhsh', cnic: '54301-3333333-3',
    phone: '0303-1234567', address: 'Satellite Town Block B, Khuzdar', city: 'Khuzdar',
    guarantors: [{ type: 'government', fullName: 'Iqbal Shah', cnic: '54301-4444444-4', phone: '0304-1234567', address: 'Quetta Road, Khuzdar', department: 'Education', designation: 'Teacher', employeeId: 'EDU-2021-045' }]
  },
  {
    fullName: 'Haji Dost Muhammad', fatherName: 'Wali Muhammad', cnic: '54301-5555555-5',
    phone: '0305-1234567', address: 'Gul Muhammad Colony, Khuzdar', city: 'Khuzdar',
    guarantors: [{ type: 'business', fullName: 'Rehmat Khan', cnic: '54301-6666666-6', phone: '0306-1234567', address: 'Near Imam Bargah, Khuzdar', businessName: 'Rehmat Pharmacy', businessType: 'Medical' }]
  },

  // ── Monthly Customers ─────────────────────────────────────────────
  {
    fullName: 'Sanaullah Baloch', fatherName: 'Wazir Khan', cnic: '54301-7777777-7',
    phone: '0307-1234567', address: 'Officer Colony, Khuzdar', city: 'Khuzdar',
    guarantors: [{ type: 'government', fullName: 'Dr. Aamir Hussain', cnic: '54301-8888888-8', phone: '0308-1234567', address: 'DHQ Hospital, Khuzdar', department: 'Health', designation: 'Doctor', employeeId: 'DOC-2019-012' }]
  },
  {
    fullName: 'Zafar Iqbal', fatherName: 'Bashir Ahmad', cnic: '54301-9999999-9',
    phone: '0309-1234567', address: 'Model Town, Khuzdar', city: 'Khuzdar',
    guarantors: [{ type: 'business', fullName: 'Pervez Akhtar', cnic: '54301-1212121-2', phone: '0310-1234567', address: 'Circular Road, Khuzdar', businessName: 'Pervez Hardware', businessType: 'Hardware' }]
  },
  {
    fullName: 'Liaquat Ali', fatherName: 'Ghafoor Khan', cnic: '54301-2121212-1',
    phone: '0311-1234567', address: 'Naya Abadi, Khuzdar', city: 'Khuzdar',
    guarantors: [{ type: 'government', fullName: 'Fahad Nawaz', cnic: '54301-3232323-2', phone: '0312-1234567', address: 'DC Office, Khuzdar', department: 'Revenue', designation: 'Patwari', employeeId: 'REV-2020-089' }]
  },

  // ── 10-Day Customers ──────────────────────────────────────────────
  {
    fullName: 'Mir Baz Khan', fatherName: 'Mir Dost Khan', cnic: '54301-4343434-3',
    phone: '0313-1234567', address: 'Makran Chowk Area, Khuzdar', city: 'Khuzdar',
    guarantors: [{ type: 'business', fullName: 'Shakeel Ahmad', cnic: '54301-5454545-4', phone: '0314-1234567', address: 'Fruit Market, Khuzdar', businessName: 'Shakeel Fruits', businessType: 'Wholesale' }]
  },
  {
    fullName: 'Ghulam Sarwar', fatherName: 'Sardar Khan', cnic: '54301-6565656-5',
    phone: '0315-1234567', address: 'Chaman Road, Khuzdar', city: 'Khuzdar',
    guarantors: [{ type: 'government', fullName: 'Asim Raza', cnic: '54301-7676767-6', phone: '0316-1234567', address: 'Police Station, Khuzdar', department: 'Police', designation: 'Constable', employeeId: 'POL-2022-034' }]
  },

  // ── 5-Day Customers ───────────────────────────────────────────────
  {
    fullName: 'Noor Muhammad', fatherName: 'Shah Muhammad', cnic: '54301-8787878-7',
    phone: '0317-1234567', address: 'Meezan Colony, Khuzdar', city: 'Khuzdar',
    guarantors: [{ type: 'business', fullName: 'Rashid Mehmood', cnic: '54301-9898989-8', phone: '0318-1234567', address: 'Old Adda, Khuzdar', businessName: 'Rashid Cloth House', businessType: 'Textile' }]
  },
  {
    fullName: 'Habibullah', fatherName: 'Bismillah Khan', cnic: '54301-1010101-9',
    phone: '0319-1234567', address: 'Gul Abad, Khuzdar', city: 'Khuzdar',
    guarantors: [{ type: 'government', fullName: 'Junaid Iqbal', cnic: '54301-1020203-0', phone: '0320-1234567', address: 'WAPDA Colony, Khuzdar', department: 'WAPDA', designation: 'Lineman', employeeId: 'WPD-2023-011' }]
  },

  // ── Daily Customers ───────────────────────────────────────────────
  {
    fullName: 'Taj Muhammad', fatherName: 'Karim Bakhsh', cnic: '54301-1030405-1',
    phone: '0321-2345678', address: 'Sabzi Mandi, Khuzdar', city: 'Khuzdar',
    guarantors: [{ type: 'business', fullName: 'Ameer Hamza', cnic: '54301-1040506-2', phone: '0322-2345678', address: 'Grain Market, Khuzdar', businessName: 'Hamza Trading', businessType: 'Trading' }]
  },
  {
    fullName: 'Atta Muhammad', fatherName: 'Essa Khan', cnic: '54301-1050607-3',
    phone: '0323-2345678', address: 'Bypass Road, Khuzdar', city: 'Khuzdar',
    guarantors: [{ type: 'business', fullName: 'Saeed Khan', cnic: '54301-1060708-4', phone: '0324-2345678', address: 'Near Masjid, Khuzdar', businessName: 'Saeed Bakery', businessType: 'Food' }]
  },
];

const INVENTORY_PRODUCTS = [
  { category: 'motorcycle', company: 'Honda', model: 'CD 70', color: 'Black', engineNo: 'HND-CD70-2024-001', chassisNo: 'HND-CHS-2024-001', purchasePrice: 110000 },
  { category: 'motorcycle', company: 'Yamaha', model: 'YBR 125', color: 'Red', engineNo: 'YMH-YBR-2024-002', chassisNo: 'YMH-CHS-2024-002', purchasePrice: 195000 },
  { category: 'motorcycle', company: 'Honda', model: 'CG 125', color: 'Blue', engineNo: 'HND-CG125-2024-003', chassisNo: 'HND-CHS-2024-003', purchasePrice: 175000 },
  { category: 'electronics', elecType: 'Mobile Phone', company: 'Samsung', model: 'Galaxy A15', color: 'Blue Black', serialNo: 'SAM-A15-IMEI-001122334455', purchasePrice: 45000 },
  { category: 'electronics', elecType: 'Air Conditioner', company: 'Gree', model: '1.5 Ton Split', color: 'White', serialNo: 'GREE-AC-2024-SN-11223', purchasePrice: 85000 },
  { category: 'electronics', elecType: 'Television', company: 'TCL', model: '43" Smart TV', color: 'Black', serialNo: 'TCL-43S5400-SN-99887', purchasePrice: 55000 },
  { category: 'electronics', elecType: 'Washing Machine', company: 'Dawlance', model: 'DWT-270 C', color: 'White', serialNo: 'DWL-DWT270-SN-44556', purchasePrice: 35000 },
  { category: 'electronics', elecType: 'Refrigerator', company: 'PEL', model: 'PRAS-20550', color: 'Silver', serialNo: 'PEL-PRAS-SN-77889', purchasePrice: 65000 },
  { category: 'motorcycle', company: 'Ravi', model: 'Piaggio 70', color: 'Green', engineNo: 'RAV-PG70-2024-004', chassisNo: 'RAV-CHS-2024-004', purchasePrice: 95000 },
  { category: 'electronics', elecType: 'Mobile Phone', company: 'Infinix', model: 'Hot 40', color: 'Timber Black', serialNo: 'INF-HOT40-IMEI-556677889900', purchasePrice: 38000 },
  { category: 'motorcycle', company: 'United', model: 'US 100', color: 'Red', engineNo: 'UNT-US100-2024-005', chassisNo: 'UNT-CHS-2024-005', purchasePrice: 88000 },
  { category: 'electronics', elecType: 'Air Conditioner', company: 'Haier', model: '1 Ton Split', color: 'White', serialNo: 'HAIER-AC-2024-SN-33445', purchasePrice: 72000 },
];

// Installment plans keyed to customer index
// scheduleType: daily | weekly | 5-day | 10-day | monthly
const PLAN_CONFIGS = [
  // customer[0] → weekly, motorcycle (Honda CD70)
  { custIdx: 0,  prodIdx: 0,  scheduleType: 'weekly',  totalInst: 26, advance: 15000, installmentPrice: 140000, startDate: new Date('2024-09-01') },
  // customer[1] → weekly, mobile (Samsung A15)
  { custIdx: 1,  prodIdx: 3,  scheduleType: 'weekly',  totalInst: 20, advance: 5000,  installmentPrice: 58000,  startDate: new Date('2024-10-06') },
  // customer[2] → weekly, motorcycle (CG 125)
  { custIdx: 2,  prodIdx: 2,  scheduleType: 'weekly',  totalInst: 30, advance: 25000, installmentPrice: 215000, startDate: new Date('2024-11-03') },

  // customer[3] → monthly, AC (Gree)
  { custIdx: 3,  prodIdx: 4,  scheduleType: 'monthly', totalInst: 12, advance: 10000, installmentPrice: 110000, startDate: new Date('2024-07-01') },
  // customer[4] → monthly, TV (TCL)
  { custIdx: 4,  prodIdx: 5,  scheduleType: 'monthly', totalInst: 10, advance: 8000,  installmentPrice: 70000,  startDate: new Date('2024-08-01') },
  // customer[5] → monthly, Fridge (PEL)
  { custIdx: 5,  prodIdx: 7,  scheduleType: 'monthly', totalInst: 18, advance: 10000, installmentPrice: 85000,  startDate: new Date('2024-09-15') },

  // customer[6] → 10-day, Washing Machine (Dawlance)
  { custIdx: 6,  prodIdx: 6,  scheduleType: '10-day',  totalInst: 15, advance: 5000,  installmentPrice: 48000,  startDate: new Date('2024-10-01') },
  // customer[7] → 10-day, motorcycle (Yamaha YBR)
  { custIdx: 7,  prodIdx: 1,  scheduleType: '10-day',  totalInst: 36, advance: 30000, installmentPrice: 250000, startDate: new Date('2024-11-10') },

  // customer[8] → 5-day, mobile (Infinix Hot 40)
  { custIdx: 8,  prodIdx: 9,  scheduleType: '5-day',   totalInst: 20, advance: 5000,  installmentPrice: 50000,  startDate: new Date('2024-12-01') },
  // customer[9] → 5-day, AC (Haier)
  { custIdx: 9,  prodIdx: 11, scheduleType: '5-day',   totalInst: 24, advance: 10000, installmentPrice: 95000,  startDate: new Date('2025-01-05') },

  // customer[10] → daily, motorcycle (Ravi Piaggio)
  { custIdx: 10, prodIdx: 8,  scheduleType: 'daily',   totalInst: 90, advance: 10000, installmentPrice: 115000, startDate: new Date('2025-01-15') },
  // customer[11] → daily, motorcycle (United US100)
  { custIdx: 11, prodIdx: 10, scheduleType: 'daily',   totalInst: 60, advance: 8000,  installmentPrice: 108000, startDate: new Date('2025-02-01') },
];

// ─── Main Seed Function ───────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kiraya_erp');
    console.log('✅  MongoDB connected');

    // Dynamic imports after connection
    const { default: User }         = await import('./models/User.js');
    const { default: Distributor }  = await import('./models/Distributor.js');
    const { default: Customer }     = await import('./models/Customer.js');
    const { default: Inventory }    = await import('./models/Inventory.js');
    const { default: Installment }  = await import('./models/Installment.js');
    const { default: Payment }      = await import('./models/Payment.js');
    const { default: Asset }        = await import('./models/Asset.js');
    const { default: Worker }       = await import('./models/Worker.js');
    const { default: CollectionAssignment } = await import('./models/CollectionAssignment.js');

    // ── 0. Wipe existing data ────────────────────────────────────────
    console.log('🧹  Wiping existing database records for a clean slate...');
    await User.deleteMany({});
    await Distributor.deleteMany({});
    await Customer.deleteMany({});
    await Inventory.deleteMany({});
    await Installment.deleteMany({});
    await Payment.deleteMany({});
    await Asset.deleteMany({});
    await Worker.deleteMany({});
    await CollectionAssignment.deleteMany({});

    // ── 1. Owner user ────────────────────────────────────────────────
    let owner = await User.create({ username: 'owner', password: 'admin123', fullName: 'Naseeb Khan (Owner)', role: 'owner', isActive: true });
    console.log('👤  Owner created → username: owner | password: admin123');

    const workerUser1 = await User.create({
      username: 'worker1',
      password: 'password123',
      fullName: 'Ali Raza',
      phone: '0300-1112223',
      role: 'worker',
      isActive: true,
      createdBy: owner._id
    });
    const workerUser2 = await User.create({
      username: 'worker2',
      password: 'password123',
      fullName: 'Zahid Khan',
      phone: '0345-4445556',
      role: 'worker',
      isActive: true,
      createdBy: owner._id
    });

    const worker1 = await Worker.create({ _id: workerUser1._id, name: 'Ali Raza', phone: '0300-1112223', zone: 'North Khuzdar', createdBy: owner._id });
    const worker2 = await Worker.create({ _id: workerUser2._id, name: 'Zahid Khan', phone: '0345-4445556', zone: 'South Khuzdar', createdBy: owner._id });
    console.log('👷  Workers seeded with User Login accounts');

    // ── 2. Distributors ──────────────────────────────────────────────
    const distMap = {};
    for (const d of DISTRIBUTORS_DATA) {
      let dist = await Distributor.findOne({ cnic: d.cnic });
      if (!dist) dist = await Distributor.create(d);
      distMap[d.category] = distMap[d.category] || dist._id; // first of each category
      distMap[`${d.category}_${d.name}`] = dist._id;
    }
    console.log('🏢  Distributors seeded');

    // ── 3. Customers ─────────────────────────────────────────────────
    const customerDocs = [];
    for (const c of CUSTOMERS_DATA) {
      let cust = await Customer.findOne({ cnic: c.cnic });
      if (!cust) {
        cust = await Customer.create({ ...c, createdBy: owner._id });
      }
      customerDocs.push(cust);
    }
    console.log(`👥  ${customerDocs.length} customers seeded`);

    // ── 4. Inventory → Installments → Payments ────────────────────────
    let receiptSeq = 1;
    const currentYear = new Date().getFullYear();

    for (const plan of PLAN_CONFIGS) {
      const prod    = INVENTORY_PRODUCTS[plan.prodIdx];
      const custDoc = customerDocs[plan.custIdx];
      const distId  = prod.category === 'motorcycle'
        ? distMap['motorcycle_Khalid Hussain']
        : distMap['electronics_Zubair Ahmad'];

      // Create inventory item
      const inv = await Inventory.create({
        ...prod,
        status:       'on_installment',
        purchasePrice: prod.purchasePrice,
        distributor:  'Naseeb Autos',
        customerName: custDoc.fullName,
      });

      // Create Asset item
      const assetTypeMap = { 'Mobile Phone': 'mobile', 'Air Conditioner': 'ac', 'Television': 'lcd', 'Washing Machine': 'washing_machine', 'Refrigerator': 'fridge' };
      const assetCat = prod.category === 'motorcycle' ? 'motorcycle' : (assetTypeMap[prod.elecType] || 'other');
      const asset = await Asset.create({
        assetType: assetCat,
        chassisNumber: prod.chassisNo,
        engineNumber: prod.engineNo,
        serialNumber: prod.serialNo,
        brand: prod.company,
        model: prod.model,
        color: prod.color,
        sourceDistributor: distId,
        purchasePrice: prod.purchasePrice,
        purchaseDate: new Date(plan.startDate.getTime() - 86400000), // 1 day before
        currentStatus: 'on-installment',
        currentHolder: { holderType: 'customer', customerId: custDoc._id },
        history: [{ event: 'purchased', date: new Date(plan.startDate.getTime() - 86400000) }]
      });

      // Build payment schedule
      const baseRemaining    = plan.installmentPrice - plan.advance;
      const perInstallment   = Math.round(baseRemaining / plan.totalInst);
      const schedule         = buildSchedule(plan.startDate, plan.totalInst, plan.scheduleType, perInstallment);
      const { paidCount, totalPaid } = calcPaid(schedule, perInstallment);
      const remaining        = plan.installmentPrice - plan.advance - totalPaid;

      // Build installment doc fields
      const instFields = {
        customer:            custDoc._id,
        category:            assetCat,
        brand:               prod.company,
        model:               prod.model,
        color:               prod.color,
        serialNumber:        prod.serialNo,
        engineNumber:        prod.engineNo,
        chassisNumber:       prod.chassisNo,
        condition:           'new',
        distributor:         distId,
        assetId:             asset._id,
        purchasePrice:       prod.purchasePrice,
        installmentPrice:    plan.installmentPrice,
        advanceAmount:       plan.advance,
        totalInstallments:   plan.totalInst,
        scheduleType:        plan.scheduleType,
        startDate:           plan.startDate,
        paymentSchedule:     schedule,
        totalPaid,
        installmentsPaid:    paidCount,
        remainingAmount:     remaining,
        perInstallmentAmount: perInstallment,
        status:              remaining <= 0 ? 'completed' : paidCount >= plan.totalInst - 2 ? 'near_completion' : 'active',
        createdBy:           owner._id,
      };

      const inst = await Installment.create(instFields);

      // Link inventory to installment
      await Inventory.findByIdAndUpdate(inv._id, { installment: inst._id });

      // Link Asset to installment
      asset.linkedInstallments.push(inst._id);
      asset.history.push({ event: 'sold-installment', date: plan.startDate, installmentId: inst._id, customerId: custDoc._id });
      await asset.save();
      
      // Assign collections
      const pendingSchedule = inst.paymentSchedule.filter(s => s.status === 'pending');
      if (pendingSchedule.length > 0) {
        const wkr = (receiptSeq % 2 === 0) ? worker1 : worker2;
        await CollectionAssignment.create({
          worker: wkr._id,
          customer: custDoc._id,
          installment: inst._id,
          date: pendingSchedule[0].dueDate,
          amountDue: pendingSchedule[0].expectedAmount,
          status: 'pending',
          assignedBy: owner._id
        });
      }

      // Create payment records for paid entries
      const paidSchedule = schedule.filter(s => s.status === 'paid');
      for (const entry of paidSchedule) {
        const rn = `RCP-${currentYear}-${receiptSeq.toString().padStart(4, '0')}`;
        receiptSeq++;
        await Payment.create({
          installment:      inst._id,
          customer:         custDoc._id,
          amount:           perInstallment,
          paymentMode:      'cash',
          collectorName:    'Naseeb Khan',
          paymentDate:      entry.paidDate || entry.dueDate,
          receiptNumber:    rn,
          scheduleEntryId:  entry._id,
          createdBy:        owner._id,
        });
      }

      console.log(`  ✔  ${custDoc.fullName} → ${plan.scheduleType.padEnd(8)} | ${prod.company} ${prod.model} | Paid ${paidCount}/${plan.totalInst}`);
    }

    console.log('\n🎉  Database seeded successfully!');
    console.log('─────────────────────────────────────────');
    console.log('Login → username: owner  |  password: admin123');
    console.log('─────────────────────────────────────────');
    process.exit(0);
  } catch (err) {
    console.error('❌  Seed error:', err.message);
    console.error(err);
    process.exit(1);
  }
};

seed();
