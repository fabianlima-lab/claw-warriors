import { CLASS_HEX } from '@/lib/constants';

export default function SectionLabel({ children, warriorClass, className = '' }) {
  const color = warriorClass ? CLASS_HEX[warriorClass] : '#4A9EFF';
  return (
    <span
      className={`text-xs uppercase tracking-widest font-medium ${className}`}
      style={{ color }}
    >
      {children}
    </span>
  );
}
