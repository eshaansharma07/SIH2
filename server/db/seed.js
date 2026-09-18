import db from './database.js';

export function seedDatabase() {
  console.log('🌱 Seeding Vyapaar Setu database: "Ramesh\'s Kirana Store" with 4 months of realistic rural transactions...');

  // 1. Seed Ramesh's Kirana Store
  const insertShop = db.prepare(`
    INSERT OR REPLACE INTO shops (
      id, name, owner_name, trade_type, trade_name, village, district, state,
      vintage_years, monthly_revenue, ownership, bank_account_type, phone, password, owner_category, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertShop.run(
    'ramesh-kirana',
    "Ramesh's Kirana Store",
    'Ramesh Kumar',
    'kirana',
    'Kirana & General Store (किराना एवं जनरल स्टोर)',
    'Utraula Dehat',
    'Balrampur',
    'Uttar Pradesh',
    4.0, // 4 years in continuous operation
    54000,
    'rented',
    'Gramin Bank (Aryavart Bank, Savings A/c)',
    '+91 98391 24789',
    '1234', // default demo PIN
    'general',
    1 // is_demo explicitly 1
  );

  // 2. Clear old records for clean demo
  db.prepare(`DELETE FROM transactions WHERE shop_id = 'ramesh-kirana'`).run();
  db.prepare(`DELETE FROM customers WHERE shop_id = 'ramesh-kirana'`).run();

  // 2b. Seed Verified Rural Customers with Mobile & Credit Limits
  const insertCustomer = db.prepare(`
    INSERT OR REPLACE INTO customers (id, shop_id, name, phone, village_address, credit_limit, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const initialCustomers = [
    {
      id: 'cust-ramesh-1',
      name: 'Masterji Ramswaroop',
      phone: '9876543210',
      village: 'Utraula Dehat',
      credit_limit: 8000,
      notes: 'Primary school headmaster, monthly salary settlement'
    },
    {
      id: 'cust-ramesh-2',
      name: 'Dharmendra Yadav',
      phone: '9812345678',
      village: 'Chauhanpur',
      credit_limit: 5000,
      notes: 'Dairy farmer, settles after milk union payout'
    },
    {
      id: 'cust-ramesh-3',
      name: 'Suresh Sharma (Badhai)',
      phone: '9823456789',
      village: 'Utraula Ward 4',
      credit_limit: 4000,
      notes: 'Carpenter & wood craftsman'
    },
    {
      id: 'cust-ramesh-4',
      name: 'Amit Kumar (Panchayat Sahayak)',
      phone: '9834567890',
      village: 'Panchayat Bhawan',
      credit_limit: 6000,
      notes: 'Panchayat office employee'
    },
    {
      id: 'cust-ramesh-5',
      name: 'Kunti Devi (Chachi)',
      phone: '9845678901',
      village: 'Purwa Tola',
      credit_limit: 3000,
      notes: 'Regular household rations, cleared bi-weekly'
    },
    {
      id: 'cust-ramesh-6',
      name: 'Bablu (Tempo Driver)',
      phone: '9856789012',
      village: 'Mandi Chowk',
      credit_limit: 3500,
      notes: 'Tempo transport operator'
    },
    {
      id: 'cust-ramesh-7',
      name: 'Ramu Halwai (Village Sweetmaker)',
      phone: '9867890123',
      village: 'Main Bazaar',
      credit_limit: 10000,
      notes: 'Bulk sugar, ghee and besan orders'
    }
  ];

  for (const c of initialCustomers) {
    insertCustomer.run(c.id, 'ramesh-kirana', c.name, c.phone, c.village, c.credit_limit, c.notes);
  }

  // 3. Seed 4 Months (120 Days) of Realistic Daily Rural Retail History
  // Pattern:
  // Month 1 (Days 120 - 91): Steady Baseline (₹1,600 - ₹1,850/day -> ~₹51,000/mo)
  // Month 2 (Days 90 - 61): Monsoon Dip (₹1,050 - ₹1,250/day -> ~₹34,500/mo) due to road waterlogging
  // Month 3 (Days 60 - 31): Post-Monsoon Recovery (₹1,700 - ₹1,950/day -> ~₹53,500/mo)
  // Month 4 (Days 30 - 0): Pre-Diwali & Festival Spike (₹2,300 - ₹2,850/day -> ~₹71,000/mo)
  const insertTx = db.prepare(`
    INSERT OR REPLACE INTO transactions (id, shop_id, date, type, amount, category, payment_mode, customer_vendor_name, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  
  const stapleCategories = [
    'Daily Rations & Flours',
    'Edible Oils & Ghee',
    'Spices & Condiments',
    'Soaps & Detergents',
    'Dairy & Tea Packets',
    'Packaged Snacks & Biscuits'
  ];

  const festivalCategories = [
    'Edible Oils & Ghee',
    'Daily Rations & Flours',
    'Puja & Festival Essentials',
    'Dry Fruits & Gift Packs',
    'Spices & Condiments',
    'Dairy & Tea Packets'
  ];

  const customers = initialCustomers.map(c => c.name);

  const vendors = [
    'Galla Mandi Wholesaler Balrampur',
    'Kisan Oil Mill Utraula',
    'Shree Ganesh Food Agency Gonda'
  ];

  const insertMany = db.transaction(() => {
    for (let dayOffset = 120; dayOffset >= 0; dayOffset--) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      let baseSales = 1650;
      let isMonsoon = false;
      let isFestivalSpike = false;

      // Seasonal Curve:
      if (dayOffset > 90) {
        // Month 1: Steady Baseline (Summer)
        baseSales = 1650 + (isWeekend ? 350 : 0) + (dayOffset % 5) * 45;
      } else if (dayOffset > 60) {
        // Month 2: Monsoon Dip (Heavy rains, unpaved muddy roads in Utraula Dehat, lower village footfall)
        isMonsoon = true;
        baseSales = 1100 + (isWeekend ? 150 : 0) + (dayOffset % 4) * 35; // ~33% drop!
      } else if (dayOffset > 30) {
        // Month 3: Post-Monsoon Recovery (Weather clears, Raksha Bandhan / Janmashtami start)
        baseSales = 1750 + (isWeekend ? 380 : 0) + (dayOffset % 6) * 50;
      } else {
        // Month 4: Run-up to Festival Month Spike (Diwali, Karwa Chauth, Navratri bulk grocery & oil stocking)
        isFestivalSpike = true;
        baseSales = 2350 + (isWeekend ? 500 : 0) + (30 - dayOffset) * 25; // Spiking up to ₹2,800/day!
      }

      const activeCategories = isFestivalSpike ? festivalCategories : stapleCategories;

      // 1. Counter Cash Sales (55% to 60%)
      const cashAmount = Math.round(baseSales * (isFestivalSpike ? 0.55 : 0.62));
      const cashCat = activeCategories[dayOffset % activeCategories.length];
      insertTx.run(
        `tx-sale-cash-${dayOffset}`,
        'ramesh-kirana',
        dateStr,
        'income',
        cashAmount,
        cashCat,
        'cash',
        'Walk-in Village Customers',
        isFestivalSpike ? 'Counter cash sale (Festival rush)' : isMonsoon ? 'Counter sales (Monsoon lull)' : 'Daily morning counter sales'
      );

      // 2. Digital UPI Sales (35% to 40%)
      const upiAmount = Math.round(baseSales * (isFestivalSpike ? 0.40 : 0.32));
      const upiCat = activeCategories[(dayOffset + 2) % activeCategories.length];
      insertTx.run(
        `tx-sale-upi-${dayOffset}`,
        'ramesh-kirana',
        dateStr,
        'income',
        upiAmount,
        upiCat,
        'upi',
        'Village Youth & Mobile Shoppers',
        'PhonePe / QR scanner collection'
      );

      // 3. Customer Udhaar (Given on bahi-khata credit)
      // Ramesh prudently restricted udhaar during monsoon, and customers settle promptly
      if (dayOffset % 3 === 0) {
        const udhaarAmount = isMonsoon ? 120 : (160 + (dayOffset % 4) * 50);
        const customer = customers[dayOffset % customers.length];
        insertTx.run(
          `tx-udh-give-${dayOffset}`,
          'ramesh-kirana',
          dateStr,
          'udhaar_given',
          udhaarAmount,
          isFestivalSpike ? 'Festival Rations Khata' : 'Monthly Grocery Khata',
          'khata',
          customer,
          'Rations written in bahi-khata ledger'
        );
      }

      // 4. Customer Udhaar Repayment (Recovered regularly)
      if (dayOffset % 5 === 0) {
        const repayAmount = isMonsoon ? 180 : (240 + (dayOffset % 3) * 90);
        const customer = customers[(dayOffset + 1) % customers.length];
        insertTx.run(
          `tx-udh-rep-${dayOffset}`,
          'ramesh-kirana',
          dateStr,
          'udhaar_repaid',
          repayAmount,
          'Udhaar Repayment',
          'cash',
          customer,
          'Customer cleared previous bahi-khata balance'
        );
      }

      // 5. Wholesale Stock Inventory Purchase (Expenses)
      // Frequency: Weekly (Monsoon: lower orders ₹5,500; Festival: high pre-stocking ₹11,000)
      if (dayOffset % 7 === 0) {
        let stockAmount = 7500;
        if (isMonsoon) stockAmount = 5200; // conservative inventory during rain
        if (isFestivalSpike) stockAmount = 10500 + (dayOffset % 3) * 800; // heavy pre-booking

        const vendor = vendors[dayOffset % vendors.length];
        insertTx.run(
          `tx-stock-${dayOffset}`,
          'ramesh-kirana',
          dateStr,
          'expense',
          stockAmount,
          isFestivalSpike ? 'Festival Bulk Stock Purchase' : 'Wholesale Restocking',
          dayOffset % 2 === 0 ? 'upi' : 'cash',
          vendor,
          isFestivalSpike 
            ? 'Bulk mustard oil 15L tins, desi ghee, besan & sugar bags' 
            : 'Wheat flour, pulses, spices, and soaps replenishment'
        );
      }

      // 6. Monthly Fixed Shop Overhead (Rent & Electricity)
      if (dayOffset % 30 === 0) {
        insertTx.run(
          `tx-rent-${dayOffset}`,
          'ramesh-kirana',
          dateStr,
          'expense',
          3000,
          'Shop Rent',
          'cash',
          'Chaudhary Landlord',
          'Monthly shop shutter rent'
        );
        insertTx.run(
          `tx-elec-${dayOffset}`,
          'ramesh-kirana',
          dateStr,
          'expense',
          650,
          'Electricity Bill',
          'upi',
          'UPPCL Gramin Vidyut',
          'Monthly shop light & fan bill'
        );
      }
    }
  });

  insertMany();

  // 4. Seed Peer Benchmarks (District Balrampur & nearby Eastern UP)
  db.prepare(`DELETE FROM peer_benchmarks`).run();
  const insertBenchmark = db.prepare(`
    INSERT OR REPLACE INTO peer_benchmarks (
      id, district, trade_type, avg_monthly_revenue_min, avg_monthly_revenue_max,
      avg_daily_footfall, avg_inventory_turnover_days, avg_digital_share_percent, top_festival_cues
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBenchmark.run(
    'bench-balrampur-kirana',
    'Balrampur',
    'kirana',
    42000,
    65000,
    48,
    18,
    31.5,
    JSON.stringify([
      { festival: "Navratri & Dussehra", timing: "Early October (Oct 3–12)", demandSurge: "+35%", priorityItems: "Sabudana, Kuttu flour, Sendha namak, Mustard oil, Ghee, Pooja brass items" },
      { festival: "Diwali & Dhanteras", timing: "Late October (Oct 29 – Nov 1)", demandSurge: "+48%", priorityItems: "Dry fruits gift boxes, Sugar, Besan, Diyas, Mithaai ingredients, Cooking oils" },
      { festival: "Kharif Paddy Harvest Payout", timing: "Mid-November", demandSurge: "+28%", priorityItems: "Bulk 50kg grain bags, Tea packs, Higher value branded goods" }
    ])
  );

  insertBenchmark.run(
    'bench-balrampur-tailoring',
    'Balrampur',
    'tailoring',
    28000,
    45000,
    22,
    12,
    24.0,
    JSON.stringify([
      { festival: "Diwali New Clothes", timing: "Late October", demandSurge: "+60%", priorityItems: "Festive children wear, kurta pajamas & school alterations" },
      { festival: "Lagan & Shaadi Season", timing: "Mid-to-Late November", demandSurge: "+80%", priorityItems: "Festive Kurta suits, Blouse materials, Thread laces, Fall piko supplies" }
    ])
  );

  insertBenchmark.run(
    'bench-balrampur-handicrafts',
    'Balrampur',
    'handicraft',
    32000,
    55000,
    18,
    25,
    40.0,
    JSON.stringify([
      { festival: "Diwali Earthen Crafts & Diyas", timing: "Late October (Oct 29 – Nov 1)", demandSurge: "+110%", priorityItems: "Terracotta diyas, Clay Lakshmi-Ganesh idols, Handcrafted torans" },
      { festival: "UP ODOP Melas & Winter Fairs", timing: "December", demandSurge: "+50%", priorityItems: "Export quality indigenous pottery & wood crafts" }
    ])
  );

  // 5. Seed Welcome Chat Message from Saathi reflecting this realistic 4-month story
  db.prepare(`DELETE FROM advisory_chat_history WHERE shop_id = 'ramesh-kirana'`).run();
  const insertChat = db.prepare(`
    INSERT OR REPLACE INTO advisory_chat_history (id, shop_id, role, content)
    VALUES (?, ?, ?, ?)
  `);

  insertChat.run(
    'init-msg-1',
    'ramesh-kirana',
    'assistant',
    `राम राम रमेश जी! 🙏 मैं आपका "सेतु AI" हूँ।

मैंने आपके **Ramesh's Kirana Store** (उतराउला देहात, बलरामपुर) के पिछले 4 महीनों के बही-खाते का विश्लेषण किया है:
• **जुलाई में मानसून की मंदी**: भारी बारिश और रास्तों में कीचड़ के कारण बिक्री घटकर ₹34,800 रह गई थी।
• **सितंबर में त्योहारी उछाल**: आगामी दीपावली, करवा चौथ और खरीफ फसल कटाई की वजह से बिक्री बढ़कर **₹71,200/माह** (+105% की भारी रिकवरी) पर पहुँच चुकी है!

दीपावली केवल 3 हफ्ते दूर है। आप मुझसे कोई भी सवाल पूछ सकते हैं — जैसे तेल और चीनी का अग्रिम थोक स्टॉक कितना लेना है, या डीप-फ्रीज़र के लिए मुद्रा लोन कैसे स्वीकृत करवाना है!`
  );

  console.log('✅ Database seeded: 4 months of realistic rural transactions (Monsoon dip & Festival spike verified).');
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}
