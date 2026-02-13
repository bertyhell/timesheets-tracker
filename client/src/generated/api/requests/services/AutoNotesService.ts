/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AutoNoteDto } from "../models/AutoNoteDto";
import type { CreateAutoNoteDto } from "../models/CreateAutoNoteDto";
import type { UpdateAutoNoteDto } from "../models/UpdateAutoNoteDto";

import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";

export class AutoNotesService {
  /**
   * @param requestBody
   * @returns AutoNoteDto Create a new autoNote rule
   * @throws ApiError
   */
  public static autoNotesControllerCreate(
    requestBody: CreateAutoNoteDto,
  ): CancelablePromise<AutoNoteDto> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/auto-notes",
      body: requestBody,
      mediaType: "application/json",
    });
  }

  /**
   * @param term
   * @returns AutoNoteDto Get autoNote entries optionally filtered by name
   * @throws ApiError
   */
  public static autoNotesControllerFindAll(term?: string): CancelablePromise<Array<AutoNoteDto>> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/auto-notes",
      query: {
        term: term,
      },
    });
  }

  /**
   * @returns number Count the number of autoNotes
   * @throws ApiError
   */
  public static autoNotesControllerCount(): CancelablePromise<number> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/auto-notes/count",
    });
  }

  /**
   * @param id
   * @returns AutoNoteDto Get one autoNote entry by id
   * @throws ApiError
   */
  public static autoNotesControllerFindOne(id: string): CancelablePromise<AutoNoteDto> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/auto-notes/{id}",
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
  public static autoNotesControllerUpdate(
    id: string,
    requestBody: UpdateAutoNoteDto,
  ): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/auto-notes/{id}",
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
  public static autoNotesControllerRemove(id: string): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/auto-notes/{id}",
      path: {
        id: id,
      },
    });
  }
}
