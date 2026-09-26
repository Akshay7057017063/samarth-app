import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data', 'database.json');

class DataStore {
  constructor() {
    this.data = {
      users: [],
      wallets: [],
      transactions: [],
      sales: [],
      siteContent: null
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure superadmin exists in loaded data
        if (!this.data.users.some(u => u.role === 'superadmin')) {
          this.initDefaults();
          this.save();
        }
      } else {
        this.initDefaults();
        this.save();
      }
    } catch (err) {
      console.warn('Error reading database.json, initializing defaults:', err.message);
      this.initDefaults();
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database.json:', err);
    }
  }

  initDefaults() {
    const salt = bcrypt.genSaltSync(10);
    const userPass = bcrypt.hashSync('user123456', salt);
    const adminPass = bcrypt.hashSync('admin123456', salt);
    const superAdminPass = bcrypt.hashSync('superadmin123', salt);

    // Super Admin (Full Control Over All Customers & Data)
    const superAdmin = {
      _id: 'superadmin_master_001',
      memberId: 'SUPER001',
      userCode: 'SUPER001',
      sponsorCode: 'ROOT',
      sponsorMemberId: 'ROOT',
      name: 'Chief Super Administrator',
      email: 'superadmin@samarth.com',
      phone: '9999999999',
      password: superAdminPass,
      role: 'superadmin',
      dateOfEntry: '01/01/2026',
      userType: 'PAID',
      activationDate: '01/01/2026',
      joiningPackage: 'Super Admin Master Access',
      rank: 'Crown Ambassador',
      leftCount: 999,
      rightCount: 888,
      leftBusiness: 1500000,
      rightBusiness: 1200000,
      totalReferral: 50,
      activeReferral: 45,
      leftPv: 5000,
      rightPv: 4000,
      leftCarryForwardPv: 1000,
      rightCarryForwardPv: 0,
      totalTeam: 1887,
      activeTeam: 1450,
      teamPercent: '95%',
      matchingIncome: 250000,
      todayMatchingIncome: 12000,
      franchiseReferralIncome: 75000,
      franchiseMatchingIncome: 45000,
      totalIncome: 382000,
      panNumber: 'SUPER1234X',
      panVerified: true,
      bankDetails: {
        accountHolderName: 'Samarth India Apex Trust',
        accountNumber: '10000000000001',
        ifscCode: 'HDFC0000001',
        bankName: 'HDFC Bank Corporate',
        upiId: 'superadmin@samarth'
      },
      status: 'active',
      createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
    };

    // Customer from screenshot: Mahesh rajendra jondhale (SI681908)
    const mahesh = {
      _id: 'user_mahesh_681908',
      memberId: 'SI681908',
      userCode: 'SI681908',
      sponsorCode: 'SI107476',
      sponsorMemberId: 'SI107476',
      name: 'Mahesh rajendra jondhale',
      email: 'mahesh@samarthindia.online',
      phone: '9823456789',
      password: userPass,
      role: 'user',
      dateOfEntry: '04/08/2026',
      userType: 'UNPAID',
      activationDate: '-',
      joiningPackage: '-',
      rank: 'Distributor',
      leftCount: 5,
      rightCount: 0,
      leftBusiness: 10800,
      rightBusiness: 0,
      totalReferral: 0,
      activeReferral: 0,
      leftPv: 60,
      rightPv: 0,
      leftCarryForwardPv: 60,
      rightCarryForwardPv: 0,
      totalTeam: 5,
      activeTeam: 5,
      teamPercent: '15%',
      matchingIncome: 0,
      todayMatchingIncome: 0,
      franchiseReferralIncome: 0,
      franchiseMatchingIncome: 0,
      totalIncome: 0,
      panNumber: 'MHESH1234K',
      panVerified: true,
      bankDetails: {
        accountHolderName: 'Mahesh rajendra jondhale',
        accountNumber: '123456789012',
        ifscCode: 'SBIN0004567',
        bankName: 'State Bank of India',
        upiId: 'mahesh@upi'
      },
      status: 'active',
      createdAt: new Date('2026-08-04T10:00:00Z').toISOString()
    };

    // Standard Admin (Alex Mora)
    const admin = {
      _id: 'admin_alex_001',
      memberId: 'ADMIN001',
      userCode: 'ADMIN001',
      sponsorCode: 'SUPER001',
      sponsorMemberId: 'SUPER001',
      name: 'Alex Mora',
      email: 'admin@samarth.com',
      phone: '9876543210',
      password: adminPass,
      role: 'admin',
      dateOfEntry: '01/01/2026',
      userType: 'PAID',
      activationDate: '01/01/2026',
      joiningPackage: 'Master Franchise',
      rank: 'Diamond Leader',
      leftCount: 142,
      rightCount: 98,
      leftBusiness: 245000,
      rightBusiness: 198000,
      totalReferral: 12,
      activeReferral: 10,
      leftPv: 1200,
      rightPv: 950,
      leftCarryForwardPv: 250,
      rightCarryForwardPv: 0,
      totalTeam: 240,
      activeTeam: 185,
      teamPercent: '77%',
      matchingIncome: 45000,
      todayMatchingIncome: 3500,
      franchiseReferralIncome: 12000,
      franchiseMatchingIncome: 8500,
      totalIncome: 69000,
      panNumber: 'ALEXM1234Z',
      panVerified: true,
      bankDetails: {
        accountHolderName: 'Samarth India Master Org',
        accountNumber: '50200098765432',
        ifscCode: 'HDFC0000123',
        bankName: 'HDFC Bank',
        upiId: 'admin@samarth'
      },
      status: 'active',
      createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
    };

    // The 5 Downline members on Mahesh's Left leg
    const downlines = [
      {
        _id: 'user_downline_1',
        memberId: 'SI681909',
        userCode: 'SI681909',
        sponsorCode: 'SI681908',
        sponsorMemberId: 'SI681908',
        name: 'Rahul Patil',
        email: 'rahul@example.com',
        phone: '9811122233',
        password: userPass,
        role: 'user',
        position: 'left',
        dateOfEntry: '05/08/2026',
        userType: 'PAID',
        activationDate: '06/08/2026',
        joiningPackage: 'Bio-Magnetic Single Mat',
        leftPv: 20,
        rightPv: 0,
        leftBusiness: 3600,
        rightBusiness: 0,
        matchingIncome: 500,
        totalIncome: 500,
        status: 'active',
        createdAt: new Date('2026-08-05T10:00:00Z').toISOString()
      },
      {
        _id: 'user_downline_2',
        memberId: 'SI681910',
        userCode: 'SI681910',
        sponsorCode: 'SI681908',
        sponsorMemberId: 'SI681908',
        name: 'Suresh Shinde',
        email: 'suresh@example.com',
        phone: '9822233344',
        password: userPass,
        role: 'user',
        position: 'left',
        dateOfEntry: '07/08/2026',
        userType: 'PAID',
        activationDate: '08/08/2026',
        joiningPackage: 'Bio-Magnetic Single Mat',
        leftPv: 20,
        rightPv: 0,
        leftBusiness: 3600,
        rightBusiness: 0,
        matchingIncome: 500,
        totalIncome: 500,
        status: 'active',
        createdAt: new Date('2026-08-07T10:00:00Z').toISOString()
      },
      {
        _id: 'user_downline_3',
        memberId: 'SI681911',
        userCode: 'SI681911',
        sponsorCode: 'SI681908',
        sponsorMemberId: 'SI681908',
        name: 'Ganesh Pawar',
        email: 'ganesh@example.com',
        phone: '9833344455',
        password: userPass,
        role: 'user',
        position: 'left',
        dateOfEntry: '10/08/2026',
        userType: 'PAID',
        activationDate: '11/08/2026',
        joiningPackage: 'Bio-Magnetic Single Mat',
        leftPv: 20,
        rightPv: 0,
        leftBusiness: 3600,
        rightBusiness: 0,
        matchingIncome: 500,
        totalIncome: 500,
        status: 'active',
        createdAt: new Date('2026-08-10T10:00:00Z').toISOString()
      },
      {
        _id: 'user_downline_4',
        memberId: 'SI681912',
        userCode: 'SI681912',
        sponsorCode: 'SI681908',
        sponsorMemberId: 'SI681908',
        name: 'Sunil Kadam',
        email: 'sunil@example.com',
        phone: '9844455566',
        password: userPass,
        role: 'user',
        position: 'left',
        dateOfEntry: '12/08/2026',
        userType: 'UNPAID',
        activationDate: '-',
        joiningPackage: '-',
        leftPv: 0,
        rightPv: 0,
        leftBusiness: 0,
        rightBusiness: 0,
        matchingIncome: 0,
        totalIncome: 0,
        status: 'active',
        createdAt: new Date('2026-08-12T10:00:00Z').toISOString()
      },
      {
        _id: 'user_downline_5',
        memberId: 'SI681913',
        userCode: 'SI681913',
        sponsorCode: 'SI681908',
        sponsorMemberId: 'SI681908',
        name: 'Nitin More',
        email: 'nitin@example.com',
        phone: '9855566677',
        password: userPass,
        role: 'user',
        position: 'left',
        dateOfEntry: '15/08/2026',
        userType: 'UNPAID',
        activationDate: '-',
        joiningPackage: '-',
        leftPv: 0,
        rightPv: 0,
        leftBusiness: 0,
        rightBusiness: 0,
        matchingIncome: 0,
        totalIncome: 0,
        status: 'active',
        createdAt: new Date('2026-08-15T10:00:00Z').toISOString()
      }
    ];

    this.data.users = [superAdmin, mahesh, admin, ...downlines];

    // Wallets
    this.data.wallets = [
      {
        _id: 'w_super',
        userId: superAdmin._id,
        memberId: superAdmin.memberId,
        currentBalance: 382000.00,
        captchaEarnings: 5000.00,
        referralCommissions: 377000.00,
        totalWithdrawn: 150000.00,
        todayCaptchasSolved: 50,
        lastCaptchaDate: new Date().toISOString().split('T')[0]
      },
      {
        _id: 'w_mahesh',
        userId: mahesh._id,
        memberId: mahesh.memberId,
        currentBalance: 350.00,
        captchaEarnings: 150.00,
        referralCommissions: 200.00,
        totalWithdrawn: 0.00,
        todayCaptchasSolved: 12,
        lastCaptchaDate: new Date().toISOString().split('T')[0]
      },
      {
        _id: 'w_admin',
        userId: admin._id,
        memberId: admin.memberId,
        currentBalance: 69000.00,
        captchaEarnings: 4500.00,
        referralCommissions: 64500.00,
        totalWithdrawn: 25000.00,
        todayCaptchasSolved: 50,
        lastCaptchaDate: new Date().toISOString().split('T')[0]
      }
    ];

    // Customer Purchases / Sales Ledger
    this.data.sales = [
      {
        _id: 'sale_1',
        userCode: 'SI681909',
        customerName: 'Rahul Patil',
        packageName: 'Bio-Magnetic Healthcare Single Bed Pad (4000 Gauss)',
        pv: 20,
        amount: 3600,
        paymentMode: 'UPI / Online',
        status: 'Completed',
        dispatchStatus: 'Delivered',
        invoiceDate: '06/08/2026'
      },
      {
        _id: 'sale_2',
        userCode: 'SI681910',
        customerName: 'Suresh Shinde',
        packageName: 'Bio-Magnetic Healthcare Single Bed Pad (4000 Gauss)',
        pv: 20,
        amount: 3600,
        paymentMode: 'Net Banking',
        status: 'Completed',
        dispatchStatus: 'Delivered',
        invoiceDate: '08/08/2026'
      },
      {
        _id: 'sale_3',
        userCode: 'SI681911',
        customerName: 'Ganesh Pawar',
        packageName: 'Bio-Magnetic Healthcare Single Bed Pad (4000 Gauss)',
        pv: 20,
        amount: 3600,
        paymentMode: 'Cash / Franchise Desk',
        status: 'Completed',
        dispatchStatus: 'Delivered',
        invoiceDate: '11/08/2026'
      }
    ];

    // Transactions
    this.data.transactions = [
      {
        _id: 'tx_1',
        userId: mahesh._id,
        memberId: mahesh.memberId,
        type: 'captcha_reward',
        grossAmount: 0.50,
        tdsPercentage: 0,
        tdsAmount: 0,
        adminFeePercentage: 0,
        adminFeeAmount: 0,
        netAmount: 0.50,
        status: 'completed',
        description: 'Daily Captcha Task Reward',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'tx_2',
        userId: mahesh._id,
        memberId: mahesh.memberId,
        type: 'referral_bonus',
        grossAmount: 100.00,
        tdsPercentage: 0,
        tdsAmount: 0,
        adminFeePercentage: 0,
        adminFeeAmount: 0,
        netAmount: 100.00,
        status: 'completed',
        description: 'Left Leg Binary Matching Bonus',
        createdAt: new Date().toISOString()
      }
    ];

    // Site Content
    this.data.siteContent = {
      topBarText: "Welcome to Samarth India Organics & Wellness",
      supportPhone: "+91 98765 43210",
      supportEmail: "contact@samarthindia.online",
      workingHours: "Mon - Sat: 9:00 AM - 6:00 PM",
      officeAddress: "Ganga Shopping Mall, 2nd Floor, Main Agra Road, Dausa, Rajasthan 303303",
      heroBadge: "India's #1 Smart Wellness & Direct Reward Community",
      heroTitle: "Solutions for your business Performance and Productivity",
      heroSubtitle: "Experience advanced Bio-Magnetic healthcare solutions while unlocking daily digital earnings through binary matching and micro-tasks.",
      aboutTitle: "Welcome to the Samarth India",
      aboutDescription: "Samarth India is an emerging provider in wellness, health science, and direct marketing of premium bio-magnetic and healthcare products. We aim to bring high quality life transformation across the global community.",
      missionStatement: "To become the number one organization in India. Make people achieve their dreams through great, unique products and services.",
      products: [
        {
          id: "prod-1",
          name: "Bio-Magnetic Healthcare Mattress Pad (Single & Double)",
          tagline: "Natural Pain Relief & Deep Sleep Therapy (बायो-मैग्नेटिक)",
          price: "₹7,499",
          features: ["Neodymium High-Gauss Magnets", "Orthopedic Memory Foam", "Acupressure Micro-Nodes", "100% Breathable Bamboo Fabric"],
          badge: "Bestseller"
        },
        {
          id: "prod-2",
          name: "Bio-Magnetic Ergonomic Pillow Pad",
          tagline: "Cervical & Neck Pain Relief",
          price: "₹2,499",
          features: ["Targeted Magnetic Alignment", "Anti-Snore Ergonomic Contour", "Washable Antimicrobial Cover"],
          badge: "Popular"
        },
        {
          id: "prod-3",
          name: "Magnetic Resonance Energy Water Wand",
          tagline: "Cellular Hydration & Alkaline Ionization",
          price: "₹1,899",
          features: ["Restores Water Bio-Structure", "Food Grade SS304 Steel", "Instant Magnetized Hydration"],
          badge: "Essential"
        }
      ],
      processSteps: [
        { step: "01", title: "24/7 Support", desc: "Round-the-clock distributor assistance and member helpline." },
        { step: "02", title: "Quick Response", desc: "Instant automated wallet credit for captchas and binary pair matching." },
        { step: "03", title: "Experienced Team", desc: "Over 15+ years excellence in direct selling and ayurvedic wellness." },
        { step: "04", title: "Smart Solutions", desc: "Seamless IMPS/UPI payouts with 100% compliant 5% TDS deduction." }
      ],
      settings: {
        captchaReward: 0.50,
        dailyCaptchaLimit: 50,
        tdsRateWithPan: 5.0,
        tdsRateNoPan: 20.0,
        adminFeeRate: 5.0,
        minWithdrawalAmount: 200
      }
    };
  }
}

export const store = new DataStore();
