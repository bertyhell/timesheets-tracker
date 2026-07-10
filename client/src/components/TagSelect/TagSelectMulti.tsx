import './TagSelect.css';

import React from 'react';
import { type ActionMeta, type OnChangeValue } from 'react-select';
import AsyncCreatableSelect from 'react-select/async-creatable';

import { tagNamesControllerFindAll } from '../../generated/api/sdk.gen';
import type { TagName } from '../../types/types';
import { tagSelectStyles } from './tagSelectStyles';

interface TagSelectProps {
  className?: string;
  selectedValues?: TagName[];
  onChange: (
    option: OnChangeValue<TagName, true> | { label: string; value: string }[],
    actionMeta: ActionMeta<TagName>
  ) => void;
}

function TagSelectMulti({ className, selectedValues, onChange }: TagSelectProps) {
  return (
    <AsyncCreatableSelect
      className={'c-tag-select ' + className}
      value={selectedValues}
      loadOptions={async (searchTerm) => {
        const { data } = await tagNamesControllerFindAll({ query: { term: searchTerm || '' } });
        return (data || []) as TagName[];
      }}
      defaultOptions
      autoFocus={true}
      getOptionValue={(option: TagName) => option.id}
      formatOptionLabel={(option: TagName) => option.title}
      placeholder="Tag selection..."
      isClearable
      isMulti
      isSearchable
      onChange={onChange}
      styles={tagSelectStyles}
      menuPortalTarget={document.body}
      menuPosition="fixed"
    ></AsyncCreatableSelect>
  );
}

export default TagSelectMulti;
