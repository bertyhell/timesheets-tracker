// generated with @7nohe/openapi-react-query-codegen@1.3.0 

import { type QueryClient } from "@tanstack/react-query";
import { ActiveStatesService, AutoNotesService, AutoTagsService, CalendarsService, ProgramsService, StatusService, TagNamesService, TagsService, TimelinesService, WebsitesService } from "../requests/services.gen";
import * as Common from "./common";
/**
* @returns unknown
* @throws ApiError
*/
export const prefetchUseStatusServiceAppControllerStatus = (queryClient: QueryClient) => queryClient.prefetchQuery({ queryKey: [Common.useStatusServiceAppControllerStatusKey, []], queryFn: () => StatusService.appControllerStatus() });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @returns ResponseProgramDto Get a list of all programs
* @throws ApiError
*/
export const prefetchUseProgramsServiceProgramsControllerFindAll = (queryClient: QueryClient, { endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useProgramsServiceProgramsControllerFindAllKey, [{ endedAt, startedAt }]], queryFn: () => ProgramsService.programsControllerFindAll({ endedAt, startedAt }) });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const prefetchUseProgramsServiceProgramsControllerFindOne = (queryClient: QueryClient, { id }: {
  id: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useProgramsServiceProgramsControllerFindOneKey, [{ id }]], queryFn: () => ProgramsService.programsControllerFindOne({ id }) });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @returns ResponseActiveStateDto Get a list of all active states
* @throws ApiError
*/
export const prefetchUseActiveStatesServiceActiveStatesControllerFindAll = (queryClient: QueryClient, { endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useActiveStatesServiceActiveStatesControllerFindAllKey, [{ endedAt, startedAt }]], queryFn: () => ActiveStatesService.activeStatesControllerFindAll({ endedAt, startedAt }) });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const prefetchUseActiveStatesServiceActiveStatesControllerFindOne = (queryClient: QueryClient, { id }: {
  id: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useActiveStatesServiceActiveStatesControllerFindOneKey, [{ id }]], queryFn: () => ActiveStatesService.activeStatesControllerFindOne({ id }) });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @returns TagDto Get all tag entries filtered by date
* @throws ApiError
*/
export const prefetchUseTagsServiceTagsControllerFindAll = (queryClient: QueryClient, { endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useTagsServiceTagsControllerFindAllKey, [{ endedAt, startedAt }]], queryFn: () => TagsService.tagsControllerFindAll({ endedAt, startedAt }) });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const prefetchUseTagsServiceTagsControllerFindOne = (queryClient: QueryClient, { id }: {
  id: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useTagsServiceTagsControllerFindOneKey, [{ id }]], queryFn: () => TagsService.tagsControllerFindOne({ id }) });
/**
* @param data The data for the request.
* @param data.term
* @returns TagNameDto Get tag name entries optionally filtered by name
* @throws ApiError
*/
export const prefetchUseTagNamesServiceTagNamesControllerFindAll = (queryClient: QueryClient, { term }: {
  term?: string;
} = {}) => queryClient.prefetchQuery({ queryKey: [Common.useTagNamesServiceTagNamesControllerFindAllKey, [{ term }]], queryFn: () => TagNamesService.tagNamesControllerFindAll({ term }) });
/**
* @returns number Count the number of tag names
* @throws ApiError
*/
export const prefetchUseTagNamesServiceTagNamesControllerCount = (queryClient: QueryClient) => queryClient.prefetchQuery({ queryKey: [Common.useTagNamesServiceTagNamesControllerCountKey, []], queryFn: () => TagNamesService.tagNamesControllerCount() });
/**
* @param data The data for the request.
* @param data.id
* @returns TagNameDto Get one tag name entry by id
* @throws ApiError
*/
export const prefetchUseTagNamesServiceTagNamesControllerFindOne = (queryClient: QueryClient, { id }: {
  id: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useTagNamesServiceTagNamesControllerFindOneKey, [{ id }]], queryFn: () => TagNamesService.tagNamesControllerFindOne({ id }) });
/**
* @param data The data for the request.
* @param data.term
* @returns AutoTagDto Get a list of auto tags optionally filtered by a term that should occur in the name of the tag
* @throws ApiError
*/
export const prefetchUseAutoTagsServiceAutoTagsControllerFindAll = (queryClient: QueryClient, { term }: {
  term?: string;
} = {}) => queryClient.prefetchQuery({ queryKey: [Common.useAutoTagsServiceAutoTagsControllerFindAllKey, [{ term }]], queryFn: () => AutoTagsService.autoTagsControllerFindAll({ term }) });
/**
* @returns AutoTagCountDto Returns the number of auto tags that exist
* @throws ApiError
*/
export const prefetchUseAutoTagsServiceAutoTagsControllerCount = (queryClient: QueryClient) => queryClient.prefetchQuery({ queryKey: [Common.useAutoTagsServiceAutoTagsControllerCountKey, []], queryFn: () => AutoTagsService.autoTagsControllerCount() });
/**
* @param data The data for the request.
* @param data.id
* @returns AutoTagDto Return a single auto tag by id
* @throws ApiError
*/
export const prefetchUseAutoTagsServiceAutoTagsControllerFindOne = (queryClient: QueryClient, { id }: {
  id: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useAutoTagsServiceAutoTagsControllerFindOneKey, [{ id }]], queryFn: () => AutoTagsService.autoTagsControllerFindOne({ id }) });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @returns ResponseWebsiteDto Get a list of all websites
