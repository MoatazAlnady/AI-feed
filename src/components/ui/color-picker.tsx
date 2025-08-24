import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

// Convert HSV to RGB
const hsvToRgb = (h: number, s: number, v: number) => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  
  let r: number, g: number, b: number;
  
  if (h >= 0 && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
};

// Convert RGB to HSV
const rgbToHsv = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
  }
  h = (h * 60 + 360) % 360;
  
  const s = max === 0 ? 0 : diff / max;
  const v = max;
  
  return [h, s, v];
};

// Convert hex to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ]
    : [0, 0, 0];
};

// Convert RGB to hex
const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
};

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, className }) => {
  const [open, setOpen] = useState(false);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [hexInput, setHexInput] = useState(value || '#3b82f6');
  
  const spectrumRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const brightnessRef = useRef<HTMLDivElement>(null);

  // Initialize HSV values from hex color
  useEffect(() => {
    if (value) {
      const [r, g, b] = hexToRgb(value);
      const [h, s, v] = rgbToHsv(r, g, b);
      setHue(h);
      setSaturation(s);
      setBrightness(v);
      setHexInput(value);
    }
  }, [value]);

  // Update color when HSV changes
  useEffect(() => {
    const [r, g, b] = hsvToRgb(hue, saturation, brightness);
    const hex = rgbToHex(r, g, b);
    setHexInput(hex);
  }, [hue, saturation, brightness]);

  const handleSpectrumClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!spectrumRef.current) return;
    
    const rect = spectrumRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newSaturation = Math.max(0, Math.min(1, x / rect.width));
    const newBrightness = Math.max(0, Math.min(1, 1 - (y / rect.height)));
    
    setSaturation(newSaturation);
    setBrightness(newBrightness);
  };

  const handleHueClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hueRef.current) return;
    
    const rect = hueRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newHue = Math.max(0, Math.min(360, (x / rect.width) * 360));
    
    setHue(newHue);
  };

  const handleBrightnessClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!brightnessRef.current) return;
    
    const rect = brightnessRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newBrightness = Math.max(0, Math.min(1, x / rect.width));
    
    setBrightness(newBrightness);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setHexInput(hex);
    
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      const [r, g, b] = hexToRgb(hex);
      const [h, s, v] = rgbToHsv(r, g, b);
      setHue(h);
      setSaturation(s);
      setBrightness(v);
    }
  };

  const handleApply = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(hexInput)) {
      onChange(hexInput);
      setOpen(false);
    }
  };

  const spectrumStyle = {
    background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`
  };

  const hueStyle = {
    background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
  };

  const brightnessStyle = {
    background: `linear-gradient(to right, #000, hsl(${hue}, ${saturation * 100}%, 50%))`
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border border-gray-300"
              style={{ backgroundColor: value || '#3b82f6' }}
            />
            {value || 'Select color'}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          {/* Main color spectrum */}
          <div className="relative">
            <div
              ref={spectrumRef}
              className="w-full h-40 border border-gray-200 rounded cursor-pointer relative"
              style={spectrumStyle}
              onClick={handleSpectrumClick}
            >
              {/* Color picker indicator */}
              <div
                className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md pointer-events-none transform -translate-x-2 -translate-y-2"
                style={{
                  left: `${saturation * 100}%`,
                  top: `${(1 - brightness) * 100}%`,
                  backgroundColor: hexInput
                }}
              />
            </div>
          </div>

          {/* Hue slider */}
          <div className="relative">
            <div
              ref={hueRef}
              className="w-full h-4 border border-gray-200 rounded cursor-pointer relative"
              style={hueStyle}
              onClick={handleHueClick}
            >
              <div
                className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md pointer-events-none transform -translate-x-2 -translate-y-0"
                style={{
                  left: `${(hue / 360) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Brightness slider */}
          <div className="relative">
            <div
              ref={brightnessRef}
              className="w-full h-4 border border-gray-200 rounded cursor-pointer relative"
              style={brightnessStyle}
              onClick={handleBrightnessClick}
            >
              <div
                className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md pointer-events-none transform -translate-x-2 -translate-y-0"
                style={{
                  left: `${brightness * 100}%`
                }}
              />
            </div>
          </div>

          {/* Hex input */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 border border-gray-200 rounded"
              style={{ backgroundColor: hexInput }}
            />
            <Input
              value={hexInput}
              onChange={handleHexChange}
              placeholder="#000000"
              className="flex-1"
            />
            <Button onClick={handleApply} size="sm">
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorPicker;