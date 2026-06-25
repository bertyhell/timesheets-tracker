import React from 'react';

import './GlobalSearchBar.css';
import { useAtom } from 'jotai';
import { Search } from 'lucide-react';

import { searchTermAtom } from '../../store/store';

function GlobalSearchBar() {
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);

  return (
    <div className="c-global-search-bar">
      <Search size={14} className="c-global-search-bar__icon" />
      <input
        value={searchTerm}
        onChange={(evt) => setSearchTerm(evt.target.value)}
        placeholder="Search events..."
      />
    </div>
  );
}

export default GlobalSearchBar;