* @throws ApiError
*/
export const prefetchUseWebsitesServiceWebsitesControllerFindAll = (queryClient: QueryClient, { endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useWebsitesServiceWebsitesControllerFindAllKey, [{ endedAt, startedAt }]], queryFn: () => WebsitesService.websitesControllerFindAll({ endedAt, startedAt }) });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const prefetchUseWebsitesServiceWebsitesControllerFindOne = (queryClient: QueryClient, { id }: {
  id: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useWebsitesServiceWebsitesControllerFindOneKey, [{ id }]], queryFn: () => WebsitesService.websitesControllerFindOne({ id }) });
/**
* @param data The data for the request.
* @param data.term
* @returns AutoNoteDto Get autoNote entries optionally filtered by name
* @throws ApiError
*/
export const prefetchUseAutoNotesServiceAutoNotesControllerFindAll = (queryClient: QueryClient, { term }: {
  term?: string;
} = {}) => queryClient.prefetchQuery({ queryKey: [Common.useAutoNotesServiceAutoNotesControllerFindAllKey, [{ term }]], queryFn: () => AutoNotesService.autoNotesControllerFindAll({ term }) });
/**
* @returns number Count the number of autoNotes
* @throws ApiError
*/
export const prefetchUseAutoNotesServiceAutoNotesControllerCount = (queryClient: QueryClient) => queryClient.prefetchQuery({ queryKey: [Common.useAutoNotesServiceAutoNotesControllerCountKey, []], queryFn: () => AutoNotesService.autoNotesControllerCount() });
/**
* @param data The data for the request.
* @param data.id
* @returns AutoNoteDto Get one autoNote entry by id
* @throws ApiError
*/
export const prefetchUseAutoNotesServiceAutoNotesControllerFindOne = (queryClient: QueryClient, { id }: {
  id: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useAutoNotesServiceAutoNotesControllerFindOneKey, [{ id }]], queryFn: () => AutoNotesService.autoNotesControllerFindOne({ id }) });
/**
* @returns CalendarDto Get a list of all calendars
* @throws ApiError
*/
export const prefetchUseCalendarsServiceCalendarsControllerFindAll = (queryClient: QueryClient) => queryClient.prefetchQuery({ queryKey: [Common.useCalendarsServiceCalendarsControllerFindAllKey, []], queryFn: () => CalendarsService.calendarsControllerFindAll() });
/**
* @param data The data for the request.
* @param data.id
* @returns CalendarDto Return a single calendar by id
* @throws ApiError
*/
export const prefetchUseCalendarsServiceCalendarsControllerFindOne = (queryClient: QueryClient, { id }: {
  id: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useCalendarsServiceCalendarsControllerFindOneKey, [{ id }]], queryFn: () => CalendarsService.calendarsControllerFindOne({ id }) });
/**
* @param data The data for the request.
* @param data.id
* @param data.startedAt Start timestamp in ISO format
* @param data.endedAt End timestamp in ISO format
* @returns CalendarEventDto Get events from a calendar for a given time range
* @throws ApiError
*/
export const prefetchUseCalendarsServiceCalendarsControllerGetEvents = (queryClient: QueryClient, { endedAt, id, startedAt }: {
  endedAt: string;
  id: string;
  startedAt: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useCalendarsServiceCalendarsControllerGetEventsKey, [{ endedAt, id, startedAt }]], queryFn: () => CalendarsService.calendarsControllerGetEvents({ endedAt, id, startedAt }) });
/**
* @param data The data for the request.
* @param data.term
* @returns TimelineDto Get a list of timelines optionally filtered by a term that should occur in the title of the timeline
* @throws ApiError
*/
export const prefetchUseTimelinesServiceTimelinesControllerFindAll = (queryClient: QueryClient, { term }: {
  term?: string;
} = {}) => queryClient.prefetchQuery({ queryKey: [Common.useTimelinesServiceTimelinesControllerFindAllKey, [{ term }]], queryFn: () => TimelinesService.timelinesControllerFindAll({ term }) });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @param data.term
* @param data.timelineIds
* @returns TimelineWithEventsDto Get a list of timelines with their events that happened within the specified time interval for all timelines that exist or one specific one
* @throws ApiError
*/
export const prefetchUseTimelinesServiceTimelinesControllerFindAllEvents = (queryClient: QueryClient, { endedAt, startedAt, term, timelineIds }: {
  endedAt: string;
  startedAt: string;
  term?: string;
  timelineIds?: string[];
}) => queryClient.prefetchQuery({ queryKey: [Common.useTimelinesServiceTimelinesControllerFindAllEventsKey, [{ endedAt, startedAt, term, timelineIds }]], queryFn: () => TimelinesService.timelinesControllerFindAllEvents({ endedAt, startedAt, term, timelineIds }) });
/**
* @returns TimelineCountDto Returns the number of timelines that exist
* @throws ApiError
*/
export const prefetchUseTimelinesServiceTimelinesControllerCount = (queryClient: QueryClient) => queryClient.prefetchQuery({ queryKey: [Common.useTimelinesServiceTimelinesControllerCountKey, []], queryFn: () => TimelinesService.timelinesControllerCount() });
/**
* @param data The data for the request.
* @param data.id
* @returns TimelineDto Return a single timeline by id
* @throws ApiError
*/
export const prefetchUseTimelinesServiceTimelinesControllerFindOne = (queryClient: QueryClient, { id }: {
  id: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useTimelinesServiceTimelinesControllerFindOneKey, [{ id }]], queryFn: () => TimelinesService.timelinesControllerFindOne({ id }) });
