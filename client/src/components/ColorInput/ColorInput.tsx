import React from 'react';
import { HexColorPicker } from 'react-colorful';
import { COLOR_LIST } from '../../views/TimelinesPage/TimelinesPage.consts';

import './ColorInput.scss';

interface ColorInputProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorInput({ color, onChange }: ColorInputProps) {
  return (
    <div className="c-color-input">
      <HexColorPicker color={color} onChange={onChange} />
      <div className="c-color-input__swatches">
        {COLOR_LIST.map((presetColor) => (
          <button
            key={presetColor}
            className="c-color-input__swatch"
            style={{ background: presetColor }}
            onClick={() => onChange(presetColor)}
          />
        ))}
      </div>
    </div>
  );
}
