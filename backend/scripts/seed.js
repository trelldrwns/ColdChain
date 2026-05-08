const { query } = require('../db');

async function seed() {
  console.log("Seeding database with Indian logistics and medicines...");
  
  // Clear existing data securely
  await query(`TRUNCATE TABLE shipment_products, shipments, sensors, products, carriers, customers, audit_logs CASCADE`);
  
  // 1. Carriers
  const carriers = [
    { name: 'Blue Dart Cold Chain', email: 'coldchain@bluedart.com', license_no: 'BD-CC-9901' },
    { name: 'Gati Kausar', email: 'support@gatikausar.com', license_no: 'GK-442-IND' },
    { name: 'Safexpress', email: 'b2b@safexpress.com', license_no: 'SFX-880-MH' },
    { name: 'Delhivery Supply Chain', email: 'cold@delhivery.com', license_no: 'DLV-112-KA' }
  ];
  const carrierIds = [];
  for (let c of carriers) {
    const res = await query(`INSERT INTO carriers (name, contact_email, license_no) VALUES ($1, $2, $3) RETURNING id`, [c.name, c.email, c.license_no]);
    carrierIds.push(res.rows[0].id);
  }

  // 2. Customers
  const customers = [
    { name: 'Apollo Hospitals', email: 'procurement@apollo.in' },
    { name: 'Fortis Healthcare', email: 'supply@fortis.in' },
    { name: 'Narayana Health', email: 'logistics@narayana.in' }
  ];
  const customerIds = [];
  for (let c of customers) {
    const res = await query(`INSERT INTO customers (name, contact_email) VALUES ($1, $2) RETURNING id`, [c.name, c.email]);
    customerIds.push(res.rows[0].id);
  }

  // 3. Products (Indian Medicines)
  const products = [
    { name: 'Covaxin (Bharat Biotech)', sku: 'COV-BB-10M', description: 'COVID-19 Inactivated Vaccine', min: 2, max: 8 },
    { name: 'Dolo 650', sku: 'DOLO-650-M', description: 'Paracetamol Tablets', min: 15, max: 30 },
    { name: 'Ecosprin 75', sku: 'ECO-75-USV', description: 'Low dose Aspirin', min: 10, max: 25 },
    { name: 'Huminsulin (Lilly)', sku: 'HUM-INS-40IU', description: 'Insulin Injection', min: 2, max: 8 },
    { name: 'Tetanus Toxoid (SII)', sku: 'TT-SII-0.5', description: 'Tetanus Vaccine', min: 2, max: 8 }
  ];
  const productIds = [];
  for (let p of products) {
    const res = await query(
      `INSERT INTO products (name, sku, description, min_temp_c, max_temp_c) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [p.name, p.sku, p.description, p.min, p.max]
    );
    productIds.push(res.rows[0].id);
  }

  // 4. Sensors
  const sensors = [
    { serial_no: 'SN-BLR-001', model: 'TempLog Pro', battery: 98, active: false },
    { serial_no: 'SN-DEL-042', model: 'CryoTracker', battery: 85, active: false },
    { serial_no: 'SN-MUM-019', model: 'TempLog Basic', battery: 100, active: false },
    { serial_no: 'SN-CHE-088', model: 'TempSense X1', battery: 45, active: false }
  ];
  const sensorIds = [];
  for (let s of sensors) {
    const res = await query(
      `INSERT INTO sensors (serial_no, model, battery_pct, active) VALUES ($1, $2, $3, $4) RETURNING id`,
      [s.serial_no, s.model, s.battery, s.active]
    );
    sensorIds.push(res.rows[0].id);
  }

  // 5. Shipments
  const s1 = await query(
    `INSERT INTO shipments (tracking_no, origin, destination, status, customer_id, carrier_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['TRK-IND-1001', 'Hyderabad Facility (Bharat Biotech)', 'Apollo Hospital, Bangalore', 'in_transit', customerIds[0], carrierIds[0]]
  );
  const s1Id = s1.rows[0].id;

  const s2 = await query(
    `INSERT INTO shipments (tracking_no, origin, destination, status, customer_id, carrier_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['TRK-IND-2099', 'Micro Labs, Bangalore', 'Fortis Healthcare, Mumbai', 'pending', customerIds[1], carrierIds[1]]
  );
  const s2Id = s2.rows[0].id;

  // Link products to shipments
  // S1 has Covaxin
  await query(`INSERT INTO shipment_products (shipment_id, product_id, quantity) VALUES ($1, $2, $3)`, [s1Id, productIds[0], 500]);
  // S2 has Dolo and Huminsulin
  await query(`INSERT INTO shipment_products (shipment_id, product_id, quantity) VALUES ($1, $2, $3)`, [s2Id, productIds[1], 2000]);
  await query(`INSERT INTO shipment_products (shipment_id, product_id, quantity) VALUES ($1, $2, $3)`, [s2Id, productIds[3], 150]);

  // Link sensor to S1
  await query(`UPDATE sensors SET shipment_id = $1, active = true WHERE id = $2`, [s1Id, sensorIds[0]]);

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
