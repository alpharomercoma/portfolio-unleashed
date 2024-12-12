import { FaSearch } from "react-icons/fa";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function SearchBar({ searchTerm, onSearchChange }: SearchBarProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="relative w-full max-w-md">
        <input
          type="text"
          placeholder="Search certifications..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full py-2 px-4 pr-10 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow duration-200"
        />
        <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
      </div>
    </div>
  )
}
