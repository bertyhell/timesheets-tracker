// generated with @7nohe/openapi-react-query-codegen@1.3.0 

import { UseMutationOptions, UseQueryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { ActiveStatesService, AutoNotesService, AutoTagsService, CalendarsService, ProgramsService, StatusService, TagNamesService, TagsService, TimelinesService, WebsitesService } from "../requests/services.gen";
import { CreateAutoNoteDto, CreateAutoTagDto, CreateCalendarDto, CreateTagDto, CreateTagNameDto, CreateTimelineDto, CreateWebsiteDto, UpdateAutoNoteDto, UpdateAutoTagsDto, UpdateCalendarDto, UpdateTagDto, UpdateTagNameDto, UpdateTimelineDto } from "../requests/types.gen";
import * as Common from "./common";
/**
* @returns unknown
* @throws ApiError
*/
export const useStatusServiceAppControllerStatus = <TData = Common.StatusServiceAppControllerStatusDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>(queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseStatusServiceAppControllerStatusKeyFn(), queryFn: () => StatusService.appControllerStatus() as TData, ...options });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @returns ResponseProgramDto Get a list of all programs
* @throws ApiError
*/
export const useProgramsServiceProgramsControllerFindAll = <TData = Common.ProgramsServiceProgramsControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseProgramsServiceProgramsControllerFindAllKeyFn({ endedAt, startedAt }, queryKey), queryFn: () => ProgramsService.programsControllerFindAll({ endedAt, startedAt }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useProgramsServiceProgramsControllerFindOne = <TData = Common.ProgramsServiceProgramsControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseProgramsServiceProgramsControllerFindOneKeyFn({ id }, queryKey), queryFn: () => ProgramsService.programsControllerFindOne({ id }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @returns ResponseActiveStateDto Get a list of all active states
* @throws ApiError
*/
export const useActiveStatesServiceActiveStatesControllerFindAll = <TData = Common.ActiveStatesServiceActiveStatesControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseActiveStatesServiceActiveStatesControllerFindAllKeyFn({ endedAt, startedAt }, queryKey), queryFn: () => ActiveStatesService.activeStatesControllerFindAll({ endedAt, startedAt }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useActiveStatesServiceActiveStatesControllerFindOne = <TData = Common.ActiveStatesServiceActiveStatesControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseActiveStatesServiceActiveStatesControllerFindOneKeyFn({ id }, queryKey), queryFn: () => ActiveStatesService.activeStatesControllerFindOne({ id }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @returns TagDto Get all tag entries filtered by date
* @throws ApiError
*/
export const useTagsServiceTagsControllerFindAll = <TData = Common.TagsServiceTagsControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseTagsServiceTagsControllerFindAllKeyFn({ endedAt, startedAt }, queryKey), queryFn: () => TagsService.tagsControllerFindAll({ endedAt, startedAt }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useTagsServiceTagsControllerFindOne = <TData = Common.TagsServiceTagsControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseTagsServiceTagsControllerFindOneKeyFn({ id }, queryKey), queryFn: () => TagsService.tagsControllerFindOne({ id }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.term
* @returns TagNameDto Get tag name entries optionally filtered by name
* @throws ApiError
*/
export const useTagNamesServiceTagNamesControllerFindAll = <TData = Common.TagNamesServiceTagNamesControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ term }: {
  term?: string;
} = {}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseTagNamesServiceTagNamesControllerFindAllKeyFn({ term }, queryKey), queryFn: () => TagNamesService.tagNamesControllerFindAll({ term }) as TData, ...options });
/**
* @returns number Count the number of tag names
* @throws ApiError
*/
export const useTagNamesServiceTagNamesControllerCount = <TData = Common.TagNamesServiceTagNamesControllerCountDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>(queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseTagNamesServiceTagNamesControllerCountKeyFn(), queryFn: () => TagNamesService.tagNamesControllerCount() as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns TagNameDto Get one tag name entry by id
* @throws ApiError
*/
export const useTagNamesServiceTagNamesControllerFindOne = <TData = Common.TagNamesServiceTagNamesControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseTagNamesServiceTagNamesControllerFindOneKeyFn({ id }, queryKey), queryFn: () => TagNamesService.tagNamesControllerFindOne({ id }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.term
* @returns AutoTagDto Get a list of auto tags optionally filtered by a term that should occur in the name of the tag
* @throws ApiError
*/
export const useAutoTagsServiceAutoTagsControllerFindAll = <TData = Common.AutoTagsServiceAutoTagsControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ term }: {
  term?: string;
} = {}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseAutoTagsServiceAutoTagsControllerFindAllKeyFn({ term }, queryKey), queryFn: () => AutoTagsService.autoTagsControllerFindAll({ term }) as TData, ...options });
/**
* @returns AutoTagCountDto Returns the number of auto tags that exist
* @throws ApiError
*/
export const useAutoTagsServiceAutoTagsControllerCount = <TData = Common.AutoTagsServiceAutoTagsControllerCountDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>(queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseAutoTagsServiceAutoTagsControllerCountKeyFn(), queryFn: () => AutoTagsService.autoTagsControllerCount() as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns AutoTagDto Return a single auto tag by id
* @throws ApiError
*/
export const useAutoTagsServiceAutoTagsControllerFindOne = <TData = Common.AutoTagsServiceAutoTagsControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseAutoTagsServiceAutoTagsControllerFindOneKeyFn({ id }, queryKey), queryFn: () => AutoTagsService.autoTagsControllerFindOne({ id }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @returns ResponseWebsiteDto Get a list of all websites
* @throws ApiError
*/
export const useWebsitesServiceWebsitesControllerFindAll = <TData = Common.WebsitesServiceWebsitesControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseWebsitesServiceWebsitesControllerFindAllKeyFn({ endedAt, startedAt }, queryKey), queryFn: () => WebsitesService.websitesControllerFindAll({ endedAt, startedAt }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useWebsitesServiceWebsitesControllerFindOne = <TData = Common.WebsitesServiceWebsitesControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseWebsitesServiceWebsitesControllerFindOneKeyFn({ id }, queryKey), queryFn: () => WebsitesService.websitesControllerFindOne({ id }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.term
* @returns AutoNoteDto Get autoNote entries optionally filtered by name
* @throws ApiError
*/
export const useAutoNotesServiceAutoNotesControllerFindAll = <TData = Common.AutoNotesServiceAutoNotesControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ term }: {
  term?: string;
} = {}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseAutoNotesServiceAutoNotesControllerFindAllKeyFn({ term }, queryKey), queryFn: () => AutoNotesService.autoNotesControllerFindAll({ term }) as TData, ...options });
/**
* @returns number Count the number of autoNotes
* @throws ApiError
*/
export const useAutoNotesServiceAutoNotesControllerCount = <TData = Common.AutoNotesServiceAutoNotesControllerCountDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>(queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseAutoNotesServiceAutoNotesControllerCountKeyFn(), queryFn: () => AutoNotesService.autoNotesControllerCount() as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns AutoNoteDto Get one autoNote entry by id
* @throws ApiError
*/
export const useAutoNotesServiceAutoNotesControllerFindOne = <TData = Common.AutoNotesServiceAutoNotesControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseAutoNotesServiceAutoNotesControllerFindOneKeyFn({ id }, queryKey), queryFn: () => AutoNotesService.autoNotesControllerFindOne({ id }) as TData, ...options });
/**
* @returns CalendarDto Get a list of all calendars
* @throws ApiError
*/
export const useCalendarsServiceCalendarsControllerFindAll = <TData = Common.CalendarsServiceCalendarsControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>(queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseCalendarsServiceCalendarsControllerFindAllKeyFn(), queryFn: () => CalendarsService.calendarsControllerFindAll() as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns CalendarDto Return a single calendar by id
* @throws ApiError
*/
export const useCalendarsServiceCalendarsControllerFindOne = <TData = Common.CalendarsServiceCalendarsControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseCalendarsServiceCalendarsControllerFindOneKeyFn({ id }, queryKey), queryFn: () => CalendarsService.calendarsControllerFindOne({ id }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @param data.startedAt Start timestamp in ISO format
* @param data.endedAt End timestamp in ISO format
* @returns CalendarEventDto Get events from a calendar for a given time range
* @throws ApiError
*/
export const useCalendarsServiceCalendarsControllerGetEvents = <TData = Common.CalendarsServiceCalendarsControllerGetEventsDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ endedAt, id, startedAt }: {
  endedAt: string;
  id: string;
  startedAt: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseCalendarsServiceCalendarsControllerGetEventsKeyFn({ endedAt, id, startedAt }, queryKey), queryFn: () => CalendarsService.calendarsControllerGetEvents({ endedAt, id, startedAt }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.term
* @returns TimelineDto Get a list of timelines optionally filtered by a term that should occur in the title of the timeline
* @throws ApiError
*/
export const useTimelinesServiceTimelinesControllerFindAll = <TData = Common.TimelinesServiceTimelinesControllerFindAllDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ term }: {
  term?: string;
} = {}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseTimelinesServiceTimelinesControllerFindAllKeyFn({ term }, queryKey), queryFn: () => TimelinesService.timelinesControllerFindAll({ term }) as TData, ...options });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @param data.term
* @param data.timelineIds
* @returns TimelineWithEventsDto Get a list of timelines with their events that happened within the specified time interval for all timelines that exist or one specific one
* @throws ApiError
*/
export const useTimelinesServiceTimelinesControllerFindAllEvents = <TData = Common.TimelinesServiceTimelinesControllerFindAllEventsDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ endedAt, startedAt, term, timelineIds }: {
  endedAt: string;
  startedAt: string;
  term?: string;
  timelineIds?: string[];
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseTimelinesServiceTimelinesControllerFindAllEventsKeyFn({ endedAt, startedAt, term, timelineIds }, queryKey), queryFn: () => TimelinesService.timelinesControllerFindAllEvents({ endedAt, startedAt, term, timelineIds }) as TData, ...options });
/**
* @returns TimelineCountDto Returns the number of timelines that exist
* @throws ApiError
*/
export const useTimelinesServiceTimelinesControllerCount = <TData = Common.TimelinesServiceTimelinesControllerCountDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>(queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseTimelinesServiceTimelinesControllerCountKeyFn(), queryFn: () => TimelinesService.timelinesControllerCount() as TData, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns TimelineDto Return a single timeline by id
* @throws ApiError
*/
export const useTimelinesServiceTimelinesControllerFindOne = <TData = Common.TimelinesServiceTimelinesControllerFindOneDefaultResponse, TError = unknown, TQueryKey extends Array<unknown> = unknown[]>({ id }: {
  id: string;
}, queryKey?: TQueryKey, options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useQuery<TData, TError>({ queryKey: Common.UseTimelinesServiceTimelinesControllerFindOneKeyFn({ id }, queryKey), queryFn: () => TimelinesService.timelinesControllerFindOne({ id }) as TData, ...options });
/**
* @returns unknown
* @throws ApiError
*/
export const useProgramsServiceProgramsControllerCreate = <TData = Common.ProgramsServiceProgramsControllerCreateMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, void, TContext>, "mutationFn">) => useMutation<TData, TError, void, TContext>({ mutationFn: () => ProgramsService.programsControllerCreate() as unknown as Promise<TData>, ...options });
/**
* @returns unknown
* @throws ApiError
*/
export const useActiveStatesServiceActiveStatesControllerCreate = <TData = Common.ActiveStatesServiceActiveStatesControllerCreateMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, void, TContext>, "mutationFn">) => useMutation<TData, TError, void, TContext>({ mutationFn: () => ActiveStatesService.activeStatesControllerCreate() as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.requestBody
* @returns TagDto Create a new tag entry
* @throws ApiError
*/
export const useTagsServiceTagsControllerCreate = <TData = Common.TagsServiceTagsControllerCreateMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  requestBody: CreateTagDto;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  requestBody: CreateTagDto;
}, TContext>({ mutationFn: ({ requestBody }) => TagsService.tagsControllerCreate({ requestBody }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.requestBody
* @returns TagNameDto Create a new tag name entry
* @throws ApiError
*/
export const useTagNamesServiceTagNamesControllerCreate = <TData = Common.TagNamesServiceTagNamesControllerCreateMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  requestBody: CreateTagNameDto;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  requestBody: CreateTagNameDto;
}, TContext>({ mutationFn: ({ requestBody }) => TagNamesService.tagNamesControllerCreate({ requestBody }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.requestBody
* @returns AutoTagDto Create an auto tag with conditions to identify when to apply the linked tagName to user activity
* @throws ApiError
*/
export const useAutoTagsServiceAutoTagsControllerCreate = <TData = Common.AutoTagsServiceAutoTagsControllerCreateMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  requestBody: CreateAutoTagDto;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  requestBody: CreateAutoTagDto;
}, TContext>({ mutationFn: ({ requestBody }) => AutoTagsService.autoTagsControllerCreate({ requestBody }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.requestBody
* @returns unknown
* @throws ApiError
*/
export const useWebsitesServiceWebsitesControllerCreate = <TData = Common.WebsitesServiceWebsitesControllerCreateMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  requestBody: CreateWebsiteDto;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  requestBody: CreateWebsiteDto;
}, TContext>({ mutationFn: ({ requestBody }) => WebsitesService.websitesControllerCreate({ requestBody }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.requestBody
* @returns AutoNoteDto Create a new autoNote rule
* @throws ApiError
*/
export const useAutoNotesServiceAutoNotesControllerCreate = <TData = Common.AutoNotesServiceAutoNotesControllerCreateMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  requestBody: CreateAutoNoteDto;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  requestBody: CreateAutoNoteDto;
}, TContext>({ mutationFn: ({ requestBody }) => AutoNotesService.autoNotesControllerCreate({ requestBody }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.requestBody
* @returns CalendarDto Create a calendar
* @throws ApiError
*/
export const useCalendarsServiceCalendarsControllerCreate = <TData = Common.CalendarsServiceCalendarsControllerCreateMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  requestBody: CreateCalendarDto;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  requestBody: CreateCalendarDto;
}, TContext>({ mutationFn: ({ requestBody }) => CalendarsService.calendarsControllerCreate({ requestBody }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.requestBody
* @returns TimelineDto Create a timeline that displays events from a specific event provider
* @throws ApiError
*/
export const useTimelinesServiceTimelinesControllerCreate = <TData = Common.TimelinesServiceTimelinesControllerCreateMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  requestBody: CreateTimelineDto;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  requestBody: CreateTimelineDto;
}, TContext>({ mutationFn: ({ requestBody }) => TimelinesService.timelinesControllerCreate({ requestBody }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.id
* @param data.requestBody
* @returns unknown
* @throws ApiError
*/
export const useTagsServiceTagsControllerUpdate = <TData = Common.TagsServiceTagsControllerUpdateMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  id: string;
  requestBody: UpdateTagDto;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  id: string;
  requestBody: UpdateTagDto;
}, TContext>({ mutationFn: ({ id, requestBody }) => TagsService.tagsControllerUpdate({ id, requestBody }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.id
* @param data.requestBody
* @returns unknown
* @throws ApiError
*/
export const useTagNamesServiceTagNamesControllerUpdate = <TData = Common.TagNamesServiceTagNamesControllerUpdateMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  id: string;
  requestBody: UpdateTagNameDto;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  id: string;
  requestBody: UpdateTagNameDto;
}, TContext>({ mutationFn: ({ id, requestBody }) => TagNamesService.tagNamesControllerUpdate({ id, requestBody }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.id
* @param data.requestBody
* @returns unknown
* @throws ApiError
*/
export const useAutoTagsServiceAutoTagsControllerUpdate = <TData = Common.AutoTagsServiceAutoTagsControllerUpdateMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  id: string;
  requestBody: UpdateAutoTagsDto;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  id: string;
  requestBody: UpdateAutoTagsDto;
}, TContext>({ mutationFn: ({ id, requestBody }) => AutoTagsService.autoTagsControllerUpdate({ id, requestBody }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.id
* @param data.requestBody
* @returns unknown
* @throws ApiError
*/
export const useAutoNotesServiceAutoNotesControllerUpdate = <TData = Common.AutoNotesServiceAutoNotesControllerUpdateMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  id: string;
  requestBody: UpdateAutoNoteDto;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  id: string;
  requestBody: UpdateAutoNoteDto;
}, TContext>({ mutationFn: ({ id, requestBody }) => AutoNotesService.autoNotesControllerUpdate({ id, requestBody }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.id
* @param data.requestBody
* @returns CalendarDto Update a calendar by id
* @throws ApiError
*/
export const useCalendarsServiceCalendarsControllerUpdate = <TData = Common.CalendarsServiceCalendarsControllerUpdateMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  id: string;
  requestBody: UpdateCalendarDto;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  id: string;
  requestBody: UpdateCalendarDto;
}, TContext>({ mutationFn: ({ id, requestBody }) => CalendarsService.calendarsControllerUpdate({ id, requestBody }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.id
* @param data.requestBody
* @returns unknown
* @throws ApiError
*/
export const useTimelinesServiceTimelinesControllerUpdate = <TData = Common.TimelinesServiceTimelinesControllerUpdateMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  id: string;
  requestBody: UpdateTimelineDto;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  id: string;
  requestBody: UpdateTimelineDto;
}, TContext>({ mutationFn: ({ id, requestBody }) => TimelinesService.timelinesControllerUpdate({ id, requestBody }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useProgramsServiceProgramsControllerDelete = <TData = Common.ProgramsServiceProgramsControllerDeleteMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  id: string;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  id: string;
}, TContext>({ mutationFn: ({ id }) => ProgramsService.programsControllerDelete({ id }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useActiveStatesServiceActiveStatesControllerDelete = <TData = Common.ActiveStatesServiceActiveStatesControllerDeleteMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  id: string;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  id: string;
}, TContext>({ mutationFn: ({ id }) => ActiveStatesService.activeStatesControllerDelete({ id }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown Delete one tag by id
* @throws ApiError
*/
export const useTagsServiceTagsControllerRemove = <TData = Common.TagsServiceTagsControllerRemoveMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  id: string;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  id: string;
}, TContext>({ mutationFn: ({ id }) => TagsService.tagsControllerRemove({ id }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useTagNamesServiceTagNamesControllerRemove = <TData = Common.TagNamesServiceTagNamesControllerRemoveMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  id: string;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  id: string;
}, TContext>({ mutationFn: ({ id }) => TagNamesService.tagNamesControllerRemove({ id }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useAutoTagsServiceAutoTagsControllerDelete = <TData = Common.AutoTagsServiceAutoTagsControllerDeleteMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  id: string;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  id: string;
}, TContext>({ mutationFn: ({ id }) => AutoTagsService.autoTagsControllerDelete({ id }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useWebsitesServiceWebsitesControllerDelete = <TData = Common.WebsitesServiceWebsitesControllerDeleteMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  id: string;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  id: string;
}, TContext>({ mutationFn: ({ id }) => WebsitesService.websitesControllerDelete({ id }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useAutoNotesServiceAutoNotesControllerRemove = <TData = Common.AutoNotesServiceAutoNotesControllerRemoveMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  id: string;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  id: string;
}, TContext>({ mutationFn: ({ id }) => AutoNotesService.autoNotesControllerRemove({ id }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useCalendarsServiceCalendarsControllerDelete = <TData = Common.CalendarsServiceCalendarsControllerDeleteMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  id: string;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  id: string;
}, TContext>({ mutationFn: ({ id }) => CalendarsService.calendarsControllerDelete({ id }) as unknown as Promise<TData>, ...options });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const useTimelinesServiceTimelinesControllerDelete = <TData = Common.TimelinesServiceTimelinesControllerDeleteMutationResult, TError = unknown, TContext = unknown>(options?: Omit<UseMutationOptions<TData, TError, {
  id: string;
}, TContext>, "mutationFn">) => useMutation<TData, TError, {
  id: string;
}, TContext>({ mutationFn: ({ id }) => TimelinesService.timelinesControllerDelete({ id }) as unknown as Promise<TData>, ...options });
