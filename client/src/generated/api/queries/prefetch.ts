// generated with @7nohe/openapi-react-query-codegen@1.3.0 

import { type QueryClient } from "@tanstack/react-query";
import { ActiveStatesService, ActivitiesService, AutoNotesService, AutoTagsService, CalendarsService, StatusService, TagNamesService, TagsService, WebsitesService } from "../requests/services.gen";
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
* @returns unknown
* @throws ApiError
*/
export const prefetchUseActivitiesServiceActivitiesControllerFindAll = (queryClient: QueryClient, { endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useActivitiesServiceActivitiesControllerFindAllKey, [{ endedAt, startedAt }]], queryFn: () => ActivitiesService.activitiesControllerFindAll({ endedAt, startedAt }) });
/**
* @param data The data for the request.
* @param data.id
* @returns unknown
* @throws ApiError
*/
export const prefetchUseActivitiesServiceActivitiesControllerFindOne = (queryClient: QueryClient, { id }: {
  id: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useActivitiesServiceActivitiesControllerFindOneKey, [{ id }]], queryFn: () => ActivitiesService.activitiesControllerFindOne({ id }) });
/**
* @param data The data for the request.
* @param data.startedAt
* @param data.endedAt
* @returns unknown
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
* @returns unknown
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
* @param data.start Start timestamp in ISO format
* @param data.end End timestamp in ISO format
* @returns unknown Get events from a calendar for a given time range
* @throws ApiError
*/
export const prefetchUseCalendarsServiceCalendarsControllerGetEvents = (queryClient: QueryClient, { end, id, start }: {
  end: string;
  id: string;
  start: string;
}) => queryClient.prefetchQuery({ queryKey: [Common.useCalendarsServiceCalendarsControllerGetEventsKey, [{ end, id, start }]], queryFn: () => CalendarsService.calendarsControllerGetEvents({ end, id, start }) });
