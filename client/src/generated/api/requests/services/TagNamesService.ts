/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateTagNameDto } from "../models/CreateTagNameDto";
import type { TagNameDto } from "../models/TagNameDto";
import type { UpdateTagNameDto } from "../models/UpdateTagNameDto";

import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";

export class TagNamesService {
  /**
   * @param requestBody
   * @returns TagNameDto Create a new tag name entry
   * @throws ApiError
   */
  public static tagNamesControllerCreate(
    requestBody: CreateTagNameDto,
  ): CancelablePromise<TagNameDto> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/tag-names",
      body: requestBody,
      mediaType: "application/json",
    });
  }

  /**
   * @param term
   * @returns TagNameDto Get tag name entries optionally filtered by name
   * @throws ApiError
   */
  public static tagNamesControllerFindAll(term?: string): CancelablePromise<Array<TagNameDto>> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/tag-names",
      query: {
        term: term,
      },
    });
  }

  /**
   * @returns number Count the number of tag names
   * @throws ApiError
   */
  public static tagNamesControllerCount(): CancelablePromise<number> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/tag-names/count",
    });
  }

  /**
   * @param id
   * @returns TagNameDto Get one tag name entry by id
   * @throws ApiError
   */
  public static tagNamesControllerFindOne(id: string): CancelablePromise<TagNameDto> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/tag-names/{id}",
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
  public static tagNamesControllerUpdate(
    id: string,
    requestBody: UpdateTagNameDto,
  ): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/tag-names/{id}",
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
  public static tagNamesControllerRemove(id: string): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/tag-names/{id}",
      path: {
        id: id,
      },
    });
  }
}
