import { ChangeEvent } from 'react';

export type FilterOption = 'all' | 'active' | 'starred' | 'archived';

interface FilterDropdownProps {
  value: FilterOption;
  onChange: (value: FilterOption) => void;
  className?: string;
}

const FILTER_LABELS: Record<FilterOption, string> = {
  all: 'All',
  active: 'Active',
  starred: 'Starred',
  archived: 'Archived',
};

/**
 * Filter dropdown for canvas and thread lists.
 * Options: All, Active, Starred, Archived
 */
export function FilterDropdown({ value, onChange, className = '' }: FilterDropdownProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as FilterOption);
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      className={`filter-dropdown ${className}`}
    >
      {Object.entries(FILTER_LABELS).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}
