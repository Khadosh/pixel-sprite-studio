import { Plus, X } from 'lucide-react';

interface PaletteBarProps {
  palette: Record<number, string>;
  colorNames: Record<number, string>;
  activeColorKey: number;
  onSelectColor: (key: number) => void;
  onChangeColor: (key: number, color: string) => void;
  onAddColor?: () => void;
  onRemoveColor?: (key: number) => void;
}

export default function PaletteBar({
  palette,
  colorNames,
  activeColorKey,
  onSelectColor,
  onChangeColor,
  onAddColor,
  onRemoveColor,
}: PaletteBarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-end">
      {Object.entries(palette)
        .filter(([k]) => k !== '0')
        .map(([key, color]) => {
          const k = Number(key);
          const isActive = k === activeColorKey;
          return (
            <div key={key} className="group flex flex-col items-center gap-1 relative">
              <button
                onClick={() => onSelectColor(k)}
                className={`relative w-8 h-8 rounded-sm border-2 transition-all ${
                  isActive
                    ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                    : 'border-border hover:border-muted-foreground'
                }`}
                style={{ backgroundColor: color }}
                title={colorNames[k] || `Color ${key}`}
              />
              {onRemoveColor && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemoveColor(k); }}
                  className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
                  title="Remove color"
                >
                  <X size={10} />
                </button>
              )}
              <label className="relative cursor-pointer">
                <span className="text-[8px] font-mono text-muted-foreground hover:text-foreground transition-colors">
                  {colorNames[k] || key}
                </span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => onChangeColor(k, e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </label>
            </div>
          );
        })}
      {onAddColor && (
        <button
          onClick={onAddColor}
          className="w-8 h-8 rounded-sm border-2 border-dashed border-border hover:border-purple-500 text-muted-foreground hover:text-purple-400 flex items-center justify-center transition-all"
          title="Agregar color"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
}
