import './TagSelect.scss';

import React from 'react';
import { type ActionMeta, type OnChangeValue } from 'react-select';
import AsyncCreatableSelect from 'react-select/async-creatable';

import { TagNamesService } from '../../generated/api/requests';
import type { TagName } from '../../types/types';

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
      loadOptions={(searchTerm) =>
        TagNamesService.tagNamesControllerFindAll(searchTerm || '') as Promise<TagName[]>
      }
      defaultOptions
      autoFocus={true}
      formatOptionLabel={(option: TagName) => option.name}
      placeholder="Tag selection..."
      isClearable
      isMulti
      isSearchable
      onChange={onChange}
    ></AsyncCreatableSelect>
  );
}

export default TagSelectMulti;
