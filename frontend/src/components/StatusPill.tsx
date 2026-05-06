export default function StatusPill({ status }: { status: string }) {
  let styles = "";
  let label = status;

  switch (status) {
    case 'delivered':
      styles = "bg-ok-light text-[#15803D]";
      label = "Delivered";
      break;
    case 'in_transit':
      styles = "bg-accent-light text-accent-dark";
      label = "In Transit";
      break;
    case 'flagged':
      styles = "bg-danger-light text-[#991B1B]";
      label = "Flagged";
      break;
    case 'cancelled':
      styles = "bg-muted text-text-muted";
      label = "Cancelled";
      break;
    case 'pending':
    default:
      styles = "bg-warn-light text-[#B45309]";
      label = "Pending";
      break;
  }

  return (
    <span className={`px-2.5 py-1 rounded-pill text-[11px] font-medium uppercase tracking-wide ${styles}`}>
      {label}
    </span>
  );
}
