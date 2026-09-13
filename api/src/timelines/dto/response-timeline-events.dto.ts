import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ConditionOperator, ConditionVariable, TimelineType } from '../../types/types';

export class ActiveStateEventInfoDto {
  @IsBoolean()
  @ApiProperty({
    type: Boolean,
    description: 'Whether the user was active during this period',
    example: true,
    required: true,
  })
  isActive: boolean;
}

export class ProgramEventInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Name of the program that was active',
    example: 'Visual Studio Code',
    required: true,
  })
  programName: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Title of the active window within the program',
    example: 'Visual Studio Code: file.js',
    required: true,
  })
  windowTitle: string;
}

export class CalendarEventInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Summary / title of the calendar event',
    example: 'Team standup',
    required: true,
  })
  summary: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Description of the calendar event',
    example: 'Daily sync with the team',
    required: true,
  })
  description: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Location of the calendar event',
    example: 'Conference room A',
    required: true,
  })
  location: string;

  @IsBoolean()
  @ApiProperty({
    type: Boolean,
    description: 'Whether this is an all-day event',
    example: false,
    required: true,
  })
  allDay: boolean;
}

export class WebsiteEventInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'URL of the website that was visited',
    example: 'https://www.google.com',
    required: true,
  })
  websiteUrl: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Title of the website that was visited',
    example: 'Google',
    required: true,
  })
  websiteTitle: string;
}

export class TagEventInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Id of the tag name associated with this tag event',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  tagNameId: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Display name of the tag',
    example: 'Development',
    required: true,
  })
  tagNameName: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Color of the tag',
    example: '#FF5733',
    required: true,
  })
  tagNameColor: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Optional short code for the tag',
    example: 'DEV',
    required: false,
    nullable: true,
  })
  tagNameCode?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Optional note from the tag name definition',
    example: 'Bill to project X',
    required: false,
    nullable: true,
  })
  tagNameNote?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Optional note for this tag event, set manually or derived by an auto-note rule',
    example: 'ABC-123',
    required: false,
    nullable: true,
  })
  note?: string;
}

export class MatchedAutoTagConditionDto {
  @IsEnum(ConditionVariable)
  @Type(() => String)
  @ApiProperty({
    type: ConditionVariable,
    description: 'Variable of the event that the condition was checked against',
    enum: ConditionVariable,
    enumName: 'ConditionVariable',
    required: true,
  })
  variable: ConditionVariable;

  @IsEnum(ConditionOperator)
  @Type(() => String)
  @ApiProperty({
    type: ConditionOperator,
    description: 'Operator that was used to compare the variable with the value',
    enum: ConditionOperator,
    enumName: 'ConditionOperator',
    required: true,
  })
  operator: ConditionOperator;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Value the variable was compared against',
    example: 'jira',
    required: true,
  })
  value: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Value of the event variable that made this condition match',
    example: 'https://jira.company.com/browse/ABC-123',
    required: true,
  })
  matchedValue: string;
}

export class AutoTagEventInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Id of the auto tag rule that produced this event',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  autoTagId: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Id of the tag name associated with this tag event',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  tagNameId: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Display title of the tag',
    example: 'Development',
    required: true,
  })
  tagNameTitle: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Color of the tag',
    example: '#FF5733',
    required: true,
  })
  tagNameColor: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Optional short code for the tag',
    example: 'DEV',
    required: false,
    nullable: true,
  })
  tagNameCode?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Optional note from the tag name definition',
    example: 'Bill to project X',
    required: false,
    nullable: true,
  })
  tagNameNote?: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    type: Number,
    description: 'Priority of the auto tag that produced this event',
    example: 10,
    required: true,
  })
  priority: number;

  @IsArray()
  @IsOptional()
  @Type(() => MatchedAutoTagConditionDto)
  @ApiProperty({
    type: MatchedAutoTagConditionDto,
    isArray: true,
    description:
      'The conditions of the auto tag rule that were triggered by the source event. Empty for events that originate from a manual tag.',
    required: false,
  })
  matchedConditions?: MatchedAutoTagConditionDto[];
}

export class ProductiveEventInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Name of the Productive project / deal',
    example: 'My Project',
    required: true,
  })
  tagNameName: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Name of the Productive service associated with the booking',
    example: 'Support (in officehours)',
    required: false,
    nullable: true,
  })
  serviceName?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'First custom field value of the service (typically the project/deal label)',
    example: 'SHD-CPS (Meemoo) ARC Support 2026',
    required: false,
    nullable: true,
  })
  serviceProject?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Name of the Productive deal the booked service belongs to',
    example: 'Hermes Spoor 3 - AI metadata ontsluiten',
    required: false,
    nullable: true,
  })
  dealName?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Name of the company the deal belongs to',
    example: 'meemoo',
    required: false,
    nullable: true,
  })
  companyName?: string;
}

export class GitCommitEventInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Name of the git repository folder',
    example: 'my-project',
    required: true,
  })
  repoName: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Commit message / subject',
    example: 'Fix login bug',
    required: true,
  })
  commitMessage: string;
}

/**
 * Ticket info for a block of time spent on a single Jira ticket.
 *
 * Every property name here doubles as a ConditionVariable, so auto-tag rules can match on it — which
 * is why they all carry the `jira` prefix (a bare `summary` would collide with the calendar one) and
 * why the multi-value fields are comma-joined strings rather than arrays.
 */
