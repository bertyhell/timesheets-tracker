import "./EditAutoTagModal.css";

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
} from "date-fns";
import { cloneDeep } from "lodash-es";
import { InfoIcon } from "lucide-react";
import React, { type ChangeEvent, useEffect, useRef, useState } from "react";
import Button, { ButtonVariant } from "../Button/Button";
import { Modal } from "react-responsive-modal";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { ROUTE_PARTS } from "../../App";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  autoTagsControllerCountOptions,
  autoTagsControllerCreateMutation,
  autoTagsControllerDeleteMutation,
  autoTagsControllerFindOneOptions,
  autoTagsControllerUpdateMutation,
  tagNamesControllerCreateMutation,
} from "../../generated/api/@tanstack/react-query.gen";
import type {
  CreateAutoTagDto,
  UpdateAutoTagsDto,
} from "../../generated/api/types.gen";
import {
  type AutoTag,
  type AutoTagCondition,
  BooleanOperator,
  ConditionOperator,
  ConditionVariable,
  type TagName,
} from "../../types/types";
import AutoTagConditionInput from "../AutoTagCondition/AutoTagConditionInput";
import { DateField } from "../DateField/DateField";
import TagSelectSingle from "../TagSelect/TagSelectSingle";
import Tooltip from "../Tooltip/Tooltip";
import { getRandomColor } from "../Timeline/helpers/getColorForEvent";
import type { TagNameDto } from "../../generated/api/types.gen";

const NEW_CONDITION: AutoTagCondition = {
  booleanOperator: BooleanOperator.OR,
  variable: ConditionVariable.anyVariable,
  operator: ConditionOperator.contains,
  value: "",
};

/** RSuite's calendars use ISO weeks (Monday first), so the week presets have to match. */
const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

const toIsoDate = (date: Date) => format(date, "yyyy-MM-dd");

interface DateQuickPick {
  label: string;
  /** Which row the pick is rendered on: days, weeks and months each get their own. */
  group: "days" | "weeks" | "months";
  getRange: (today: Date) => { from: Date; until: Date };
}

const QUICK_PICK_GROUPS: DateQuickPick["group"][] = ["days", "weeks", "months"];

