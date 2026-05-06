const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3001/api/v1/telemetry/ingest';
const HARDWARE_API_KEY = process.env.HARDWARE_API_KEY || 'cc-hw-sk-9942a1';

// Simulated sensors from our seed data
const sensors = [
  { serial_no: 'SN-A9X2B', baseTemp: 4.0, battery: 92.5 },
  { serial_no: 'SN-B8Y3C', baseTemp: 4.0, battery: 15.0 }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function simulate() {
  console.log('Starting Telemetry Simulation...');
  console.log('Sending pings to http://localhost:3001/api/v1/telemetry/ingest\n');

  let tick = 0;

  while (true) {
    for (const sensor of sensors) {
      // Simulate slight temperature fluctuations (+/- 0.5 degrees)
      let tempVariation = (Math.random() - 0.5);
      
      // Every ~10 ticks, create a massive spike to trigger a "hard excursion"
      if (tick > 0 && tick % 10 === 0 && sensor.serial_no === 'SN-B8Y3C') {
        tempVariation += 10; // Spikes to 14°C (vaccines die above 8°C)
      }

      // Slightly drain battery
      sensor.battery = Math.max(0, sensor.battery - 0.1);

      const payload = {
        serial_no: sensor.serial_no,
        temperature: parseFloat((sensor.baseTemp + tempVariation).toFixed(2)),
        battery_pct: parseFloat(sensor.battery.toFixed(1))
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
        console.error(`Failed to send ping for ${payload.serial_no}:`, err.response?.data || err.message);
      }
    }
    
    tick++;
    await sleep(2000); // Ping every 2 seconds
  }
}

simulate();
