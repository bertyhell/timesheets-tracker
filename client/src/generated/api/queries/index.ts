// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  ActiveStatesService,
  ActivitiesService,
  AutoNotesService,
  AutoTagsService,
  type CreateAutoNoteDto,
  type CreateAutoTagDto,
  type CreateTagDto,
  type CreateTagNameDto,
  type CreateWebsiteDto,
  StatusService,
  TagNamesService,
  TagsService,
  type UpdateAutoNoteDto,
  type UpdateAutoTagsDto,
  type UpdateTagDto,
  type UpdateTagNameDto,
  WebsitesService,
} from "../requests";

export const useWebsitesServiceWebsitesControllerCreate = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof WebsitesService.websitesControllerCreate>>,
      unknown,
      {
        requestBody: CreateWebsiteDto;
      },
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ requestBody }) => WebsitesService.websitesControllerCreate(requestBody),
    ...options,
  });
export const useWebsitesServiceWebsitesControllerFindAllKey =
  "WebsitesServiceWebsitesControllerFindAll";
export const useWebsitesServiceWebsitesControllerFindAll = <
  TQueryKey extends Array<unknown> = unknown[],
>(
  {
    startedAt,
    endedAt,
  }: {
    startedAt: string;
    endedAt: string;
  },
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof WebsitesService.websitesControllerFindAll>>,
      unknown,
      Awaited<ReturnType<typeof WebsitesService.websitesControllerFindAll>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [
      useWebsitesServiceWebsitesControllerFindAllKey,
      ...(queryKey ?? [{ startedAt, endedAt }]),
    ],
    queryFn: () => WebsitesService.websitesControllerFindAll(startedAt, endedAt),
    ...options,
  });
export const useWebsitesServiceWebsitesControllerDelete = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof WebsitesService.websitesControllerDelete>>,
      unknown,
      {
        id: string;
      },
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({ mutationFn: ({ id }) => WebsitesService.websitesControllerDelete(id), ...options });
export const useWebsitesServiceWebsitesControllerFindOneKey =
  "WebsitesServiceWebsitesControllerFindOne";
export const useWebsitesServiceWebsitesControllerFindOne = <
  TQueryKey extends Array<unknown> = unknown[],
>(
  {
    id,
  }: {
    id: string;
  },
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof WebsitesService.websitesControllerFindOne>>,
      unknown,
      Awaited<ReturnType<typeof WebsitesService.websitesControllerFindOne>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [useWebsitesServiceWebsitesControllerFindOneKey, ...(queryKey ?? [{ id }])],
    queryFn: () => WebsitesService.websitesControllerFindOne(id),
    ...options,
  });
export const useTagsServiceTagsControllerCreate = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof TagsService.tagsControllerCreate>>,
      unknown,
      {
        requestBody: CreateTagDto;
      },
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ requestBody }) => TagsService.tagsControllerCreate(requestBody),
    ...options,
  });
export const useTagsServiceTagsControllerFindAllKey = "TagsServiceTagsControllerFindAll";
export const useTagsServiceTagsControllerFindAll = <TQueryKey extends Array<unknown> = unknown[]>(
  {
    startedAt,
    endedAt,
  }: {
    startedAt: string;
    endedAt: string;
  },
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof TagsService.tagsControllerFindAll>>,
      unknown,
      Awaited<ReturnType<typeof TagsService.tagsControllerFindAll>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [useTagsServiceTagsControllerFindAllKey, ...(queryKey ?? [{ startedAt, endedAt }])],
    queryFn: () => TagsService.tagsControllerFindAll(startedAt, endedAt),
    ...options,
  });
export const useTagsServiceTagsControllerFindOneKey = "TagsServiceTagsControllerFindOne";
export const useTagsServiceTagsControllerFindOne = <TQueryKey extends Array<unknown> = unknown[]>(
  {
    id,
  }: {
    id: string;
  },
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof TagsService.tagsControllerFindOne>>,
      unknown,
      Awaited<ReturnType<typeof TagsService.tagsControllerFindOne>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [useTagsServiceTagsControllerFindOneKey, ...(queryKey ?? [{ id }])],
    queryFn: () => TagsService.tagsControllerFindOne(id),
    ...options,
  });
export const useTagsServiceTagsControllerUpdate = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof TagsService.tagsControllerUpdate>>,
      unknown,
      {
        id: string;
        requestBody: UpdateTagDto;
      },
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ id, requestBody }) => TagsService.tagsControllerUpdate(id, requestBody),
    ...options,
  });
