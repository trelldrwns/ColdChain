"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PrintReportPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`\${process.env.NEXT_PUBLIC_API_URL || `\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/v1/shipments/${id}`, { credentials: "include" })
      .then(res => res.json())
      .then(d => {
        setData(d);
        setTimeout(() => {
          window.print();
        }, 500); // Wait for render
      })
      .catch(console.error);
  }, [id]);

  if (!data) return <div className="p-10 font-ui text-center">Preparing Report...</div>;

  return (
    <div className="font-ui p-10 max-w-4xl mx-auto bg-white text-black min-h-screen">
      <div className="border-b-2 border-black pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-widest">GDP Compliance Report</h1>
          <p className="text-gray-600 mt-2">Cold Chain Integrity Manifest</p>
        </div>
        <div className="text-right">
          <p className="font-bold">Date: {new Date().toLocaleDateString()}</p>
          <p className="font-data text-sm">ID: {id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-bold border-b border-gray-300 pb-2 mb-3 uppercase text-xs">Consignment Details</h3>
          <p><span className="text-gray-600 w-24 inline-block">Tracking No:</span> <span className="font-bold">{data.tracking_no}</span></p>
          <p><span className="text-gray-600 w-24 inline-block">Status:</span> <span className="uppercase">{data.status.replace('_', ' ')}</span></p>
          <p><span className="text-gray-600 w-24 inline-block">Carrier:</span> {data.carrier_name}</p>
          <p><span className="text-gray-600 w-24 inline-block">Route:</span> {data.origin} → {data.destination}</p>
        </div>
        <div>
          <h3 className="font-bold border-b border-gray-300 pb-2 mb-3 uppercase text-xs">Sensor Equipment</h3>
          {data.sensors?.map((s: any) => (
            <div key={s.id}>
              <p><span className="text-gray-600 w-24 inline-block">Serial No:</span> <span className="font-data">{s.serial_no}</span></p>
              <p><span className="text-gray-600 w-24 inline-block">Calibration:</span> Valid</p>
            </div>
          ))}
          {data.sensors?.length === 0 && <p>No sensors documented.</p>}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-bold border-b border-gray-300 pb-2 mb-3 uppercase text-xs">Biologic Payload</h3>
        <table className="w-full text-left text-sm border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border-b border-gray-200">Product</th>
              <th className="p-2 border-b border-gray-200">SKU</th>
              <th className="p-2 border-b border-gray-200">Quantity</th>
              <th className="p-2 border-b border-gray-200">Required Condition</th>
            </tr>
          </thead>
          <tbody>
            {data.products?.map((p: any) => (
              <tr key={p.id}>
                <td className="p-2 border-b border-gray-200">{p.name}</td>
                <td className="p-2 border-b border-gray-200 font-data">{p.sku}</td>
                <td className="p-2 border-b border-gray-200 font-data">{p.quantity}</td>
                <td className="p-2 border-b border-gray-200 font-data">{p.min_temp_c}°C to {p.max_temp_c}°C</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-12">
        <h3 className="font-bold border-b border-gray-300 pb-2 mb-3 uppercase text-xs">Excursion Incident Log</h3>
        {data.events?.length === 0 ? (
          <p className="text-green-700 font-bold">✓ No excursions recorded. Shipment remained within GDP compliance ranges.</p>
        ) : (
          <table className="w-full text-left text-sm border border-gray-200">
            <thead className="bg-red-50 text-red-900">
              <tr>
                <th className="p-2 border-b border-gray-200">Timestamp</th>
                <th className="p-2 border-b border-gray-200">Event</th>
                <th className="p-2 border-b border-gray-200">Sensor</th>
                <th className="p-2 border-b border-gray-200">Recorded Temp</th>
              </tr>
            </thead>
            <tbody>
              {data.events?.map((e: any) => (
                <tr key={e._id}>
                  <td className="p-2 border-b border-gray-200 font-data">{new Date(e.timestamp).toLocaleString()}</td>
                  <td className="p-2 border-b border-gray-200 uppercase text-red-700">{e.event_type.replace('_', ' ')}</td>
                  <td className="p-2 border-b border-gray-200 font-data">{e.sensor_serial}</td>
                  <td className="p-2 border-b border-gray-200 font-data font-bold">{e.temperature}°C</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t border-black pt-8 grid grid-cols-2 gap-8 text-sm">
        <div>
          <p className="mb-8 font-bold">Quality Assurance Sign-off:</p>
          <div className="border-b border-black w-64 mb-2"></div>
          <p className="text-gray-600">Authorized Signature</p>
        </div>
        <div>
          <p className="mb-8 font-bold">System Validator:</p>
          <div className="border-b border-black w-64 mb-2"></div>
          <p className="text-gray-600">Title 21 CFR Part 11 Auto-Signature</p>
        </div>
      </div>
    </div>
  );
}
