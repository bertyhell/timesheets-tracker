// generated with @7nohe/openapi-react-query-codegen@1.3.0 

import { UseQueryResult } from "@tanstack/react-query";
import { ActiveStatesService, ActivitiesService, AutoNotesService, AutoTagsService, StatusService, TagNamesService, TagsService, WebsitesService } from "../requests/services.gen";
export type StatusServiceAppControllerStatusDefaultResponse = Awaited<ReturnType<typeof StatusService.appControllerStatus>>;
export type StatusServiceAppControllerStatusQueryResult<TData = StatusServiceAppControllerStatusDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useStatusServiceAppControllerStatusKey = "StatusServiceAppControllerStatus";
export const UseStatusServiceAppControllerStatusKeyFn = () => [useStatusServiceAppControllerStatusKey];
export type ActivitiesServiceActivitiesControllerFindAllDefaultResponse = Awaited<ReturnType<typeof ActivitiesService.activitiesControllerFindAll>>;
export type ActivitiesServiceActivitiesControllerFindAllQueryResult<TData = ActivitiesServiceActivitiesControllerFindAllDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useActivitiesServiceActivitiesControllerFindAllKey = "ActivitiesServiceActivitiesControllerFindAll";
export const UseActivitiesServiceActivitiesControllerFindAllKeyFn = ({ endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}, queryKey?: Array<unknown>) => [useActivitiesServiceActivitiesControllerFindAllKey, ...(queryKey ?? [{ endedAt, startedAt }])];
export type ActivitiesServiceActivitiesControllerFindOneDefaultResponse = Awaited<ReturnType<typeof ActivitiesService.activitiesControllerFindOne>>;
export type ActivitiesServiceActivitiesControllerFindOneQueryResult<TData = ActivitiesServiceActivitiesControllerFindOneDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useActivitiesServiceActivitiesControllerFindOneKey = "ActivitiesServiceActivitiesControllerFindOne";
export const UseActivitiesServiceActivitiesControllerFindOneKeyFn = ({ id }: {
  id: string;
}, queryKey?: Array<unknown>) => [useActivitiesServiceActivitiesControllerFindOneKey, ...(queryKey ?? [{ id }])];
export type ActiveStatesServiceActiveStatesControllerFindAllDefaultResponse = Awaited<ReturnType<typeof ActiveStatesService.activeStatesControllerFindAll>>;
export type ActiveStatesServiceActiveStatesControllerFindAllQueryResult<TData = ActiveStatesServiceActiveStatesControllerFindAllDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useActiveStatesServiceActiveStatesControllerFindAllKey = "ActiveStatesServiceActiveStatesControllerFindAll";
export const UseActiveStatesServiceActiveStatesControllerFindAllKeyFn = ({ endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}, queryKey?: Array<unknown>) => [useActiveStatesServiceActiveStatesControllerFindAllKey, ...(queryKey ?? [{ endedAt, startedAt }])];
export type ActiveStatesServiceActiveStatesControllerFindOneDefaultResponse = Awaited<ReturnType<typeof ActiveStatesService.activeStatesControllerFindOne>>;
export type ActiveStatesServiceActiveStatesControllerFindOneQueryResult<TData = ActiveStatesServiceActiveStatesControllerFindOneDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useActiveStatesServiceActiveStatesControllerFindOneKey = "ActiveStatesServiceActiveStatesControllerFindOne";
export const UseActiveStatesServiceActiveStatesControllerFindOneKeyFn = ({ id }: {
  id: string;
}, queryKey?: Array<unknown>) => [useActiveStatesServiceActiveStatesControllerFindOneKey, ...(queryKey ?? [{ id }])];
export type TagsServiceTagsControllerFindAllDefaultResponse = Awaited<ReturnType<typeof TagsService.tagsControllerFindAll>>;
export type TagsServiceTagsControllerFindAllQueryResult<TData = TagsServiceTagsControllerFindAllDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useTagsServiceTagsControllerFindAllKey = "TagsServiceTagsControllerFindAll";
export const UseTagsServiceTagsControllerFindAllKeyFn = ({ endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}, queryKey?: Array<unknown>) => [useTagsServiceTagsControllerFindAllKey, ...(queryKey ?? [{ endedAt, startedAt }])];
export type TagsServiceTagsControllerFindOneDefaultResponse = Awaited<ReturnType<typeof TagsService.tagsControllerFindOne>>;
export type TagsServiceTagsControllerFindOneQueryResult<TData = TagsServiceTagsControllerFindOneDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useTagsServiceTagsControllerFindOneKey = "TagsServiceTagsControllerFindOne";
export const UseTagsServiceTagsControllerFindOneKeyFn = ({ id }: {
  id: string;
}, queryKey?: Array<unknown>) => [useTagsServiceTagsControllerFindOneKey, ...(queryKey ?? [{ id }])];
export type TagNamesServiceTagNamesControllerFindAllDefaultResponse = Awaited<ReturnType<typeof TagNamesService.tagNamesControllerFindAll>>;
export type TagNamesServiceTagNamesControllerFindAllQueryResult<TData = TagNamesServiceTagNamesControllerFindAllDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useTagNamesServiceTagNamesControllerFindAllKey = "TagNamesServiceTagNamesControllerFindAll";
export const UseTagNamesServiceTagNamesControllerFindAllKeyFn = ({ term }: {
  term?: string;
} = {}, queryKey?: Array<unknown>) => [useTagNamesServiceTagNamesControllerFindAllKey, ...(queryKey ?? [{ term }])];
export type TagNamesServiceTagNamesControllerCountDefaultResponse = Awaited<ReturnType<typeof TagNamesService.tagNamesControllerCount>>;
export type TagNamesServiceTagNamesControllerCountQueryResult<TData = TagNamesServiceTagNamesControllerCountDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useTagNamesServiceTagNamesControllerCountKey = "TagNamesServiceTagNamesControllerCount";
export const UseTagNamesServiceTagNamesControllerCountKeyFn = () => [useTagNamesServiceTagNamesControllerCountKey];
export type TagNamesServiceTagNamesControllerFindOneDefaultResponse = Awaited<ReturnType<typeof TagNamesService.tagNamesControllerFindOne>>;
export type TagNamesServiceTagNamesControllerFindOneQueryResult<TData = TagNamesServiceTagNamesControllerFindOneDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useTagNamesServiceTagNamesControllerFindOneKey = "TagNamesServiceTagNamesControllerFindOne";
export const UseTagNamesServiceTagNamesControllerFindOneKeyFn = ({ id }: {
  id: string;
}, queryKey?: Array<unknown>) => [useTagNamesServiceTagNamesControllerFindOneKey, ...(queryKey ?? [{ id }])];
export type AutoTagsServiceAutoTagsControllerFindAllDefaultResponse = Awaited<ReturnType<typeof AutoTagsService.autoTagsControllerFindAll>>;
export type AutoTagsServiceAutoTagsControllerFindAllQueryResult<TData = AutoTagsServiceAutoTagsControllerFindAllDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useAutoTagsServiceAutoTagsControllerFindAllKey = "AutoTagsServiceAutoTagsControllerFindAll";
export const UseAutoTagsServiceAutoTagsControllerFindAllKeyFn = ({ term }: {
  term?: string;
} = {}, queryKey?: Array<unknown>) => [useAutoTagsServiceAutoTagsControllerFindAllKey, ...(queryKey ?? [{ term }])];
export type AutoTagsServiceAutoTagsControllerCountDefaultResponse = Awaited<ReturnType<typeof AutoTagsService.autoTagsControllerCount>>;
export type AutoTagsServiceAutoTagsControllerCountQueryResult<TData = AutoTagsServiceAutoTagsControllerCountDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useAutoTagsServiceAutoTagsControllerCountKey = "AutoTagsServiceAutoTagsControllerCount";
export const UseAutoTagsServiceAutoTagsControllerCountKeyFn = () => [useAutoTagsServiceAutoTagsControllerCountKey];
export type AutoTagsServiceAutoTagsControllerFindOneDefaultResponse = Awaited<ReturnType<typeof AutoTagsService.autoTagsControllerFindOne>>;
export type AutoTagsServiceAutoTagsControllerFindOneQueryResult<TData = AutoTagsServiceAutoTagsControllerFindOneDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useAutoTagsServiceAutoTagsControllerFindOneKey = "AutoTagsServiceAutoTagsControllerFindOne";
export const UseAutoTagsServiceAutoTagsControllerFindOneKeyFn = ({ id }: {
  id: string;
}, queryKey?: Array<unknown>) => [useAutoTagsServiceAutoTagsControllerFindOneKey, ...(queryKey ?? [{ id }])];
export type WebsitesServiceWebsitesControllerFindAllDefaultResponse = Awaited<ReturnType<typeof WebsitesService.websitesControllerFindAll>>;
export type WebsitesServiceWebsitesControllerFindAllQueryResult<TData = WebsitesServiceWebsitesControllerFindAllDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useWebsitesServiceWebsitesControllerFindAllKey = "WebsitesServiceWebsitesControllerFindAll";
export const UseWebsitesServiceWebsitesControllerFindAllKeyFn = ({ endedAt, startedAt }: {
  endedAt: string;
  startedAt: string;
}, queryKey?: Array<unknown>) => [useWebsitesServiceWebsitesControllerFindAllKey, ...(queryKey ?? [{ endedAt, startedAt }])];
export type WebsitesServiceWebsitesControllerFindOneDefaultResponse = Awaited<ReturnType<typeof WebsitesService.websitesControllerFindOne>>;
export type WebsitesServiceWebsitesControllerFindOneQueryResult<TData = WebsitesServiceWebsitesControllerFindOneDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useWebsitesServiceWebsitesControllerFindOneKey = "WebsitesServiceWebsitesControllerFindOne";
export const UseWebsitesServiceWebsitesControllerFindOneKeyFn = ({ id }: {
  id: string;
}, queryKey?: Array<unknown>) => [useWebsitesServiceWebsitesControllerFindOneKey, ...(queryKey ?? [{ id }])];
export type AutoNotesServiceAutoNotesControllerFindAllDefaultResponse = Awaited<ReturnType<typeof AutoNotesService.autoNotesControllerFindAll>>;
export type AutoNotesServiceAutoNotesControllerFindAllQueryResult<TData = AutoNotesServiceAutoNotesControllerFindAllDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useAutoNotesServiceAutoNotesControllerFindAllKey = "AutoNotesServiceAutoNotesControllerFindAll";
export const UseAutoNotesServiceAutoNotesControllerFindAllKeyFn = ({ term }: {
  term?: string;
} = {}, queryKey?: Array<unknown>) => [useAutoNotesServiceAutoNotesControllerFindAllKey, ...(queryKey ?? [{ term }])];
export type AutoNotesServiceAutoNotesControllerCountDefaultResponse = Awaited<ReturnType<typeof AutoNotesService.autoNotesControllerCount>>;
export type AutoNotesServiceAutoNotesControllerCountQueryResult<TData = AutoNotesServiceAutoNotesControllerCountDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useAutoNotesServiceAutoNotesControllerCountKey = "AutoNotesServiceAutoNotesControllerCount";
export const UseAutoNotesServiceAutoNotesControllerCountKeyFn = () => [useAutoNotesServiceAutoNotesControllerCountKey];
export type AutoNotesServiceAutoNotesControllerFindOneDefaultResponse = Awaited<ReturnType<typeof AutoNotesService.autoNotesControllerFindOne>>;
export type AutoNotesServiceAutoNotesControllerFindOneQueryResult<TData = AutoNotesServiceAutoNotesControllerFindOneDefaultResponse, TError = unknown> = UseQueryResult<TData, TError>;
export const useAutoNotesServiceAutoNotesControllerFindOneKey = "AutoNotesServiceAutoNotesControllerFindOne";
export const UseAutoNotesServiceAutoNotesControllerFindOneKeyFn = ({ id }: {
  id: string;
}, queryKey?: Array<unknown>) => [useAutoNotesServiceAutoNotesControllerFindOneKey, ...(queryKey ?? [{ id }])];
export type ActivitiesServiceActivitiesControllerCreateMutationResult = Awaited<ReturnType<typeof ActivitiesService.activitiesControllerCreate>>;
export type ActiveStatesServiceActiveStatesControllerCreateMutationResult = Awaited<ReturnType<typeof ActiveStatesService.activeStatesControllerCreate>>;
export type TagsServiceTagsControllerCreateMutationResult = Awaited<ReturnType<typeof TagsService.tagsControllerCreate>>;
export type TagNamesServiceTagNamesControllerCreateMutationResult = Awaited<ReturnType<typeof TagNamesService.tagNamesControllerCreate>>;
export type AutoTagsServiceAutoTagsControllerCreateMutationResult = Awaited<ReturnType<typeof AutoTagsService.autoTagsControllerCreate>>;
export type WebsitesServiceWebsitesControllerCreateMutationResult = Awaited<ReturnType<typeof WebsitesService.websitesControllerCreate>>;
export type AutoNotesServiceAutoNotesControllerCreateMutationResult = Awaited<ReturnType<typeof AutoNotesService.autoNotesControllerCreate>>;
export type TagsServiceTagsControllerUpdateMutationResult = Awaited<ReturnType<typeof TagsService.tagsControllerUpdate>>;
export type TagNamesServiceTagNamesControllerUpdateMutationResult = Awaited<ReturnType<typeof TagNamesService.tagNamesControllerUpdate>>;
export type AutoTagsServiceAutoTagsControllerUpdateMutationResult = Awaited<ReturnType<typeof AutoTagsService.autoTagsControllerUpdate>>;
export type AutoNotesServiceAutoNotesControllerUpdateMutationResult = Awaited<ReturnType<typeof AutoNotesService.autoNotesControllerUpdate>>;
export type ActivitiesServiceActivitiesControllerDeleteMutationResult = Awaited<ReturnType<typeof ActivitiesService.activitiesControllerDelete>>;
export type ActiveStatesServiceActiveStatesControllerDeleteMutationResult = Awaited<ReturnType<typeof ActiveStatesService.activeStatesControllerDelete>>;
export type TagsServiceTagsControllerRemoveMutationResult = Awaited<ReturnType<typeof TagsService.tagsControllerRemove>>;
export type TagNamesServiceTagNamesControllerRemoveMutationResult = Awaited<ReturnType<typeof TagNamesService.tagNamesControllerRemove>>;
export type AutoTagsServiceAutoTagsControllerDeleteMutationResult = Awaited<ReturnType<typeof AutoTagsService.autoTagsControllerDelete>>;
export type WebsitesServiceWebsitesControllerDeleteMutationResult = Awaited<ReturnType<typeof WebsitesService.websitesControllerDelete>>;
export type AutoNotesServiceAutoNotesControllerRemoveMutationResult = Awaited<ReturnType<typeof AutoNotesService.autoNotesControllerRemove>>;
