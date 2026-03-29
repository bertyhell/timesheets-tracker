/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";

export class ActivitiesService {
  /**
   * @returns any
   * @throws ApiError
   */
  public static activitiesControllerCreate(): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/activities",
    });
  }

  /**
   * @param startedAt
   * @param endedAt
   * @returns any
   * @throws ApiError
   */
  public static activitiesControllerFindAll(
    startedAt: string,
    endedAt: string,
  ): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/activities",
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
  public static activitiesControllerDelete(id: string): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/activities",
      path: {
        id: id,
      },
    });
  }

  /**
   * @param id
   * @returns any
   * @throws ApiError
   */
  public static activitiesControllerFindOne(id: string): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/activities/{id}",
      path: {
        id: id,
      },
    });
  }
}
