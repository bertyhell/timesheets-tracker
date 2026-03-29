/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AutoTagCountDto } from "../models/AutoTagCountDto";
import type { AutoTagDto } from "../models/AutoTagDto";
import type { CreateAutoTagDto } from "../models/CreateAutoTagDto";
import type { UpdateAutoTagsDto } from "../models/UpdateAutoTagsDto";

import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";

export class AutoTagsService {
  /**
   * @param requestBody
   * @returns AutoTagDto Create an auto tag with conditions to identify when to apply the linked tagName to user activity
   * @throws ApiError
   */
  public static autoTagsControllerCreate(
    requestBody: CreateAutoTagDto,
  ): CancelablePromise<AutoTagDto> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/auto-tags",
      body: requestBody,
      mediaType: "application/json",
    });
  }

  /**
   * @param term
   * @returns AutoTagDto Get a list of auto tags optionally filtered by a term that should occur in the name of the tag
   * @throws ApiError
   */
  public static autoTagsControllerFindAll(term?: string): CancelablePromise<Array<AutoTagDto>> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/auto-tags",
      query: {
        term: term,
      },
    });
  }

  /**
   * @returns AutoTagCountDto Returns the number of auto tags that exist
   * @throws ApiError
   */
  public static autoTagsControllerCount(): CancelablePromise<AutoTagCountDto> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/auto-tags/count",
    });
  }

  /**
   * @param id
   * @returns AutoTagDto Return a single auto tag by id
   * @throws ApiError
   */
  public static autoTagsControllerFindOne(id: string): CancelablePromise<AutoTagDto> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/auto-tags/{id}",
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
  public static autoTagsControllerUpdate(
    id: string,
    requestBody: UpdateAutoTagsDto,
  ): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/auto-tags/{id}",
      path: {
        id: id,
      },
      body: requestBody,
      mediaType: "application/json",
    });
  }

  /**
   * @param id
   * @returns any
   * @throws ApiError
   */
  public static autoTagsControllerDelete(id: string): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/auto-tags/{id}",
      path: {
        id: id,
      },
    });
  }
}
