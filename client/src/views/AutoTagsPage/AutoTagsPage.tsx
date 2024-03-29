import './AutoTagsPage.scss';
import { NavLink, Outlet } from 'react-router-dom';
import {
  useAutoTagsServiceAutoTagsControllerDelete,
  useAutoTagsServiceAutoTagsControllerFindAll,
} from '../../generated/api/queries';
import React, { ReactNode } from 'react';
import { sortBy } from 'lodash-es';
import { ROUTE_PARTS } from '../../App';
import { toast } from 'react-toastify';
import { AutoTag } from '../../types/types';

interface AutoTagsPageProps {}

function AutoTagsPage({}: AutoTagsPageProps) {
  const { data: autoTagItems, refetch: refetchAutoTags } =
    useAutoTagsServiceAutoTagsControllerFindAll({
      term: '',
    });
  const autoTags = autoTagItems as AutoTag[];
  const { mutateAsync: deleteAutoTag } = useAutoTagsServiceAutoTagsControllerDelete();

  return (
    <div>
      <NavLink className="c-button" to={'/' + ROUTE_PARTS.autoTagRules + '/' + ROUTE_PARTS.create}>
        Add auto tag
      </NavLink>

      <ul>
        {sortBy(autoTags || [], (autoTag) => autoTag.priority).map(
          (autoTag): ReactNode => (
            <li className="c-row" key={'auto-tag-' + autoTag.id}>
              <span
                className="w-16 h-16 ml-2"
                style={{ backgroundColor: autoTag.tagName?.color }}
              ></span>
              <span className="flex-grow">
                {autoTag.priority} {autoTag.name}{' '}
              </span>
              <NavLink
                className="c-button"
                to={'/' + ROUTE_PARTS.autoTagRules + '/' + autoTag.id + '/' + ROUTE_PARTS.edit}
              >
                EDIT
              </NavLink>
              <button
                className="c-button"
                onClick={async () => {
                  if (autoTag.id) {
                    await deleteAutoTag({
                      id: autoTag.id,
                    });
                    await refetchAutoTags();
                    toast('Auto tag has been deleted', { type: 'success' });
                  } else {
                    toast("Cannot delete an auto tag since it doesn't have an id", {
                      type: 'error',
                    });
                  }
                }}
              >
                DELETE
              </button>
            </li>
          )
        )}
      </ul>

      <Outlet />
    </div>
  );
}

export default AutoTagsPage;
