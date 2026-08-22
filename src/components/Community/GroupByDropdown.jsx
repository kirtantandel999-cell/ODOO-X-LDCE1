import React from 'react';
import { Layers } from 'lucide-react';

export default function GroupByDropdown({ value, onChange }) {
  const options = [
    { label: 'Group By', value: 'none' },
    { label: 'Destination', value: 'Destination' },
    { label: 'Trip Type', value: 'Trip Type' },
    { label: 'Activity', value: 'Activity' },
    { label: 'User', value: 'User' },
    { label: 'Date', value: 'Date' }
  ];

  return (
    <div className="gt-control-select-wrapper">
      <Layers size={16} className="gt-control-icon" />
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="gt-control-select"
        title="Group community posts by attribute"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
