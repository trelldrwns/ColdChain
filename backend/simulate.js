const axios = require('axios');
const { query } = require('./db');
require('dotenv').config();

const API_URL = 'https://cold-chain-livid.vercel.app/api/v1/telemetry/ingest';
const HARDWARE_API_KEY = process.env.HARDWARE_API_KEY || 'cc-hw-sk-9942a1';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function simulate() {
  console.log('Starting Dynamic Telemetry Simulation...');
  console.log('Sending pings to http://localhost:3001/api/v1/telemetry/ingest\n');

  let tick = 0;
  // Local state to keep track of simulated batteries
  const batteries = {};

  while (true) {
    try {
      // Fetch currently active sensors from DB
      const result = await query(`SELECT serial_no, battery_pct FROM sensors WHERE active = true`);
      const activeSensors = result.rows;

      if (activeSensors.length === 0) {
        console.log(`[${new Date().toISOString()}] No active sensors found. Waiting...`);
      }

      for (const sensor of activeSensors) {
        // Initialize battery state if not present
        if (batteries[sensor.serial_no] === undefined) {
          batteries[sensor.serial_no] = sensor.battery_pct;
        }

        // Simulate slight temperature fluctuations (+/- 1 degree around 5°C)
        let baseTemp = 5.0;
        let tempVariation = (Math.random() * 2 - 1);

        // Every ~60 ticks, create a spike for testing anomaly detection
        if (tick > 0 && tick % 60 === 0) {
          tempVariation += 12; // Spike to ~17°C
        }

        // Slightly drain battery locally
        batteries[sensor.serial_no] = Math.max(0, batteries[sensor.serial_no] - 0.1);

        const payload = {
          serial_no: sensor.serial_no,
          temperature: parseFloat((baseTemp + tempVariation).toFixed(2)),
          battery_pct: parseFloat(batteries[sensor.serial_no].toFixed(1))
        };

        try {
          const res = await axios.post(API_URL, payload, {
            headers: {
              'X-Hardware-Token': HARDWARE_API_KEY
            }
          });
          const eventText = res.data.event === 'normal'
            ? '✅ Normal'
            : `❌ ${res.data.event.toUpperCase()}`;

          console.log(`[${new Date().toISOString()}] ${payload.serial_no} | Temp: ${payload.temperature}°C | Bat: ${payload.battery_pct}% -> ${eventText}`);
        } catch (err) {
          if (err.code === 'ECONNREFUSED') {
            console.error(`❌ Failed to send ping: Backend server at ${API_URL} is offline! Please start it using 'npm run dev'.`);
          } else {
            console.error(`❌ Failed to send ping for ${payload.serial_no}:`, err.response?.data || err.message);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching active sensors:', err.message);
    }

    tick++;
    await sleep(3000); // Ping every 3 seconds
  }
}

simulate();
