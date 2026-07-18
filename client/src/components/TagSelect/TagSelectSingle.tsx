import './TagSelect.css';

import React from 'react';
import AsyncCreatableSelect from 'react-select/async-creatable';
import { tagNamesControllerFindAll } from '../../generated/api/sdk.gen';
import type { TagName } from '../../types/types';
import { tagSelectStyles } from './tagSelectStyles';

interface TagSelectProps {
  value: TagName | null;
  onChange: (newTagName: TagName | null) => void | Promise<void>;
  onCreateOption?: (newTagName: string) => void;
  autoFocus?: boolean;
  className?: string;
}

function TagSelectSingle({ className, value, onChange, onCreateOption, autoFocus }: TagSelectProps) {
  return (
    <AsyncCreatableSelect
      className={'c-tag-input ' + className}
      value={value}
      getOptionValue={(value) => value.id}
      loadOptions={async (searchTerm) => {
        const { data } = await tagNamesControllerFindAll({ query: { term: searchTerm || '' } });
        return (data || []) as TagName[];
      }}
      autoFocus={autoFocus ?? false}
      getOptionLabel={(option) => option.title}
      formatOptionLabel={(option) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!option.__isNew__ && option.color && (
            <span
              style={{
                display: 'block',
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                backgroundColor: option.color,
                flexShrink: 0,
              }}
            />
          )}
          {option.title}
        </span>
      )}
      getNewOptionData={(inputValue) =>
        ({ title: inputValue, value: inputValue, __isNew__: true }) as unknown as TagName
      }
      formatCreateLabel={(inputValue) => `create tag: "${inputValue}"`}
      placeholder="Tag selection..."
      isClearable
      isMulti={false}
      isSearchable
      onChange={(newValue) => onChange(newValue)}
      onCreateOption={onCreateOption ? (newValue) => onCreateOption(newValue) : undefined}
      cacheOptions
      defaultOptions
      styles={tagSelectStyles}
      menuPortalTarget={document.body}
      menuPosition="fixed"
    ></AsyncCreatableSelect>
  );
}

export default TagSelectSingle;
