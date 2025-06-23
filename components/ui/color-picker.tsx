'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
  disabled?: boolean
}

const predefinedColors = [
  '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed',
  '#db2777', '#0891b2', '#65a30d', '#ea580c', '#9333ea',
  '#64748b', '#374151', '#1f2937', '#111827', '#ffffff',
  '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8'
]

export function ColorPicker({ value, onChange, className, disabled }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  const handleColorSelect = (color: string) => {
    onChange(color)
    setInputValue(color)
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Valider que c'est une couleur hex valide
    if (/^#[0-9A-F]{6}$/i.test(newValue)) {
      onChange(newValue)
    }
  }

  const handleInputBlur = () => {
    // Si la valeur n'est pas valide, revenir à la valeur précédente
    if (!/^#[0-9A-F]{6}$/i.test(inputValue)) {
      setInputValue(value)
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-10 h-10 p-0 border-2"
            style={{ backgroundColor: value }}
            disabled={disabled}
            aria-label="Sélectionner une couleur"
          >
            <div className="sr-only">Couleur actuelle: {value}</div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Couleurs prédéfinies</label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      'w-8 h-8 rounded border-2 hover:scale-110 transition-transform',
                      value === color ? 'border-black' : 'border-gray-300'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    aria-label={`Sélectionner ${color}`}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Couleur personnalisée</label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="#000000"
                  className="font-mono text-sm"
                  maxLength={7}
                />
                <input
                  type="color"
                  value={value}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                  aria-label="Sélecteur de couleur"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder="#000000"
        className="font-mono text-sm w-24"
        maxLength={7}
        disabled={disabled}
      />
    </div>
  )
} 