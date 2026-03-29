import './TagNamesPage.scss';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { TagName } from '../../types/types';
import {
  useTagNamesServiceTagNamesControllerFindAll,
  useTagNamesServiceTagNamesControllerFindAllKey,
  useTagNamesServiceTagNamesControllerRemove,
} from '../../generated/api/queries';
import React, { type ReactNode, useEffect, useState } from 'react';
import { ROUTE_PARTS } from '../../App';
import { toast } from 'react-toastify';

// interface TagNamesPageProps {}

function TagNamesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  // const action = params.action;
  const id = params.id;
  const [_selectedTagName, setSelectedTagName] = useState<TagName | null>(null);

  const { data: tagNames, refetch: refetchTagNames } = useTagNamesServiceTagNamesControllerFindAll(
    {
      term: '',
    },
    [useTagNamesServiceTagNamesControllerFindAllKey],
    { refetchOnMount: true }
  );
  const { mutateAsync: deleteTagName } = useTagNamesServiceTagNamesControllerRemove();

  // Refetch tag names when edit or create modal closes
  useEffect(() => {
    refetchTagNames();
  }, [location]);

  useEffect(() => {
    if (tagNames) {
      // Set autoTag from url id
      const tagNameFromUrl = (tagNames.find((tagName) => tagName.id === id) ||
        null) as TagName | null;
      setSelectedTagName(tagNameFromUrl);
    }
  }, [id, tagNames]);

  return (
    <div className="p-tag-names">
      <button
        className="c-button"
        onClick={() => navigate('/' + ROUTE_PARTS.tagNames + '/' + ROUTE_PARTS.create)}
      >
        Add tag name
      </button>

      <table className="w-full">
        <thead>
          <tr className="h-10 bg-white">
            <th className="w-px"></th>
            <th className="text-left pl-3">Title</th>
            <th className="w-px whitespace-nowrap"></th>
            <th className="w-px whitespace-nowrap"></th>
          </tr>
        </thead>
        <tbody>
          {(tagNames || []).map(
            (tagName): ReactNode => (
              <tr key={'tag-name-' + tagName.id}>
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
                    onClick={() => {
                      setSelectedTagName(tagName as unknown as TagName);
                      navigate('/' + ROUTE_PARTS.tagNames + '/' + tagName.id + '/' + ROUTE_PARTS.edit);
                    }}
                  >
                    EDIT
                  </button>
                </td>
                <td className="w-px whitespace-nowrap">
                  <button
                    className="c-button"
                    onClick={async () => {
                      if (tagName.id) {
                        await deleteTagName({
                          id: tagName.id,
                        });
                        await refetchTagNames();
                        toast('Tag name has been deleted', { type: 'success' });
                      } else {
                        toast('Tag name could not be deleted, no id has been set', { type: 'warning' });
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

export default TagNamesPage;
