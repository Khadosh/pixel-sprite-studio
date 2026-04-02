import { CATEGORIES } from '@/lib/types';

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  assetCounts: Record<string, number>;
}

export default function CategoryFilter({
  activeCategory,
  onCategoryChange,
  assetCounts,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => {
        const count = cat.id === 'all'
          ? Object.values(assetCounts).reduce((a, b) => a + b, 0)
          : (assetCounts[cat.id] ?? 0);

        const isActive = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            id={`category-filter-${cat.id}`}
            onClick={() => onCategoryChange(cat.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-pixel rounded border transition-all duration-200 ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(34,197,94,0.25)]'
                : 'bg-secondary text-secondary-foreground border-border hover:border-primary/40 hover:text-foreground'
            }`}
          >
            <span className="text-xs">{cat.icon}</span>
            <span>{cat.label.toUpperCase()}</span>
            <span className={`text-[8px] ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
