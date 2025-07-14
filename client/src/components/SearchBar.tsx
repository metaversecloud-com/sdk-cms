import { SearchBarProps } from "@context/types";

export const SearchBar = ({ value, onChange, onSearch, isSearching }: SearchBarProps) => (
  <div className="rtsdk-search-bar mb-4">
    <input
      type="text"
      placeholder="Search assets…"
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onSearch()}
    />
    <button className="btn btn-primary ml-2" onClick={onSearch} disabled={isSearching}>
      {isSearching ? "Searching…" : "Search"}
    </button>
  </div>
);