export const useTagsServiceTagsControllerRemove = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof TagsService.tagsControllerRemove>>,
      unknown,
      {
        id: string;
      },
      unknown
    >,
    "mutationFn"
  >,
) => useMutation({ mutationFn: ({ id }) => TagsService.tagsControllerRemove(id), ...options });
export const useTagNamesServiceTagNamesControllerCreate = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof TagNamesService.tagNamesControllerCreate>>,
      unknown,
      {
        requestBody: CreateTagNameDto;
      },
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ requestBody }) => TagNamesService.tagNamesControllerCreate(requestBody),
    ...options,
  });
export const useTagNamesServiceTagNamesControllerFindAllKey =
  "TagNamesServiceTagNamesControllerFindAll";
export const useTagNamesServiceTagNamesControllerFindAll = <
  TQueryKey extends Array<unknown> = unknown[],
>(
  {
    term,
  }: {
    term?: string;
  },
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof TagNamesService.tagNamesControllerFindAll>>,
      unknown,
      Awaited<ReturnType<typeof TagNamesService.tagNamesControllerFindAll>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [useTagNamesServiceTagNamesControllerFindAllKey, ...(queryKey ?? [{ term }])],
    queryFn: () => TagNamesService.tagNamesControllerFindAll(term),
    ...options,
  });
export const useTagNamesServiceTagNamesControllerCountKey =
  "TagNamesServiceTagNamesControllerCount";
export const useTagNamesServiceTagNamesControllerCount = <
  TQueryKey extends Array<unknown> = unknown[],
>(
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof TagNamesService.tagNamesControllerCount>>,
      unknown,
      Awaited<ReturnType<typeof TagNamesService.tagNamesControllerCount>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [useTagNamesServiceTagNamesControllerCountKey, ...(queryKey ?? [])],
    queryFn: () => TagNamesService.tagNamesControllerCount(),
    ...options,
  });
export const useTagNamesServiceTagNamesControllerFindOneKey =
  "TagNamesServiceTagNamesControllerFindOne";
export const useTagNamesServiceTagNamesControllerFindOne = <
  TQueryKey extends Array<unknown> = unknown[],
>(
  {
    id,
  }: {
    id: string;
  },
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof TagNamesService.tagNamesControllerFindOne>>,
      unknown,
      Awaited<ReturnType<typeof TagNamesService.tagNamesControllerFindOne>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [useTagNamesServiceTagNamesControllerFindOneKey, ...(queryKey ?? [{ id }])],
    queryFn: () => TagNamesService.tagNamesControllerFindOne(id),
    ...options,
  });
export const useTagNamesServiceTagNamesControllerUpdate = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof TagNamesService.tagNamesControllerUpdate>>,
      unknown,
      {
        id: string;
        requestBody: UpdateTagNameDto;
      },
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ id, requestBody }) => TagNamesService.tagNamesControllerUpdate(id, requestBody),
    ...options,
  });
export const useTagNamesServiceTagNamesControllerRemove = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof TagNamesService.tagNamesControllerRemove>>,
      unknown,
      {
        id: string;
      },
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({ mutationFn: ({ id }) => TagNamesService.tagNamesControllerRemove(id), ...options });
export const useStatusServiceAppControllerStatusKey = "StatusServiceAppControllerStatus";
export const useStatusServiceAppControllerStatus = <TQueryKey extends Array<unknown> = unknown[]>(
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof StatusService.appControllerStatus>>,
      unknown,
      Awaited<ReturnType<typeof StatusService.appControllerStatus>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [useStatusServiceAppControllerStatusKey, ...(queryKey ?? [])],
    queryFn: () => StatusService.appControllerStatus(),
    ...options,
  });
export const useAutoTagsServiceAutoTagsControllerCreate = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof AutoTagsService.autoTagsControllerCreate>>,
      unknown,
      {
        requestBody: CreateAutoTagDto;
      },
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ requestBody }) => AutoTagsService.autoTagsControllerCreate(requestBody),
    ...options,
  });
export const useAutoTagsServiceAutoTagsControllerFindAllKey =
  "AutoTagsServiceAutoTagsControllerFindAll";
export const useAutoTagsServiceAutoTagsControllerFindAll = <
  TQueryKey extends Array<unknown> = unknown[],
>(
  {
    term,
  }: {
    term?: string;
  },
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof AutoTagsService.autoTagsControllerFindAll>>,
      unknown,
      Awaited<ReturnType<typeof AutoTagsService.autoTagsControllerFindAll>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [useAutoTagsServiceAutoTagsControllerFindAllKey, ...(queryKey ?? [{ term }])],
    queryFn: () => AutoTagsService.autoTagsControllerFindAll(term),
    ...options,
  });
export const useAutoTagsServiceAutoTagsControllerCountKey =
  "AutoTagsServiceAutoTagsControllerCount";
