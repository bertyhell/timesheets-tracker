import React from 'react';

import './GlobalSearchBar.scss';
import { useAtom } from 'jotai';

import { searchTermAtom } from '../../store/store';

// interface GlobalSearchBarProps {}

function GlobalSearchBar() {
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);

  // useEffect(() => {
  //   document.onkeydown = function (evt) {
  //     evt = evt || window.event;
  //     if (evt.ctrlKey && evt.keyCode == 90) {
  //       alert('Ctrl-Z');
  //     }
  //   };
  // }, []);

  return (
    <div className="c-global-search-bar">
      <input
        value={searchTerm}
        onChange={(evt) => setSearchTerm(evt.target.value)}
        placeholder="Search"
      />
    </div>
  );
}

export default GlobalSearchBar;
