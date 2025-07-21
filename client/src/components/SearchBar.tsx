import { SearchBarProps } from "@context/types";

export const SearchBar = ({ value, onChange, onSearch }: SearchBarProps) => (
  <div className="rtsdk-search-bar mb-4">
    <input
      type="text"
      placeholder="Search by unique name..."
      className="input"
      value={value}
      onChange={(e) => {
        const newValue = e.target.value;
        onChange(newValue);
        onSearch(newValue);
      }}
    />
  </div>
);
