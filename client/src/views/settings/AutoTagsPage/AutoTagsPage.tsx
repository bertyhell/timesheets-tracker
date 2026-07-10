import './AutoTagsPage.css';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  autoTagsControllerCreateMutation,
  autoTagsControllerDeleteMutation,
  autoTagsControllerFindAllOptions,
} from '../../../generated/api/@tanstack/react-query.gen';
import React, { type ReactNode, useCallback, useEffect, useState } from 'react';
import { orderBy } from 'lodash-es';
import { ROUTE_PARTS } from '../../../App';
import { toast } from 'react-toastify';
import { type AutoTag } from '../../../types/types';
import copy from 'copy-to-clipboard';
import { mapLimit } from 'blend-promise-utils';
import type { AutoTagConditionDto, AutoTagDto } from '../../../generated/api/types.gen';
import { SearchInput } from '../../../components/SearchInput/SearchInput';

const AUTOTAGS_PROPERTY_NAME_FOR_PASTE_DETECTION = 'timesheetTrackerAutoTags';

// interface AutoTagsPageProps {}

export function AutoTagsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sortCol, setSortCol] = useState<'title' | 'priority'>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

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
  const { data: autoTagItems, refetch: refetchAutoTags } = useQuery({
    ...autoTagsControllerFindAllOptions({ query: { term: searchTerm } }),
  });
  const { mutateAsync: insertAutoTag } = useMutation({ ...autoTagsControllerCreateMutation() });
  const autoTags = autoTagItems as AutoTagDto[];
  const { mutateAsync: deleteAutoTag } = useMutation({ ...autoTagsControllerDeleteMutation() });

  useEffect(() => {
    refetchAutoTags();
  }, [location]);

  const handlePasteAutoTags = async (pastedAutoTags: AutoTag[]) => {
    await mapLimit(pastedAutoTags, 5, async (pastedAutoTag: AutoTag) => {
      return await insertAutoTag({
        body: {
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

  const onPasteContent = useCallback(
    async (evt: ClipboardEvent) => {
      const mainRoute = '/' + ROUTE_PARTS.manage + '/' + ROUTE_PARTS.autoTagRules;
      if (location.pathname !== mainRoute) {
        return;
      }

      try {
        if (evt.clipboardData && evt.clipboardData.getData) {
          const pastedText = evt.clipboardData.getData('text/plain');

          if (pastedText.includes(AUTOTAGS_PROPERTY_NAME_FOR_PASTE_DETECTION)) {
            await handlePasteAutoTags(
              JSON.parse(pastedText)[AUTOTAGS_PROPERTY_NAME_FOR_PASTE_DETECTION]
            );
          } else {
            toast("The pasted text doesn't contain any valid auto tags", { type: 'error' });
          }
        }
      } catch {
        toast("The pasted text doesn't contain any valid auto tags", { type: 'error' });
      }
    },
    [location.pathname]
  );

  useEffect(() => {
    document.body.addEventListener('paste', onPasteContent);

    return () => {
      document.body.removeEventListener('paste', onPasteContent);
    };
  }, [onPasteContent]);

  const copyAutoTagsToClipboard = () => {
    copy(JSON.stringify({ [AUTOTAGS_PROPERTY_NAME_FOR_PASTE_DETECTION]: autoTagItems }, null, 2));
    toast('Auto tag copied to clipboard', { type: 'success' });
  };

  const renderAddAutoTagButton = () => {
    return (
      <Button
        onClick={() =>
          navigate(
            '/' + ROUTE_PARTS.manage + '/' + ROUTE_PARTS.autoTagRules + '/' + ROUTE_PARTS.create
          )
        }
        variant={ButtonVariant.Primary}
      >
        Add auto tag
      </Button>
    );
  };

  const renderEditButton = (autoTag: AutoTagDto) => {
    return (
      <NavLink
        className="c-button c-button--secondary c-button--small"
        to={
          '/' +
          ROUTE_PARTS.manage +
          '/' +
          ROUTE_PARTS.autoTagRules +
          '/' +
          autoTag.id +
          '/' +
          ROUTE_PARTS.edit
        }
        onClick={(e) => e.stopPropagation()}
      >
        EDIT
      </NavLink>
    );
  };

  const renderDeleteButton = (autoTag: AutoTagDto) => {
    return (
      <Button
        onClick={async (e) => {
          e.stopPropagation();
          if (autoTag.id) {
            await deleteAutoTag({ path: { id: autoTag.id } });
            await refetchAutoTags();
            toast('Auto tag has been deleted', { type: 'success' });
          } else {
            toast("Cannot delete an auto tag since it doesn't have an id", {
              type: 'error',
            });
          }
        }}
        variant={ButtonVariant.Secondary}
      >
        DELETE
      </Button>
    );
  };

  const renderAutoTagsTable = () => {
    return (
      <>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          className="mb-3 ml-4 w-full max-w-sm"
        />
        <table className="c-table w-full">
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
              (autoTag: AutoTagDto): ReactNode => (
                <tr
                  key={'auto-tag-' + autoTag.id}
                  onClick={() =>
                    navigate(
                      '/' +
                        ROUTE_PARTS.manage +
                        '/' +
                        ROUTE_PARTS.autoTagRules +
                        '/' +
                        autoTag.id +
                        '/' +
                        ROUTE_PARTS.edit
                    )
                  }
                >
                  <td className="w-px py-1 pl-2">
                    <span
                      className="block h-5 w-5 rounded-md"
                      style={{ backgroundColor: autoTag.tagName?.color }}
                    ></span>
                  </td>
                  <td className="pl-3">{autoTag.title}</td>
                  <td className="pl-3">{autoTag.priority}</td>
                  <td className="w-px whitespace-nowrap">{renderEditButton(autoTag)}</td>
                  <td className="w-px whitespace-nowrap">{renderDeleteButton(autoTag)}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </>
    );
  };

  return (
    <div>
      <PageHeader
        title="Auto tag rules"
        description="Auto tag rules allow you to automatically tag time on a timeline using rules. You can create rules based on other timeline events to automatically tag time. For example, you can create a rule that tags time for a specific customer when a specific program is open or when you have a calendar meeting with a certain person."
      >
        <div className="flex flex-row gap-2" style={{ flexWrap: 'wrap' }}>
          {renderAddAutoTagButton()}
          <Button onClick={copyAutoTagsToClipboard} variant={ButtonVariant.Transparent}>
            Copy autotags
          </Button>
        </div>
      </PageHeader>
      {renderAutoTagsTable()}
      <Outlet />
    </div>
  );
}
