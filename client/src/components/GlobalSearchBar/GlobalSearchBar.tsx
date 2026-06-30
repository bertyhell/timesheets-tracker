import React from 'react';
import { useAtom } from 'jotai';

import { searchTermAtom } from '../../store/store';
import { SearchInput } from '../SearchInput/SearchInput';

function GlobalSearchBar() {
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);

  return (
    <SearchInput
      value={searchTerm}
      onChange={setSearchTerm}
      placeholder="Search events..."
      className="c-global-search-bar"
    />
  );
}

export default GlobalSearchBar;
