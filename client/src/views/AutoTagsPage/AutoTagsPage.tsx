import './AutoTagsPage.scss';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  useAutoTagsServiceAutoTagsControllerCreate,
  useAutoTagsServiceAutoTagsControllerDelete,
  useAutoTagsServiceAutoTagsControllerFindAll,
} from '../../generated/api/queries';
import React, { type ReactNode, useCallback, useEffect, useState } from 'react';
import { orderBy } from 'lodash-es';
import { ROUTE_PARTS } from '../../App';
import { toast } from 'react-toastify';
import { type AutoTag } from '../../types/types';
import copy from 'copy-to-clipboard';
import { mapLimit } from 'blend-promise-utils';
import { AutoTagConditionDto, AutoTagDto } from '../../generated/api/requests';
import { useAtom } from 'jotai';
import { headerActionsAtom } from '../../store/store';

const AUTOTAGS_PROPERTY_NAME = 'timesheetTrackerAutoTags';

// interface AutoTagsPageProps {}

function AutoTagsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [, setHeaderActions] = useAtom(headerActionsAtom);
  const [sortCol, setSortCol] = useState<'title' | 'priority'>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (col: 'title' | 'priority') => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sortIndicator = (col: 'title' | 'priority') =>
    sortCol === col ? (
      <span style={{ fontSize: '0.7em', color: 'black' }}>{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
    ) : (
      <span style={{ fontSize: '0.7em', color: '#aaa' }}> ▲▼</span>
    );
  const { data: autoTagItems, refetch: refetchAutoTags } =
    useAutoTagsServiceAutoTagsControllerFindAll({
      term: '',
    });
  const { mutateAsync: insertAutoTag } = useAutoTagsServiceAutoTagsControllerCreate();
  const autoTags = autoTagItems as AutoTagDto[];
  const { mutateAsync: deleteAutoTag } = useAutoTagsServiceAutoTagsControllerDelete();

  useEffect(() => {
    refetchAutoTags();
  }, [location]);

  const handlePasteAutoTags = async (pastedAutoTags: AutoTag[]) => {
    await mapLimit(pastedAutoTags, 5, async (pastedAutoTag: AutoTag) => {
      return await insertAutoTag({
        requestBody: {
          title: pastedAutoTag.title,
          priority: pastedAutoTag.priority,
          tagNameId: pastedAutoTag.tagNameId,
          conditions: pastedAutoTag.conditions as AutoTagConditionDto[],
        },
      });
    });
    await refetchAutoTags();
    toast(pastedAutoTags.length + ' auto tags were added');
  };

  const onPasteContent = useCallback(async (evt: ClipboardEvent) => {
    try {
      if (evt.clipboardData && evt.clipboardData.getData) {
        const pastedText = evt.clipboardData.getData('text/plain');

        if (pastedText.includes(AUTOTAGS_PROPERTY_NAME)) {
          await handlePasteAutoTags(JSON.parse(pastedText)[AUTOTAGS_PROPERTY_NAME]);
        } else {
          toast("The pasted text doesn't contain any valid auto tags", { type: 'error' });
        }
      }
    } catch {
      toast("The pasted text doesn't contain any valid auto tags", { type: 'error' });
    }
  }, []);

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

  useEffect(() => {
    setHeaderActions(
      <>
        <NavLink
          className="c-button"
          to={'/' + ROUTE_PARTS.autoTagRules + '/' + ROUTE_PARTS.create}
        >
          Add auto tag
        </NavLink>
        <button className="c-button" onClick={copyAutoTagsToClipboard}>
          Copy autotags
        </button>
      </>
    );
    return () => setHeaderActions(null);
  }, [copyAutoTagsToClipboard]);

  return (
    <div>
      <table className="w-full">
        <thead>
          <tr className="h-10 bg-white">
            <th className="w-px"></th>
            <th
              className="text-left pl-3 cursor-pointer select-none"
              onClick={() => toggleSort('title')}
            >
              Title{sortIndicator('title')}
            </th>
            <th
              className="text-left pl-3 cursor-pointer select-none"
              onClick={() => toggleSort('priority')}
            >
              Priority{sortIndicator('priority')}
            </th>
            <th className="w-px whitespace-nowrap"></th>
            <th className="w-px whitespace-nowrap"></th>
          </tr>
        </thead>
        <tbody>
          {orderBy(
            autoTags || [],
            (autoTag) => (sortCol === 'title' ? autoTag.title?.toLowerCase() : autoTag.priority),
            sortDir
          ).map(
            (autoTag): ReactNode => (
              <tr
                key={'auto-tag-' + autoTag.id}
                onClick={() =>
                  navigate(
                    '/' + ROUTE_PARTS.autoTagRules + '/' + autoTag.id + '/' + ROUTE_PARTS.edit
                  )
                }
              >
                <td className="w-px py-1 pl-2">
                  <span
                    className="block w-16 h-16"
                    style={{ backgroundColor: autoTag.tagName?.color }}
                  ></span>
                </td>
                <td className="pl-3">{autoTag.title}</td>
                <td className="pl-3">{autoTag.priority}</td>
                <td className="w-px whitespace-nowrap">
                  <NavLink
                    className="c-button"
                    to={'/' + ROUTE_PARTS.autoTagRules + '/' + autoTag.id + '/' + ROUTE_PARTS.edit}
                    onClick={(e) => e.stopPropagation()}
                  >
                    EDIT
                  </NavLink>
                </td>
                <td className="w-px whitespace-nowrap">
                  <button
                    className="c-button"
                    onClick={async (e) => {
                      e.stopPropagation();
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
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      <Outlet />
    </div>
  );
}

export default AutoTagsPage;
