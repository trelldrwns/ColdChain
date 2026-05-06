require('dotenv').config();
const { pool } = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
  console.log('Starting seed process...');
  
  try {
    // 1. Users
    const passwordHash = await bcrypt.hash('password123', 10);
    const users = [
      { email: 'admin@coldchain.com', name: 'Admin User', role: 'admin' },
      { email: 'logistics@coldchain.com', name: 'Logistics Officer', role: 'logistics_officer' },
      { email: 'auditor@coldchain.com', name: 'Quality Auditor', role: 'quality_auditor' },
      { email: 'carrier@coldchain.com', name: 'Carrier Rep', role: 'carrier' },
      { email: 'customer@coldchain.com', name: 'Customer Rep', role: 'customer' }
    ];

    for (const user of users) {
      await pool.query(
        `INSERT INTO users (email, name, role, password_hash) 
         VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
        [user.email, user.name, user.role, passwordHash]
      );
    }
    
    // 2. Customers
    const customerResult = await pool.query(`
      INSERT INTO customers (name, contact_email, address) 
      VALUES ('PharmaCorp Inc.', 'contact@pharmacorp.com', '123 Pharma Way')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    
    // Fallback if it already exists (no unique constraint to conflict on, but just in case)
    const customerIdRes = await pool.query(`SELECT id FROM customers LIMIT 1`);
    const customerId = customerResult.rows[0]?.id || customerIdRes.rows[0].id;

    // 3. Carriers
    const carrierResult = await pool.query(`
      INSERT INTO carriers (name, contact_email, license_no) 
      VALUES ('Global Freight', 'dispatch@globalfreight.com', 'GF-998877')
      ON CONFLICT (license_no) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const carrierId = carrierResult.rows[0].id;
    
    // Get an admin user ID for assignments
    const adminUser = await pool.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
    const adminId = adminUser.rows[0].id;

    // 4. Products
    const productResults = await pool.query(`
      INSERT INTO products (name, sku, min_temp_c, max_temp_c, description) VALUES
      ('Insulin Glargine', 'INS-001', 2.0, 8.0, 'Refrigerated insulin pens'),
      ('Live Attenuated Vaccine', 'VAC-102', 2.0, 8.0, 'Cold chain required vaccine'),
      ('Monoclonal Antibodies', 'MAB-304', 2.0, 8.0, 'Biological therapy')
      ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    // If it updated them, we get IDs. If not, just fetch them.
    const productIdsRes = await pool.query(`SELECT id FROM products`);
    const productIds = productIdsRes.rows.map(r => r.id);

    // 5. Shipments
    const shipmentResult = await pool.query(`
      INSERT INTO shipments (tracking_no, customer_id, carrier_id, assigned_user_id, status, origin, destination) 
      VALUES ('TRK-10001', $1, $2, $3, 'in_transit', 'New York, NY', 'Los Angeles, CA')
      ON CONFLICT (tracking_no) DO UPDATE SET status = EXCLUDED.status
      RETURNING id
    `, [customerId, carrierId, adminId]);
    const shipmentId = shipmentResult.rows[0].id;

    // Shipment Products
    await pool.query(`
      INSERT INTO shipment_products (shipment_id, product_id, quantity) 
      VALUES ($1, $2, 500), ($1, $3, 200)
      ON CONFLICT DO NOTHING
    `, [shipmentId, productIds[0], productIds[1]]);

    // 6. Sensors
    await pool.query(`
      INSERT INTO sensors (shipment_id, serial_no, model, battery_pct, active) 
      VALUES 
      ($1, 'SN-A9X2B', 'TempLog Pro', 92.5, true),
      ($1, 'SN-B8Y3C', 'TempLog Basic', 15.0, true)
      ON CONFLICT (serial_no) DO NOTHING
    `, [shipmentId]);

    console.log('Seeding completed successfully.');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    pool.end();
  }
}

seed();
