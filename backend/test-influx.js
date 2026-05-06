const { InfluxDB } = require('@influxdata/influxdb-client');
require('dotenv').config();

const url = process.env.INFLUX_URL;
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;

const influxDB = new InfluxDB({ url, token });
const queryApi = influxDB.getQueryApi(org);

const fluxQuery = `buckets()`;

queryApi.queryRows(fluxQuery, {
  next(row, tableMeta) {
    const o = tableMeta.toObject(row);
    console.log(`Bucket Name: ${o.name}, ID: ${o.id}`);
  },
  error(error) {
    console.error('Error fetching buckets:', error.message);
  },
  complete() {
    console.log('Finished getting buckets.');
  },
});
