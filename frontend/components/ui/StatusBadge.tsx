interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/ /g, "_");
  return (
    <span className={`badge badge-${normalized}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}