export const useAutoTagsServiceAutoTagsControllerCount = <
  TQueryKey extends Array<unknown> = unknown[],
>(
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof AutoTagsService.autoTagsControllerCount>>,
      unknown,
      Awaited<ReturnType<typeof AutoTagsService.autoTagsControllerCount>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [useAutoTagsServiceAutoTagsControllerCountKey, ...(queryKey ?? [])],
    queryFn: () => AutoTagsService.autoTagsControllerCount(),
    ...options,
  });
export const useAutoTagsServiceAutoTagsControllerFindOneKey =
  "AutoTagsServiceAutoTagsControllerFindOne";
export const useAutoTagsServiceAutoTagsControllerFindOne = <
  TQueryKey extends Array<unknown> = unknown[],
>(
  {
    id,
  }: {
    id: string;
  },
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof AutoTagsService.autoTagsControllerFindOne>>,
      unknown,
      Awaited<ReturnType<typeof AutoTagsService.autoTagsControllerFindOne>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [useAutoTagsServiceAutoTagsControllerFindOneKey, ...(queryKey ?? [{ id }])],
    queryFn: () => AutoTagsService.autoTagsControllerFindOne(id),
    ...options,
  });
export const useAutoTagsServiceAutoTagsControllerUpdate = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof AutoTagsService.autoTagsControllerUpdate>>,
      unknown,
      {
        id: string;
        requestBody: UpdateAutoTagsDto;
      },
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ id, requestBody }) => AutoTagsService.autoTagsControllerUpdate(id, requestBody),
    ...options,
  });
export const useAutoTagsServiceAutoTagsControllerDelete = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof AutoTagsService.autoTagsControllerDelete>>,
      unknown,
      {
        id: string;
      },
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({ mutationFn: ({ id }) => AutoTagsService.autoTagsControllerDelete(id), ...options });
export const useAutoNotesServiceAutoNotesControllerCreate = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof AutoNotesService.autoNotesControllerCreate>>,
      unknown,
      {
        requestBody: CreateAutoNoteDto;
      },
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ requestBody }) => AutoNotesService.autoNotesControllerCreate(requestBody),
    ...options,
  });
export const useAutoNotesServiceAutoNotesControllerFindAllKey =
  "AutoNotesServiceAutoNotesControllerFindAll";
export const useAutoNotesServiceAutoNotesControllerFindAll = <
  TQueryKey extends Array<unknown> = unknown[],
>(
  {
    term,
  }: {
    term?: string;
  },
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof AutoNotesService.autoNotesControllerFindAll>>,
      unknown,
      Awaited<ReturnType<typeof AutoNotesService.autoNotesControllerFindAll>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [useAutoNotesServiceAutoNotesControllerFindAllKey, ...(queryKey ?? [{ term }])],
    queryFn: () => AutoNotesService.autoNotesControllerFindAll(term),
    ...options,
  });
export const useAutoNotesServiceAutoNotesControllerCountKey =
  "AutoNotesServiceAutoNotesControllerCount";
export const useAutoNotesServiceAutoNotesControllerCount = <
  TQueryKey extends Array<unknown> = unknown[],
>(
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof AutoNotesService.autoNotesControllerCount>>,
      unknown,
      Awaited<ReturnType<typeof AutoNotesService.autoNotesControllerCount>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [useAutoNotesServiceAutoNotesControllerCountKey, ...(queryKey ?? [])],
    queryFn: () => AutoNotesService.autoNotesControllerCount(),
    ...options,
  });
export const useAutoNotesServiceAutoNotesControllerFindOneKey =
  "AutoNotesServiceAutoNotesControllerFindOne";
export const useAutoNotesServiceAutoNotesControllerFindOne = <
  TQueryKey extends Array<unknown> = unknown[],
>(
  {
    id,
  }: {
    id: string;
  },
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof AutoNotesService.autoNotesControllerFindOne>>,
      unknown,
      Awaited<ReturnType<typeof AutoNotesService.autoNotesControllerFindOne>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [useAutoNotesServiceAutoNotesControllerFindOneKey, ...(queryKey ?? [{ id }])],
    queryFn: () => AutoNotesService.autoNotesControllerFindOne(id),
    ...options,
  });
export const useAutoNotesServiceAutoNotesControllerUpdate = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof AutoNotesService.autoNotesControllerUpdate>>,
      unknown,
      {
        id: string;
        requestBody: UpdateAutoNoteDto;
      },
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ id, requestBody }) =>
      AutoNotesService.autoNotesControllerUpdate(id, requestBody),
    ...options,
  });
