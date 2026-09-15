import './EditAutoTagModal.css';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { cloneDeep } from 'lodash-es';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  InfoIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
  ZapIcon,
} from 'lucide-react';
import React, { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import type {
  CreateAutoTagDto,
  TagNameDto,
  UpdateAutoTagsDto,
} from '../../generated/api/types.gen';

import { ROUTE_PARTS } from '../../App';
import {
  autoTagsControllerCountOptions,
  autoTagsControllerCreateMutation,
  autoTagsControllerDeleteMutation,
  autoTagsControllerFindOneOptions,
  autoTagsControllerUpdateMutation,
  tagNamesControllerCreateMutation,
} from '../../generated/api/@tanstack/react-query.gen';
import {
  type AutoTag,
  type AutoTagCondition,
  BooleanOperator,
  ConditionOperator,
  ConditionVariable,
  type TagName,
} from '../../types/types';
import AutoTagConditionInput, {
  AutoTagConditionHeader,
} from '../AutoTagCondition/AutoTagConditionInput';
import {
  conditionOperatorLabel,
  conditionVariableLabel,
} from '../AutoTagCondition/conditionLabels';
import Button, { ButtonSize, ButtonVariant } from '../Button/Button';
import { DateField } from '../DateField/DateField';
import TagSelectSingle from '../TagSelect/TagSelectSingle';
import { getRandomColor } from '../Timeline/helpers/getColorForEvent';
import Tooltip from '../Tooltip/Tooltip';

const NEW_CONDITION: AutoTagCondition = {
  booleanOperator: BooleanOperator.OR,
  variable: ConditionVariable.anyVariable,
  operator: ConditionOperator.contains,
  value: '',
};

/** RSuite's calendars use ISO weeks (Monday first), so the week presets have to match. */
const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

const ACTIVE_PERIOD_EXPLANATION =
  'Leave a date empty to leave that side unbounded. Both days are included, so a rule that ends on 31 March still tags activity on 31 March.';

const toIsoDate = (date: Date) => format(date, 'yyyy-MM-dd');

const formatDisplayDate = (isoDate: string) => format(parseISO(isoDate), 'dd/MM/yyyy');

interface DateQuickPick {
  label: string;
  /** Which row the pick is rendered on: days, weeks and months each get their own. */
  group: 'days' | 'weeks' | 'months';
  getRange: (today: Date) => { from: Date; until: Date };
}

const QUICK_PICK_GROUPS: { group: DateQuickPick['group']; label: string }[] = [
  { group: 'days', label: 'Days' },
  { group: 'weeks', label: 'Weeks' },
  { group: 'months', label: 'Months' },
];

const DATE_QUICK_PICKS: DateQuickPick[] = [
  {
    label: 'Yesterday',
    group: 'days',
    getRange: (today) => {
      const day = new Date(today);
      day.setDate(day.getDate() - 1);
      return { from: day, until: day };
    },
  },
  {
    label: 'Today',
    group: 'days',
    getRange: (today) => ({ from: today, until: today }),
  },
  {
    label: 'Tomorrow',
    group: 'days',
    getRange: (today) => {
      const day = new Date(today);
      day.setDate(day.getDate() + 1);
      return { from: day, until: day };
    },
  },
  {
    label: 'Last week',
    group: 'weeks',
    getRange: (today) => ({
      from: startOfWeek(subWeeks(today, 1), WEEK_OPTIONS),
      until: endOfWeek(subWeeks(today, 1), WEEK_OPTIONS),
    }),
  },
  {
    label: 'This week',
    group: 'weeks',
    getRange: (today) => ({
      from: startOfWeek(today, WEEK_OPTIONS),
      until: endOfWeek(today, WEEK_OPTIONS),
    }),
  },
  {
    label: 'Next week',
    group: 'weeks',
    getRange: (today) => ({
      from: startOfWeek(addWeeks(today, 1), WEEK_OPTIONS),
      until: endOfWeek(addWeeks(today, 1), WEEK_OPTIONS),
    }),
  },
  {
    label: 'Last month',
    group: 'months',
    getRange: (today) => ({
      from: startOfMonth(subMonths(today, 1)),
      until: endOfMonth(subMonths(today, 1)),
    }),
  },
  {
    label: 'This month',
    group: 'months',
    getRange: (today) => ({
      from: startOfMonth(today),
      until: endOfMonth(today),
    }),
  },
  {
    label: 'Next month',
    group: 'months',
    getRange: (today) => ({
      from: startOfMonth(addMonths(today, 1)),
      until: endOfMonth(addMonths(today, 1)),
    }),
  },
];

function parsePrefillConditions(raw: string | null): AutoTagCondition[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((entry): entry is { variable?: string; value?: string } => !!entry?.value)
    .map((entry) => ({
      ...NEW_CONDITION,
      variable:
        entry.variable && (Object.values(ConditionVariable) as string[]).includes(entry.variable)
          ? (entry.variable as ConditionVariable)
          : NEW_CONDITION.variable,
      value: entry.value as string,
    }));
}

/**
 * One sentence that spells out what the rule does, so the meaning of the condition rows does
 * not have to be reconstructed from the selects.
 */
function describeRule(conditions: AutoTagCondition[], tagTitle: string | undefined): string {
  const filled = conditions.filter((condition) => !!condition.value);
  const tag = tagTitle || 'this tag';

  if (!filled.length) {
    return `Add a condition to describe the activity this rule should tag as ${tag}.`;
  }

  const example = `${conditionVariableLabel(filled[0].variable)} ${conditionOperatorLabel(
    filled[0].operator
  )} “${filled[0].value}”`;

  if (filled.length === 1) {
    return `Tags activity as ${tag} when it matches: ${example}.`;
  }

  return `Tags activity as ${tag} when ${example}, plus ${filled.length - 1} more.`;
}

export function EditAutoTagModal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState<string>('');
  const [selectedTagName, setSelectedTagName] = useState<TagName | null>(null);
  const [priority, setPriority] = useState<number>(0);
  // A new rule defaults to the end of the list, but only until the field has a value of its
  // own: neither the count arriving late nor a re-render may overwrite what the user typed.
  const priorityInitialized = useRef(false);

  const prefillConditions = parsePrefillConditions(!id ? searchParams.get('conditions') : null);

  const [conditions, setConditions] = useState<AutoTagCondition[]>(
    prefillConditions.length
      ? [...prefillConditions, NEW_CONDITION]
      : [NEW_CONDITION, NEW_CONDITION]
  );
  const [userModifiedName, setUserModifiedName] = useState<boolean>(false);
  // '' means "no bound": the auto tag is active indefinitely on that side.
  const [activeFrom, setActiveFrom] = useState<string>('');
  // The calendar panels are portalled into the form rather than to <body>: RSuite stacks them
  // at z-index 7, which is below the modal, so by default they open behind it. The form (rather
  // than the date row itself) is the container so RSuite has room to open the panel downwards.
  const activePeriodRef = useRef<HTMLDivElement>(null);
  const [activeUntil, setActiveUntil] = useState<string>('');
  const [selectedQuickPicks, setSelectedQuickPicks] = useState<string[]>([]);
  // Most rules never get a period, so the section stays folded away behind its summary until
  // someone actually wants to bound the rule.
  const [activePeriodOpen, setActivePeriodOpen] = useState<boolean>(false);
  const { data: autoTagsCount } = useQuery({
    ...autoTagsControllerCountOptions(),
  });
  const { data: autoTagResponse } = useQuery({
    ...autoTagsControllerFindOneOptions({ path: { id: id as string } }),
    enabled: !!id,
  });
  const autoTag = autoTagResponse as AutoTag;
  const { mutateAsync: createAutoTag } = useMutation({
    ...autoTagsControllerCreateMutation(),
  });
  const { mutateAsync: updateAutoTag } = useMutation({
    ...autoTagsControllerUpdateMutation(),
  });
  const { mutateAsync: deleteAutoTag } = useMutation({
    ...autoTagsControllerDeleteMutation(),
  });
  const { mutateAsync: createTagName } = useMutation({
    ...tagNamesControllerCreateMutation(),
  });

  useEffect(() => {
    if (autoTag) {
      setName(autoTag.title);
      setUserModifiedName(true);
      if (autoTag.tagName) {
        setSelectedTagName(autoTag.tagName);
      }
      priorityInitialized.current = true;
      setPriority(autoTag.priority);
      setActiveFrom(autoTag.activeFrom ?? '');
      setActiveUntil(autoTag.activeUntil ?? '');
      setSelectedQuickPicks([]);
      if (autoTag.conditions?.length !== 0) {
        setConditions(autoTag.conditions);
      }
    }
  }, [autoTag]);

  useEffect(() => {
    if (id || priorityInitialized.current || autoTagsCount?.count === undefined) {
      return;
    }
    priorityInitialized.current = true;
    setPriority(autoTagsCount.count);
  }, [autoTagsCount, id]);

  useEffect(() => {
    const lastCondition = conditions.at(-1);
    if (!lastCondition) {
      return;
    }
    if (lastCondition.variable && lastCondition.operator && lastCondition.value) {
      setConditions([...conditions, { ...NEW_CONDITION }]);
    }
  }, [conditions]);

  const handleChangeCondition = (
    i: number,
    booleanOperator: BooleanOperator,
    variable: ConditionVariable | null,
    operator: ConditionOperator | null,
    value: string
  ) => {
    const newConditions = cloneDeep(conditions);
    newConditions[i] = {
      booleanOperator,
      variable,
      operator,
      value,
    };
    setConditions(newConditions);
  };

  const handleDeleteCondition = (conditionIndex: number) => {
    const newConditions = cloneDeep(conditions);
    newConditions.splice(conditionIndex, 1);
    setConditions(newConditions);
  };

  const handleAddCondition = () => setConditions([...conditions, { ...NEW_CONDITION }]);

  const handlePriorityChange = (value: string) => {
    priorityInitialized.current = true;
    const digitsOnly = value.replace(/[^0-9]/g, '');
    setPriority(digitsOnly ? Number(digitsOnly) : 0);
  };

  const handleBumpPriority = (delta: number) => {
    priorityInitialized.current = true;
    setPriority((current) => Math.max(0, current + delta));
  };

  /**
   * The selected quick picks together describe one span: the earliest start and the latest end
   * of everything that is toggled on. Editing a date field by hand wins, so the picks are
   * toggled off again (see handleActiveFromChange / handleActiveUntilChange).
   */
  const handleToggleQuickPick = (label: string) => {
    const nextLabels = selectedQuickPicks.includes(label)
      ? selectedQuickPicks.filter((selected) => selected !== label)
      : [...selectedQuickPicks, label];
    setSelectedQuickPicks(nextLabels);

    if (!nextLabels.length) {
      setActiveFrom('');
      setActiveUntil('');
      return;
    }

    const today = new Date();
    const ranges = DATE_QUICK_PICKS.filter((quickPick) => nextLabels.includes(quickPick.label)).map(
      (quickPick) => quickPick.getRange(today)
    );
    setActiveFrom(ranges.map((range) => toIsoDate(range.from)).sort()[0]);
    setActiveUntil(
      ranges
        .map((range) => toIsoDate(range.until))
        .sort()
        .at(-1) as string
    );
  };

  const handleActiveFromChange = (value: string) => {
    setSelectedQuickPicks([]);
    setActiveFrom(value);
  };

  const handleActiveUntilChange = (value: string) => {
    setSelectedQuickPicks([]);
    setActiveUntil(value);
  };

  const handleClearActivePeriod = () => {
    setSelectedQuickPicks([]);
    setActiveFrom('');
    setActiveUntil('');
  };

  const handleClose = () => navigate('/' + ROUTE_PARTS.manage + '/' + ROUTE_PARTS.autoTagRules);

  const handleSave = async () => {
    if (!selectedTagName?.id) {
      toast('Please select a tag', { type: 'warning' });
      return;
    }

    const tagNameId = selectedTagName.id;

    if (activeFrom && activeUntil && activeFrom > activeUntil) {
      toast('The active period must start before it ends', { type: 'warning' });
      return;
    }

    const updatedAutoTag: Omit<AutoTag, 'id'> & { id?: string } = {
      tagNameId,
      title: name,
      priority,
      conditions: conditions.filter((condition) => !!condition.value),
      activeFrom: activeFrom || null,
      activeUntil: activeUntil || null,
    };
    if (id) {
      // edit existing auto tag
      updatedAutoTag.id = autoTag.id;
      await updateAutoTag({
        path: { id: autoTag.id },
        body: updatedAutoTag as UpdateAutoTagsDto,
      });
      toast('Auto tag has been updated', { type: 'success' });
    } else {
      // create new auto tag
      await createAutoTag({
        body: updatedAutoTag as CreateAutoTagDto,
      });
      toast('Auto tag has been created', { type: 'success' });
    }

    handleClose();
  };

  const handleDelete = async () => {
    await deleteAutoTag({ path: { id: id as string } });
    toast('Auto tag has been deleted', { type: 'success' });
    handleClose();
  };

  const handleTagCreate = async (inputValue: string) => {
    const created = await createTagName({
      body: { title: inputValue, code: '', color: getRandomColor() },
    });
    const newTag = created as TagNameDto as unknown as TagName;
    setSelectedTagName(newTag);
    if (!userModifiedName) setName(newTag.title || '');
  };

  const handleTagChanged = async (option: TagName | null) => {
    if (!option) {
      setSelectedTagName(null);
      if (!userModifiedName) setName('');
      return;
    }
    if ((option as TagName & { __isNew__?: boolean }).__isNew__) {
      const created = await createTagName({
        body: { title: option.title, code: '', color: getRandomColor() },
      });
      const newTag = created as TagNameDto as unknown as TagName;
      setSelectedTagName(newTag);
      if (!userModifiedName) setName(newTag.title || '');
    } else {
      setSelectedTagName(option);
      if (!userModifiedName) setName(option.title || '');
    }
  };

  const filledConditionCount = conditions.filter((condition) => !!condition.value).length;

  const activePeriodSummary =
    !activeFrom && !activeUntil
      ? 'Always active'
      : `${activeFrom ? formatDisplayDate(activeFrom) : 'Always'} → ${
          activeUntil ? formatDisplayDate(activeUntil) : 'Forever'
        }`;

  return (
    <Modal
      open
      onClose={handleClose}
      showCloseIcon={false}
      classNames={{ modal: 'c-edit-auto-tag-modal' }}
    >
      <header className="c-edit-auto-tag-modal__header">
        <span className="c-edit-auto-tag-modal__header-icon">
          <ZapIcon size={18} />
        </span>
        <div className="c-edit-auto-tag-modal__header-text">
          <h3 className="c-edit-auto-tag-modal__title">{id ? 'Edit auto tag' : 'Add auto tag'}</h3>
          <p className="c-edit-auto-tag-modal__subtitle">
            Automatically apply a tag to activity that matches these conditions.
          </p>
        </div>
        <button
          type="button"
          className="c-edit-auto-tag-modal__close"
          onClick={handleClose}
          title="Close"
          aria-label="Close"
        >
          <XIcon size={16} />
        </button>
      </header>

      <div className="c-edit-auto-tag-modal__body" ref={activePeriodRef}>
        <section className="c-edit-auto-tag-modal__section">
          <div className="c-edit-auto-tag-modal__section-title">Rule</div>
          <div className="c-edit-auto-tag-modal__rule-grid">
            <div className="c-edit-auto-tag-modal__field">
              <span className="c-edit-auto-tag-modal__label">Tag</span>
              <TagSelectSingle
                className="c-edit-auto-tag-modal__tag-select"
                value={selectedTagName || null}
                onChange={handleTagChanged}
                onCreateOption={handleTagCreate}
                autoFocus={true}
              />
              <span className="c-edit-auto-tag-modal__hint">
                Type a new name to create the tag.{' '}
                {selectedTagName?.id && (
                  <a
                    href={`/${ROUTE_PARTS.manage}/${ROUTE_PARTS.tagNames}/${selectedTagName.id}/${ROUTE_PARTS.edit}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open tag
                  </a>
                )}
              </span>
            </div>

            <div className="c-edit-auto-tag-modal__field">
              <label className="c-edit-auto-tag-modal__label" htmlFor="auto-tag-rule-name">
                Rule name
              </label>
              <input
                id="auto-tag-rule-name"
                className="c-input c-edit-auto-tag-modal__input"
                value={name}
                onChange={(evt: ChangeEvent<HTMLInputElement>) => {
                  setUserModifiedName(true);
                  setName(evt.target.value);
                }}
              />
              <span className="c-edit-auto-tag-modal__hint">
                {userModifiedName ? 'Custom label for this rule' : 'Follows the tag name'}
              </span>
            </div>

            <div className="c-edit-auto-tag-modal__field">
              <label className="c-edit-auto-tag-modal__label" htmlFor="auto-tag-priority">
                Priority
              </label>
              <div className="c-edit-auto-tag-modal__priority">
                <input
                  id="auto-tag-priority"
                  className="c-edit-auto-tag-modal__priority-input"
                  inputMode="numeric"
                  value={String(priority)}
                  onChange={(evt: ChangeEvent<HTMLInputElement>) =>
                    handlePriorityChange(evt.target.value)
                  }
                />
                <div className="c-edit-auto-tag-modal__priority-steppers">
                  <button
                    type="button"
                    onClick={() => handleBumpPriority(1)}
                    title="Increase priority number"
                    aria-label="Increase priority number"
                  >
                    <ChevronUpIcon size={10} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBumpPriority(-1)}
                    title="Decrease priority number"
                    aria-label="Decrease priority number"
                  >
                    <ChevronDownIcon size={10} />
                  </button>
                </div>
              </div>
              <span className="c-edit-auto-tag-modal__hint">Lower wins</span>
            </div>
          </div>
        </section>

        <section className="c-edit-auto-tag-modal__section">
          <div className="c-edit-auto-tag-modal__section-header">
            <button
              type="button"
              className="c-edit-auto-tag-modal__accordion-trigger"
              aria-expanded={activePeriodOpen}
              onClick={() => setActivePeriodOpen((open) => !open)}
            >
              <ChevronRightIcon
                size={14}
                className={
                  'c-edit-auto-tag-modal__accordion-chevron' +
                  (activePeriodOpen ? ' c-edit-auto-tag-modal__accordion-chevron--open' : '')
                }
              />
              <span className="c-edit-auto-tag-modal__section-title">Active period</span>
              <span className="c-edit-auto-tag-modal__hint">{activePeriodSummary}</span>
            </button>
            <Tooltip
              content={ACTIVE_PERIOD_EXPLANATION}
              placement="top"
              className="c-edit-auto-tag-modal__tooltip"
            >
              <span
                className="c-edit-auto-tag-modal__info"
                tabIndex={0}
                role="img"
                aria-label={ACTIVE_PERIOD_EXPLANATION}
              >
                <InfoIcon size={14} />
              </span>
            </Tooltip>
          </div>
          {activePeriodOpen && (
            <div className="c-edit-auto-tag-modal__active-period">
              <div className="c-edit-auto-tag-modal__field">
                <span className="c-edit-auto-tag-modal__sub-label">From</span>
                <DateField
                  className="c-edit-auto-tag-modal__active-period-date"
                  ariaLabel="Active from"
                  placement="bottomStart"
                  container={() => activePeriodRef.current as HTMLDivElement}
                  placeholder="Always"
                  cleanable
                  value={activeFrom}
                  shouldDisableDate={(date) => !!activeUntil && date > parseISO(activeUntil)}
                  onChange={handleActiveFromChange}
                />
              </div>
              <span className="c-edit-auto-tag-modal__active-period-arrow">
                <ArrowRightIcon size={16} />
              </span>
              <div className="c-edit-auto-tag-modal__field">
                <span className="c-edit-auto-tag-modal__sub-label">Until</span>
                <DateField
                  className="c-edit-auto-tag-modal__active-period-date"
                  ariaLabel="Active until"
                  placement="bottomStart"
                  container={() => activePeriodRef.current as HTMLDivElement}
                  placeholder="Forever"
                  cleanable
                  value={activeUntil}
                  shouldDisableDate={(date) => !!activeFrom && date < parseISO(activeFrom)}
                  onChange={handleActiveUntilChange}
                />
              </div>
              {(activeFrom || activeUntil) && (
                <div className="c-edit-auto-tag-modal__active-period-summary">
                  <button
                    type="button"
                    className="c-edit-auto-tag-modal__link-button"
                    onClick={handleClearActivePeriod}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {activePeriodOpen && (
            <div className="c-edit-auto-tag-modal__quick-pick-panel">
              {QUICK_PICK_GROUPS.map(({ group, label }) => (
                <div className="c-edit-auto-tag-modal__quick-picks" key={group}>
                  <span className="c-edit-auto-tag-modal__quick-picks-label">{label}</span>
                  <div className="c-edit-auto-tag-modal__quick-picks-buttons">
                    {DATE_QUICK_PICKS.filter((quickPick) => quickPick.group === group).map(
                      (quickPick) => (
                        <button
                          type="button"
                          key={quickPick.label}
                          aria-pressed={selectedQuickPicks.includes(quickPick.label)}
                          className={
                            'c-edit-auto-tag-modal__quick-pick' +
                            (selectedQuickPicks.includes(quickPick.label)
                              ? ' c-edit-auto-tag-modal__quick-pick--active'
                              : '')
                          }
                          onClick={() => handleToggleQuickPick(quickPick.label)}
                        >
                          {quickPick.label}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="c-edit-auto-tag-modal__section">
          <div className="c-edit-auto-tag-modal__section-header c-edit-auto-tag-modal__section-header--spread">
            <div className="c-edit-auto-tag-modal__section-header">
              <div className="c-edit-auto-tag-modal__section-title">Conditions</div>
              <span className="c-edit-auto-tag-modal__hint">
                {filledConditionCount === 0
                  ? 'None yet'
                  : `${filledConditionCount} condition${filledConditionCount === 1 ? '' : 's'}`}
              </span>
            </div>
            <Button
              onClick={handleAddCondition}
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Small}
              icon={<PlusIcon size={13} />}
              className="!text-[var(--primary)] hover:!bg-[var(--hover-highlight)] hover:!border-[var(--primary-3)]"
            >
              Add condition
            </Button>
          </div>

          <div className="c-edit-auto-tag-modal__conditions">
            <AutoTagConditionHeader />
            {!!conditions &&
              conditions.map((condition, i) => (
                <AutoTagConditionInput
                  key={'auto-tag-condition__' + i}
                  index={i}
                  showBooleanOperator={i !== 0}
                  {...conditions[i]}
                  onChange={(booleanOperator, variable, operator, value) =>
                    handleChangeCondition(i, booleanOperator, variable, operator, value)
                  }
                  onDelete={handleDeleteCondition}
                  showDelete={conditions.length > 1}
                ></AutoTagConditionInput>
              ))}
          </div>

          <div className="c-edit-auto-tag-modal__explainer">
            <InfoIcon size={15} />
            <span>{describeRule(conditions, selectedTagName?.title)}</span>
          </div>
        </section>
      </div>

      <footer className="c-edit-auto-tag-modal__footer">
        <div>
          {id && (
            <Button
              onClick={handleDelete}
              variant={ButtonVariant.Secondary}
              icon={<Trash2Icon size={15} />}
              className="!border-red-200 !text-red-600 hover:!bg-red-50"
            >
              Delete rule
            </Button>
          )}
        </div>
        <div className="flex flex-row gap-2">
          <Button onClick={handleClose} variant={ButtonVariant.Secondary}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant={ButtonVariant.Primary}>
            {id ? 'Save changes' : 'Create rule'}
          </Button>
        </div>
      </footer>
    </Modal>
  );
}
