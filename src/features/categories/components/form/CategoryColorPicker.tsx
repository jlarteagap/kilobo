// Responsabilidad única: renderizar y manejar selección de color
import { cn } from '@/lib/utils'
import { COLOR_PALETTE } from './constants'

interface CategoryColorPickerProps {
  value:    string
  onChange: (color: string) => void
}

export function CategoryColorPicker({ value, onChange }: CategoryColorPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-[13px] font-medium text-gray-600">Color</label>
      <div className="flex gap-2 flex-wrap">
        {COLOR_PALETTE.map(({ value: color, label }) => (
          <button
            key={color}
            type="button"
            title={label}
            onClick={() => onChange(color)}
            className={cn(
              'w-7 h-7 rounded-full transition-all duration-200',
              'hover:scale-110 focus:outline-none',
              value === color
                ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                : 'ring-1 ring-black/5'
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  )
}