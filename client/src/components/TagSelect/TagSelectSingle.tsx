import './TagSelect.css';

import React from 'react';
import AsyncCreatableSelect from 'react-select/async-creatable';
import { tagNamesControllerFindAll } from '../../generated/api/sdk.gen';
import type { TagName } from '../../types/types';

interface TagSelectProps {
  value: TagName | null;
  onChange: (newTagName: TagName | null) => void;
  autoFocus?: boolean;
  className?: string;
}

function TagSelectSingle({ className, value, onChange, autoFocus }: TagSelectProps) {
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
      formatOptionLabel={(option: TagName) => option.title}
      placeholder="Tag selection..."
      isClearable
      isMulti={false}
      isSearchable
      onChange={(newValue) => onChange(newValue)}
      cacheOptions
      defaultOptions
    ></AsyncCreatableSelect>
  );
}

export default TagSelectSingle;
