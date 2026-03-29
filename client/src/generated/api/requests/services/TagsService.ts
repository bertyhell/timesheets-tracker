/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateTagDto } from "../models/CreateTagDto";
import type { TagDto } from "../models/TagDto";
import type { UpdateTagDto } from "../models/UpdateTagDto";

import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";

export class TagsService {
  /**
   * @param requestBody
   * @returns TagDto Create a new tag entry
   * @throws ApiError
   */
  public static tagsControllerCreate(requestBody: CreateTagDto): CancelablePromise<TagDto> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/tags",
      body: requestBody,
      mediaType: "application/json",
    });
  }

  /**
   * @param startedAt
   * @param endedAt
   * @returns TagDto Get all tag entries filtered by date
   * @throws ApiError
   */
  public static tagsControllerFindAll(
    startedAt: string,
    endedAt: string,
  ): CancelablePromise<Array<TagDto>> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/tags",
      query: {
        startedAt: startedAt,
        endedAt: endedAt,
      },
    });
  }

  /**
   * @param id
   * @returns any
   * @throws ApiError
   */
  public static tagsControllerFindOne(id: string): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/tags/{id}",
      path: {
        id: id,
      },
    });
  }

  /**
   * @param id
   * @param requestBody
   * @returns any
   * @throws ApiError
   */
  public static tagsControllerUpdate(
    id: string,
    requestBody: UpdateTagDto,
  ): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/tags/{id}",
      path: {
        id: id,
      },
      body: requestBody,
      mediaType: "application/json",
    });
  }

  /**
   * @param id
   * @returns any Delete one tag by id
   * @throws ApiError
   */
  public static tagsControllerRemove(id: string): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/tags/{id}",
      path: {
        id: id,
      },
    });
  }
}
