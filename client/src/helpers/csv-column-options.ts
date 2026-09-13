import { CsvColumnValue, CsvDelimiter, CsvValueFormat } from '../types/types';
import { formatCsvValue, type CsvExportRow } from './csv-export';

export const CSV_COLUMN_VALUE_OPTIONS: { value: CsvColumnValue; label: string }[] = [
  { value: CsvColumnValue.TagName, label: 'Tag name' },
  { value: CsvColumnValue.TagCode, label: 'Tag code' },
  { value: CsvColumnValue.TagNote, label: 'Tag note' },
  { value: CsvColumnValue.Notes, label: 'Notes' },
  { value: CsvColumnValue.Duration, label: 'Hours worked' },
  { value: CsvColumnValue.Start, label: 'Start' },
  { value: CsvColumnValue.End, label: 'End' },
  { value: CsvColumnValue.Date, label: 'Date' },
  { value: CsvColumnValue.TimelineName, label: 'Timeline name' },
  { value: CsvColumnValue.StaticText, label: 'Fixed text' },
];

type FormatFamily = 'duration' | 'time' | 'date';

export interface FormatOption {
  value: CsvValueFormat;
  /** The pattern itself, shown on the left. */
  label: string;
  /** What that pattern produces, shown on the right. */
  example: string;
}

/**
 * The row every format example is rendered from: Tuesday 25 August 2026, 14:05, seven and a half
 * hours long.
 *
 * The day is deliberately past the 12th so that `dd/MM/yyyy` and `MM/dd/yyyy` cannot be confused
 * for one another in the examples — the whole point of showing them.
 */
const SAMPLE_ROW: CsvExportRow = {
  tagNameId: 'sample',
  tagName: 'Development',
  tagCode: 'DEV',
  tagNote: '',
  notes: [],
  hours: 7.5,
  startedAt: new Date(2026, 7, 25, 14, 5, 9).toISOString(),
  endedAt: new Date(2026, 7, 25, 21, 35, 9).toISOString(),
  date: '2026-08-25',
  timelineName: 'Tags',
};

/**
 * Examples are produced by the exporter itself rather than typed out here, so the preview in the
 * dropdown is the same string the file will contain — they cannot drift apart.
 */
function withExample(value: CsvValueFormat, label: string, of: CsvColumnValue): FormatOption {
  return {
    value,
    label,
    example: formatCsvValue(SAMPLE_ROW, {
      id: '',
      header: '',
      value: of,
      format: value,
      staticText: '',
      visualOrder: 0,
    }),
  };
}

/** Which formats a value can take, or null for the text values, which have nothing to format. */
const FORMAT_FAMILY_BY_VALUE: Record<CsvColumnValue, FormatFamily | null> = {
  [CsvColumnValue.TagName]: null,
  [CsvColumnValue.TagCode]: null,
  [CsvColumnValue.TagNote]: null,
  [CsvColumnValue.Notes]: null,
  [CsvColumnValue.TimelineName]: null,
  [CsvColumnValue.StaticText]: null,
  [CsvColumnValue.Duration]: 'duration',
  [CsvColumnValue.Start]: 'time',
  [CsvColumnValue.End]: 'time',
  [CsvColumnValue.Date]: 'date',
};

/**
 * Labels drop the family prefix the enum carries — the user picking a format for "Hours worked"
 * already knows it is a duration, and "duration:HH:mm" would only be noise in the dropdown.
 */
const FORMAT_OPTIONS_BY_FAMILY: Record<FormatFamily, FormatOption[]> = {
  duration: [
    withExample(CsvValueFormat.DurationHoursMinutes, 'HH:mm', CsvColumnValue.Duration),
    withExample(CsvValueFormat.DurationHoursMinutesSeconds, 'HH:mm:ss', CsvColumnValue.Duration),
    withExample(CsvValueFormat.DurationDecimalOne, 'HH.H', CsvColumnValue.Duration),
    withExample(CsvValueFormat.DurationDecimalTwo, 'HH.HH', CsvColumnValue.Duration),
    withExample(CsvValueFormat.DurationMinutes, 'Minutes', CsvColumnValue.Duration),
    withExample(CsvValueFormat.DurationHuman, 'Hh Mm', CsvColumnValue.Duration),
  ],
  time: [
    withExample(CsvValueFormat.TimeHoursMinutes, 'HH:mm', CsvColumnValue.Start),
    withExample(CsvValueFormat.TimeHoursMinutesSeconds, 'HH:mm:ss', CsvColumnValue.Start),
    withExample(CsvValueFormat.TimeDateAndHoursMinutes, 'yyyy-MM-dd HH:mm', CsvColumnValue.Start),
    withExample(CsvValueFormat.TimeIso, 'ISO 8601', CsvColumnValue.Start),
  ],
  date: [
    withExample(CsvValueFormat.DateIso, 'yyyy-MM-dd', CsvColumnValue.Date),
    withExample(CsvValueFormat.DateDayMonthYearSlash, 'dd/MM/yyyy', CsvColumnValue.Date),
    withExample(CsvValueFormat.DateMonthDayYearSlash, 'MM/dd/yyyy', CsvColumnValue.Date),
    withExample(CsvValueFormat.DateDayMonthYearDash, 'dd-MM-yyyy', CsvColumnValue.Date),
    withExample(CsvValueFormat.DateWeekdayShort, 'EEE dd/MM/yyyy', CsvColumnValue.Date),
    withExample(CsvValueFormat.DateWeekdayLong, 'EEEE dd/MM/yyyy', CsvColumnValue.Date),
  ],
};

export function formatOptionsForValue(value: CsvColumnValue): FormatOption[] {
  const family = FORMAT_FAMILY_BY_VALUE[value];
  return family ? FORMAT_OPTIONS_BY_FAMILY[family] : [];
}

/**
 * The format to fall back to when the value changes — the old one belongs to another family and
 * would silently render as that family's default anyway.
 */
export function defaultFormatForValue(value: CsvColumnValue): CsvValueFormat | '' {
  return formatOptionsForValue(value)[0]?.value ?? '';
}

export const CSV_DELIMITER_OPTIONS: { value: CsvDelimiter; label: string }[] = [
  { value: CsvDelimiter.Comma, label: 'Comma  ,' },
  { value: CsvDelimiter.Semicolon, label: 'Semicolon  ;' },
  { value: CsvDelimiter.Tab, label: 'Tab' },
];
