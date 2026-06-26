import type { StylesConfig } from 'react-select';

const PRIMARY = '#7c3aed';
const PRIMARY_LIGHT = '#ede9fe';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tagSelectStyles: StylesConfig<any, any> = {
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? PRIMARY : state.isFocused ? PRIMARY_LIGHT : base.backgroundColor,
    color: state.isSelected ? '#ffffff' : base.color,
    ':active': {
      backgroundColor: PRIMARY,
      color: '#ffffff',
    },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: PRIMARY_LIGHT,
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: PRIMARY,
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: PRIMARY,
    ':hover': {
      backgroundColor: PRIMARY,
      color: '#ffffff',
    },
  }),
};
