import React from 'react';

interface FilterSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    label?: string;
    className?: string;
}

const FilterSelect: React.FC<FilterSelectProps> = ({ value, onChange, options, label, className }) => {
    return (
        <div className={className}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default FilterSelect; 