export class JiraEventInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Key of the Jira issue that was visited',
    example: 'ABC-123',
    required: true,
  })
  jiraIssueKey: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Title of the Jira issue',
    example: 'Login button is misaligned on mobile',
    required: false,
  })
  jiraSummary?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Key of the Jira project ("space") the issue belongs to',
    example: 'ABC',
    required: false,
  })
  jiraProjectKey?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Name of the Jira project ("space") the issue belongs to',
    example: 'Acme Web Shop',
    required: false,
  })
  jiraProjectName?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Labels on the issue, comma separated',
    example: 'frontend, regression',
    required: false,
  })
  jiraLabels?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Fix versions of the issue, comma separated',
    example: '2.4.0',
    required: false,
  })
  jiraFixVersions?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Components of the issue, comma separated',
    example: 'Checkout, Payments',
    required: false,
  })
  jiraComponents?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Name of the sprint the issue is in (the most recent one when it spans several)',
    example: 'Sprint 42',
    required: false,
  })
  jiraSprint?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Display name of the assignee',
    example: 'Jane Doe',
    required: false,
  })
  jiraAssignee?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Display name of the reporter',
    example: 'John Roe',
    required: false,
  })
  jiraReporter?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Current status of the issue',
    example: 'In Progress',
    required: false,
  })
  jiraStatus?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Issue type',
    example: 'Bug',
    required: false,
  })
  jiraIssueType?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Priority of the issue',
    example: 'High',
    required: false,
  })
  jiraPriority?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Key of the parent issue / epic',
    example: 'ABC-100',
    required: false,
  })
  jiraParentKey?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Title of the parent issue / epic',
    example: 'Mobile checkout revamp',
    required: false,
  })
  jiraParentSummary?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Link to the issue in Jira',
    example: 'https://your-org.atlassian.net/browse/ABC-123',
    required: false,
  })
  jiraUrl?: string;
}

/**
 * The file worked on during a block of editing time, read from the IDE's local history.
 *
 * `repoName` deliberately reuses the ConditionVariable the git commit timeline already defines, so
 * a single auto-tag rule on a repository name attributes both commits and editing time to the same
 * client.
 */
export class FileEditEventInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Name of the edited file',
    example: 'timelines.service.ts',
    required: true,
  })
  fileName: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Path of the edited file, relative to the repository root',
    example: 'api/src/timelines/timelines.service.ts',
    required: true,
  })
  filePath: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Name of the repository folder the file belongs to',
    example: 'timesheets-tracker',
    required: true,
  })
  repoName: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Extension of the edited file, without the leading dot',
    example: 'ts',
    required: true,
  })
  fileExtension: string;

  @IsNumber()
  @ApiProperty({
    type: Number,
    description: 'How many revisions the IDE recorded during this block of editing',
    example: 12,
    required: true,
  })
  editCount: number;
}

export class TimelineEventDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Uuid of the event',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  id: string;

  @IsObject()
  @ApiProperty({
    description: 'Type-specific info for this event. Varies based on the timeline type.',
    oneOf: [
      { $ref: getSchemaPath(ActiveStateEventInfoDto) },
      { $ref: getSchemaPath(ProgramEventInfoDto) },
      { $ref: getSchemaPath(CalendarEventInfoDto) },
      { $ref: getSchemaPath(WebsiteEventInfoDto) },
      { $ref: getSchemaPath(TagEventInfoDto) },
      { $ref: getSchemaPath(AutoTagEventInfoDto) },
      { $ref: getSchemaPath(GitCommitEventInfoDto) },
      { $ref: getSchemaPath(ProductiveEventInfoDto) },
      { $ref: getSchemaPath(JiraEventInfoDto) },
      { $ref: getSchemaPath(FileEditEventInfoDto) },
    ],
  })
  info:
    | ActiveStateEventInfoDto
    | ProgramEventInfoDto
    | CalendarEventInfoDto
    | WebsiteEventInfoDto
    | TagEventInfoDto
    | AutoTagEventInfoDto
    | GitCommitEventInfoDto
    | ProductiveEventInfoDto
    | JiraEventInfoDto
    | FileEditEventInfoDto;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Color of the event',
    example: '#FF5733',
    required: false,
  })
  color?: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Start time in iso format',
    example: '2023-01-01T13:00:00.000Z',
    required: true,
  })
  startedAt: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'End time in ISO format',
    example: '2023-01-01T14:00:00.000Z',
    required: true,
  })
  endedAt: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Uuid of the timeline',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  timelineId: string;
}

export class TimelineWithEventsDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Id of the timeline',
  })
  id: string;

  @IsEnum(TimelineType)
  @Type(() => String)
  @ApiProperty({
    type: TimelineType,
    description: 'Type of the timeline',
    examples: ['Program', 'Website'],
    enum: TimelineType,
    enumName: 'TimelineType',
  })
  type: TimelineType;

  @IsArray()
  @Type(() => Object)
  @ApiProperty({
    type: TimelineEventDto,
    isArray: true,
    description: 'event that happened at a certain start and endtime and has some info',
  })
  events: TimelineEventDto[];
}