const DATE_QUICK_PICKS: DateQuickPick[] = [
  {
    label: "Yesterday",
    group: "days",
    getRange: (today) => {
      const day = new Date(today);
      day.setDate(day.getDate() - 1);
      return { from: day, until: day };
    },
  },
  {
    label: "Today",
    group: "days",
    getRange: (today) => ({ from: today, until: today }),
  },
  {
    label: "Tomorrow",
    group: "days",
    getRange: (today) => {
      const day = new Date(today);
      day.setDate(day.getDate() + 1);
      return { from: day, until: day };
    },
  },
  {
    label: "Last week",
    group: "weeks",
    getRange: (today) => ({
      from: startOfWeek(subWeeks(today, 1), WEEK_OPTIONS),
      until: endOfWeek(subWeeks(today, 1), WEEK_OPTIONS),
    }),
  },
  {
    label: "This week",
    group: "weeks",
    getRange: (today) => ({
      from: startOfWeek(today, WEEK_OPTIONS),
      until: endOfWeek(today, WEEK_OPTIONS),
    }),
  },
  {
    label: "Next week",
    group: "weeks",
    getRange: (today) => ({
      from: startOfWeek(addWeeks(today, 1), WEEK_OPTIONS),
      until: endOfWeek(addWeeks(today, 1), WEEK_OPTIONS),
    }),
  },
  {
    label: "Last month",
    group: "months",
    getRange: (today) => ({
      from: startOfMonth(subMonths(today, 1)),
      until: endOfMonth(subMonths(today, 1)),
    }),
  },
  {
    label: "This month",
    group: "months",
    getRange: (today) => ({
      from: startOfMonth(today),
      until: endOfMonth(today),
    }),
  },
  {
    label: "Next month",
    group: "months",
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
    .filter(
      (entry): entry is { variable?: string; value?: string } => !!entry?.value,
    )
    .map((entry) => ({
      ...NEW_CONDITION,
      variable:
        entry.variable &&
        (Object.values(ConditionVariable) as string[]).includes(entry.variable)
          ? (entry.variable as ConditionVariable)
          : NEW_CONDITION.variable,
      value: entry.value as string,
    }));
}

export function EditAutoTagModal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState<string>("");
  const [selectedTagName, setSelectedTagName] = useState<TagName | null>(null);
  const [_priority, setPriority] = useState<number>(0); // TODO allow drag and drop

  const prefillConditions = parsePrefillConditions(
    !id ? searchParams.get("conditions") : null,
  );

  const [conditions, setConditions] = useState<AutoTagCondition[]>(
    prefillConditions.length
      ? [...prefillConditions, NEW_CONDITION]
      : [NEW_CONDITION, NEW_CONDITION],
  );
  const [userModifiedName, setUserModifiedName] = useState<boolean>(false);
  // '' means "no bound": the auto tag is active indefinitely on that side.
  const [activeFrom, setActiveFrom] = useState<string>("");
  // The calendar panels are portalled into the form rather than to <body>: RSuite stacks them
  // at z-index 7, which is below the modal, so by default they open behind it. The form (rather
  // than the date row itself) is the container so RSuite has room to open the panel downwards.
  const activePeriodRef = useRef<HTMLDivElement>(null);
  const [activeUntil, setActiveUntil] = useState<string>("");
  const [selectedQuickPicks, setSelectedQuickPicks] = useState<string[]>([]);
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
      setPriority(autoTag.priority);
      setActiveFrom(autoTag.activeFrom ?? "");
      setActiveUntil(autoTag.activeUntil ?? "");
      setSelectedQuickPicks([]);
      if (autoTag.conditions?.length !== 0) {
        setConditions(autoTag.conditions);
      }
    }
  }, [autoTag]);

  useEffect(() => {
    const lastCondition = conditions.at(-1);
    if (!lastCondition) {
      return;
    }
    if (
      lastCondition.variable &&
      lastCondition.operator &&
      lastCondition.value
    ) {
      setConditions([...conditions, { ...NEW_CONDITION }]);
    }
  }, [conditions]);

  const handleChangeCondition = (
    i: number,
    booleanOperator: BooleanOperator,
    variable: ConditionVariable | null,
    operator: ConditionOperator | null,
    value: string,
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
      setActiveFrom("");
      setActiveUntil("");
      return;
    }

    const today = new Date();
    const ranges = DATE_QUICK_PICKS.filter((quickPick) =>
      nextLabels.includes(quickPick.label),
    ).map((quickPick) => quickPick.getRange(today));
    setActiveFrom(ranges.map((range) => toIsoDate(range.from)).sort()[0]);
    setActiveUntil(
      ranges
        .map((range) => toIsoDate(range.until))
        .sort()
        .at(-1) as string,
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

  const handleClose = () =>
    navigate("/" + ROUTE_PARTS.manage + "/" + ROUTE_PARTS.autoTagRules);

  const handleSave = async () => {
    if (!selectedTagName?.id) {
      toast("Please select a tag", { type: "warning" });
      return;
    }

    const tagNameId = selectedTagName.id;

    if (activeFrom && activeUntil && activeFrom > activeUntil) {
      toast("The active period must start before it ends", { type: "warning" });
      return;
    }

    const updatedAutoTag: Omit<AutoTag, "id"> & { id?: string } = {
      tagNameId,
      title: name,
      priority: autoTagsCount?.count || 0,
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
      toast("Auto tag has been updated", { type: "success" });
    } else {
      // create new auto tag
      await createAutoTag({
        body: updatedAutoTag as CreateAutoTagDto,
      });
      toast("Auto tag has been created", { type: "success" });
    }

    handleClose();
  };

  const handleDelete = async () => {
    await deleteAutoTag({ path: { id: id as string } });
    toast("Auto tag has been deleted", { type: "success" });
    handleClose();
  };

  const handleTagCreate = async (inputValue: string) => {
    const created = await createTagName({
      body: { title: inputValue, code: "", color: getRandomColor() },
    });
    const newTag = created as TagNameDto as unknown as TagName;
    setSelectedTagName(newTag);
    if (!userModifiedName) setName(newTag.title || "");
  };

  const handleTagChanged = async (option: TagName | null) => {
    if (!option) {
      setSelectedTagName(null);
      if (!userModifiedName) setName("");
      return;
    }
    if ((option as TagName & { __isNew__?: boolean }).__isNew__) {
      const created = await createTagName({
        body: { title: option.title, code: "", color: getRandomColor() },
      });
      const newTag = created as TagNameDto as unknown as TagName;
      setSelectedTagName(newTag);
      if (!userModifiedName) setName(newTag.title || "");
    } else {
      setSelectedTagName(option);
      if (!userModifiedName) setName(option.title || "");
    }
  };

  return (
    <Modal
      open
      onClose={handleClose}
      classNames={{
        modal: "c-edit-auto-tag-modal",
        closeButton: "c-button c-button--small",
      }}
    >
      <h3>{id ? "Edit auto tag" : "Add auto tag"}</h3>

      <div className="c-form" ref={activePeriodRef}>
        <label>Tag name</label>
        <div className="flex flex-row items-center gap-2">
          <div className="w-2/3">
            <TagSelectSingle
              value={selectedTagName || null}
              onChange={handleTagChanged}
              onCreateOption={handleTagCreate}
              autoFocus={true}
            />
          </div>
          {selectedTagName?.id && (
            <a
              href={`/${ROUTE_PARTS.manage}/${ROUTE_PARTS.tagNames}/${selectedTagName.id}/${ROUTE_PARTS.edit}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-800 whitespace-nowrap text-sm"
            >
              Open tag
            </a>
          )}
        </div>

        <label>Auto tag Name</label>
        <input
          className="c-input"
          value={name}
          onChange={(evt: ChangeEvent<HTMLInputElement>) => {
            setUserModifiedName(true);
            setName(evt.target.value);
          }}
        />

        <label>Active period</label>
        <div className="c-edit-auto-tag-modal__active-period">
          <DateField
            className="c-edit-auto-tag-modal__active-period-date"
            ariaLabel="Active from"
            placement="bottomStart"
            container={() => activePeriodRef.current as HTMLDivElement}
            placeholder="Always"
            cleanable
            value={activeFrom}
            shouldDisableDate={(date) =>
              !!activeUntil && date > parseISO(activeUntil)
            }
            onChange={handleActiveFromChange}
          />
          <span className="c-edit-auto-tag-modal__active-period-arrow">→</span>
          <DateField
            className="c-edit-auto-tag-modal__active-period-date"
            ariaLabel="Active until"
            placement="bottomStart"
            container={() => activePeriodRef.current as HTMLDivElement}
            placeholder="Forever"
            cleanable
            value={activeUntil}
            shouldDisableDate={(date) =>
              !!activeFrom && date < parseISO(activeFrom)
            }
            onChange={handleActiveUntilChange}
          />
          <Tooltip
            content="Leave a date empty to leave that side unbounded. Both days are included, so a rule that ends on 31 March still tags activity on 31 March."
            placement="right"
          >
            <span
              className="c-edit-auto-tag-modal__active-period-info"
              tabIndex={0}
              role="img"
              aria-label="Leave a date empty to leave that side unbounded. Both days are included, so a rule that ends on 31 March still tags activity on 31 March."
            >
              <InfoIcon size={16} />
            </span>
          </Tooltip>
        </div>
        {QUICK_PICK_GROUPS.map((group) => (
          <div className="c-edit-auto-tag-modal__quick-picks" key={group}>
            {DATE_QUICK_PICKS.filter(
              (quickPick) => quickPick.group === group,
            ).map((quickPick) => (
              <button
                type="button"
                key={quickPick.label}
                aria-pressed={selectedQuickPicks.includes(quickPick.label)}
                className={
                  "c-edit-auto-tag-modal__quick-pick" +
                  (selectedQuickPicks.includes(quickPick.label)
                    ? " c-edit-auto-tag-modal__quick-pick--active"
                    : "")
                }
                onClick={() => handleToggleQuickPick(quickPick.label)}
              >
                {quickPick.label}
              </button>
            ))}
          </div>
        ))}
        <label>Conditions</label>
        <div>
          {!!conditions &&
            conditions.map((condition, i) => (
              <AutoTagConditionInput
                key={"auto-tag-condition__" + i}
                index={i}
                showBooleanOperator={i !== 0}
                {...conditions[i]}
                onChange={(booleanOperator, variable, operator, value) =>
                  handleChangeCondition(
                    i,
                    booleanOperator,
                    variable,
                    operator,
                    value,
                  )
                }
                onDelete={handleDeleteCondition}
                showDelete={conditions.length > 1}
              ></AutoTagConditionInput>
            ))}
        </div>
      </div>
      <div className="flex flex-row justify-between gap-2 mt-48">
        <div>
          {id && (
            <Button
              onClick={handleDelete}
              className="!bg-red-100 !text-red-700 hover:!bg-red-200"
            >
              Delete
            </Button>
          )}
        </div>
        <div className="flex flex-row gap-2">
          <Button onClick={handleClose} variant={ButtonVariant.Secondary}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant={ButtonVariant.Primary}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
