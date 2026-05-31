import './TagNamesPage.css';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import type { TagName } from '../../../types/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  tagNamesControllerFindAllOptions,
  tagNamesControllerRemoveMutation,
} from '../../../generated/api/@tanstack/react-query.gen';
import React, { type ReactNode, useEffect, useState } from 'react';
import { ROUTE_PARTS } from '../../../App';
import { toast } from 'react-toastify';
import { orderBy } from 'lodash-es';

// interface TagNamesPageProps {}

export function TagNamesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;
  const [_selectedTagName, setSelectedTagName] = useState<TagName | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  const sortIndicator = (
    <span style={{ fontSize: '0.7em', color: 'black' }}>{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
  );

  const { data: tagNames, refetch: refetchTagNames } = useQuery({
    ...tagNamesControllerFindAllOptions({ query: { term: '' } }),
    refetchOnMount: true,
  });
  const { mutateAsync: deleteTagName } = useMutation({ ...tagNamesControllerRemoveMutation() });

  // Refetch tag names when edit or create modal closes
  useEffect(() => {
    refetchTagNames();
  }, [location]);

  useEffect(() => {
    if (tagNames) {
      const tagNameFromUrl = (tagNames.find((tagName) => tagName.id === id) ||
        null) as TagName | null;
      setSelectedTagName(tagNameFromUrl);
    }
  }, [id, tagNames]);

  return (
    <div className="p-tag-names">
      <PageHeader
        title="Tag names"
        description="Tag names allow you to tag time with a certain label and code and color. They can be used to identify which customer you worked for, or which timesheet code you want the time to billed on."
      >
        <button
          className="c-button"
          onClick={() =>
            navigate(
              '/' + ROUTE_PARTS.settings + '/' + ROUTE_PARTS.tagNames + '/' + ROUTE_PARTS.create
            )
          }
        >
          Add tag name
        </button>
      </PageHeader>
      <table className="c-table w-full">
        <thead>
          <tr className="h-10 bg-white">
            <th className="w-px"></th>
            <th className="text-left pl-3 cursor-pointer select-none" onClick={toggleSort}>
              Title{sortIndicator}
            </th>
            <th className="w-px whitespace-nowrap"></th>
            <th className="w-px whitespace-nowrap"></th>
          </tr>
        </thead>
        <tbody>
          {orderBy(tagNames || [], (t) => t.title?.toLowerCase(), sortDir).map(
            (tagName): ReactNode => (
              <tr
                key={'tag-name-' + tagName.id}
                onClick={() =>
                  navigate(
                    '/' +
                      ROUTE_PARTS.settings +
                      '/' +
                      ROUTE_PARTS.tagNames +
                      '/' +
                      tagName.id +
                      '/' +
                      ROUTE_PARTS.edit
                  )
                }
              >
                <td className="w-px py-1 pl-2">
                  <span
                    className="block h-16 w-16"
                    style={{ backgroundColor: tagName.color }}
                  ></span>
                </td>
                <td className="pl-3">{tagName.title}</td>
                <td className="w-px whitespace-nowrap">
                  <button
                    className="c-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTagName(tagName as unknown as TagName);
                      navigate(
                        '/' +
                          ROUTE_PARTS.settings +
                          '/' +
                          ROUTE_PARTS.tagNames +
                          '/' +
                          tagName.id +
                          '/' +
                          ROUTE_PARTS.edit
                      );
                    }}
                  >
                    EDIT
                  </button>
                </td>
                <td className="w-px whitespace-nowrap">
                  <button
                    className="c-button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (tagName.id) {
                        await deleteTagName({ path: { id: tagName.id } });
                        await refetchTagNames();
                        toast('Tag name has been deleted', { type: 'success' });
                      } else {
                        toast('Tag name could not be deleted, no id has been set', {
                          type: 'warning',
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