export const useAutoNotesServiceAutoNotesControllerRemove = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof AutoNotesService.autoNotesControllerRemove>>,
      unknown,
      {
        id: string;
      },
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ id }) => AutoNotesService.autoNotesControllerRemove(id),
    ...options,
  });
export const useActivitiesServiceActivitiesControllerCreate = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof ActivitiesService.activitiesControllerCreate>>,
      unknown,
      void,
      unknown
    >,
    "mutationFn"
  >,
) => useMutation({ mutationFn: () => ActivitiesService.activitiesControllerCreate(), ...options });
export const useActivitiesServiceActivitiesControllerFindAllKey =
  "ActivitiesServiceActivitiesControllerFindAll";
export const useActivitiesServiceActivitiesControllerFindAll = <
  TQueryKey extends Array<unknown> = unknown[],
>(
  {
    startedAt,
    endedAt,
  }: {
    startedAt: string;
    endedAt: string;
  },
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof ActivitiesService.activitiesControllerFindAll>>,
      unknown,
      Awaited<ReturnType<typeof ActivitiesService.activitiesControllerFindAll>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [
      useActivitiesServiceActivitiesControllerFindAllKey,
      ...(queryKey ?? [{ startedAt, endedAt }]),
    ],
    queryFn: () => ActivitiesService.activitiesControllerFindAll(startedAt, endedAt),
    ...options,
  });
export const useActivitiesServiceActivitiesControllerDelete = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof ActivitiesService.activitiesControllerDelete>>,
      unknown,
      {
        id: string;
      },
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ id }) => ActivitiesService.activitiesControllerDelete(id),
    ...options,
  });
export const useActivitiesServiceActivitiesControllerFindOneKey =
  "ActivitiesServiceActivitiesControllerFindOne";
export const useActivitiesServiceActivitiesControllerFindOne = <
  TQueryKey extends Array<unknown> = unknown[],
>(
  {
    id,
  }: {
    id: string;
  },
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof ActivitiesService.activitiesControllerFindOne>>,
      unknown,
      Awaited<ReturnType<typeof ActivitiesService.activitiesControllerFindOne>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [useActivitiesServiceActivitiesControllerFindOneKey, ...(queryKey ?? [{ id }])],
    queryFn: () => ActivitiesService.activitiesControllerFindOne(id),
    ...options,
  });
export const useActiveStatesServiceActiveStatesControllerCreate = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof ActiveStatesService.activeStatesControllerCreate>>,
      unknown,
      void,
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({ mutationFn: () => ActiveStatesService.activeStatesControllerCreate(), ...options });
export const useActiveStatesServiceActiveStatesControllerFindAllKey =
  "ActiveStatesServiceActiveStatesControllerFindAll";
export const useActiveStatesServiceActiveStatesControllerFindAll = <
  TQueryKey extends Array<unknown> = unknown[],
>(
  {
    startedAt,
    endedAt,
  }: {
    startedAt: string;
    endedAt: string;
  },
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof ActiveStatesService.activeStatesControllerFindAll>>,
      unknown,
      Awaited<ReturnType<typeof ActiveStatesService.activeStatesControllerFindAll>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [
      useActiveStatesServiceActiveStatesControllerFindAllKey,
      ...(queryKey ?? [{ startedAt, endedAt }]),
    ],
    queryFn: () => ActiveStatesService.activeStatesControllerFindAll(startedAt, endedAt),
    ...options,
  });
export const useActiveStatesServiceActiveStatesControllerDelete = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof ActiveStatesService.activeStatesControllerDelete>>,
      unknown,
      {
        id: string;
      },
      unknown
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ id }) => ActiveStatesService.activeStatesControllerDelete(id),
    ...options,
  });
export const useActiveStatesServiceActiveStatesControllerFindOneKey =
  "ActiveStatesServiceActiveStatesControllerFindOne";
export const useActiveStatesServiceActiveStatesControllerFindOne = <
  TQueryKey extends Array<unknown> = unknown[],
>(
  {
    id,
  }: {
    id: string;
  },
  queryKey?: TQueryKey,
  options?: Omit<
    UseQueryOptions<
      Awaited<ReturnType<typeof ActiveStatesService.activeStatesControllerFindOne>>,
      unknown,
      Awaited<ReturnType<typeof ActiveStatesService.activeStatesControllerFindOne>>,
      unknown[]
    >,
    "queryKey" | "queryFn" | "initialData"
  >,
) =>
  useQuery({
    queryKey: [useActiveStatesServiceActiveStatesControllerFindOneKey, ...(queryKey ?? [{ id }])],
    queryFn: () => ActiveStatesService.activeStatesControllerFindOne(id),
    ...options,
  });
