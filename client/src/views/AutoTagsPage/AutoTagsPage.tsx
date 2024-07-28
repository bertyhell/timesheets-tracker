import './AutoTagsPage.scss';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  useAutoTagsServiceAutoTagsControllerCreate,
  useAutoTagsServiceAutoTagsControllerDelete,
  useAutoTagsServiceAutoTagsControllerFindAll,
} from '../../generated/api/queries';
import React, { type ReactNode, useCallback, useEffect } from 'react';
import { sortBy } from 'lodash-es';
import { ROUTE_PARTS } from '../../App';
import { toast } from 'react-toastify';
import { type AutoTag } from '../../types/types';
import copy from 'copy-to-clipboard';
import { mapLimit } from 'blend-promise-utils';
import { type AutoTagConditionDto } from '../../generated/api/requests';

const AUTOTAGS_PROPERTY_NAME = 'timesheetTrackerAutoTags';

// interface AutoTagsPageProps {}

function AutoTagsPage() {
  const location = useLocation();
  const { data: autoTagItems, refetch: refetchAutoTags } =
    useAutoTagsServiceAutoTagsControllerFindAll({
      term: '',
    });
  const { mutateAsync: insertAutoTag } = useAutoTagsServiceAutoTagsControllerCreate();
  const autoTags = autoTagItems as AutoTag[];
  const { mutateAsync: deleteAutoTag } = useAutoTagsServiceAutoTagsControllerDelete();

  useEffect(() => {
    refetchAutoTags();
  }, [location]);

  const handlePasteAutoTags = async (pastedAutoTags: AutoTag[]) => {
    await mapLimit(pastedAutoTags, 5, async (pastedAutoTag: AutoTag) => {
      return await insertAutoTag({
        requestBody: {
          name: pastedAutoTag.name,
          priority: pastedAutoTag.priority,
          tagNameId: pastedAutoTag.tagNameId,
          conditions: pastedAutoTag.conditions as AutoTagConditionDto[],
        },
      });
    });
    await refetchAutoTags();
    toast(pastedAutoTags.length + ' auto tags were added');
  };

  const onPasteContent = useCallback(
    async (evt: ClipboardEvent) => {
      try {
        if (evt.clipboardData && evt.clipboardData.getData) {
          const pastedText = evt.clipboardData.getData('text/plain');

          if (pastedText.includes(AUTOTAGS_PROPERTY_NAME)) {
            await handlePasteAutoTags(JSON.parse(pastedText)[AUTOTAGS_PROPERTY_NAME]);
          } else {
            toast("The pasted text doesn't contain any valid auto tags", { type: 'error' });
          }
        }
      } catch (err) {
        toast("The pasted text doesn't contain any valid auto tags", { type: 'error' });
      }
    },
    [handlePasteAutoTags]
  );

  useEffect(() => {
    document.body.addEventListener('paste', onPasteContent);

    return () => {
      document.body.removeEventListener('paste', onPasteContent);
    };
  }, [onPasteContent]);

  const copyAutoTagsToClipboard = () => {
    copy(JSON.stringify({ [AUTOTAGS_PROPERTY_NAME]: autoTagItems }, null, 2));
    toast('Auto tag copied to clipboard', { type: 'success' });
  };

  return (
    <div>
      <NavLink className="c-button" to={'/' + ROUTE_PARTS.autoTagRules + '/' + ROUTE_PARTS.create}>
        Add auto tag
      </NavLink>
      <button className="c-button" onClick={copyAutoTagsToClipboard}>
        Copy autotags
      </button>

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
