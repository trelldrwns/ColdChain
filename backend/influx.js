const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const url = process.env.INFLUX_URL;
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;

const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket, 'ns');

const writeTelemetry = (sensorSerial, shipmentId, temperature, battery) => {
  const point = new Point('temperature')
    .tag('sensor_serial', sensorSerial)
    .tag('shipment_id', shipmentId)
    .floatField('value', temperature)
    .floatField('battery_pct', battery)
    .timestamp(new Date());

  writeApi.writePoint(point);
  writeApi.flush().catch(console.error); // Flush immediately for real-time alerting
};

const queryTelemetryHistory = async (shipmentId) => {
  const queryApi = influxDB.getQueryApi(org);
  // Flux query to get temperature data aggregated by 10-minute windows over the last 30 days
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "temperature" and r.shipment_id == "${shipmentId}")
      |> filter(fn: (r) => r._field == "value")
      |> aggregateWindow(every: 10m, fn: mean, createEmpty: false)
      |> yield(name: "mean")
  `;
  
  const result = [];
  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        result.push({ time: o._time, value: o._value, sensor: o.sensor_serial });
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve(result);
      },
    });
  });
};

module.exports = { writeTelemetry, queryTelemetryHistory, influxDB, org, bucket };
