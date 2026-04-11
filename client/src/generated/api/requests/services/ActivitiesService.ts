/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class ProgramsService {
  /**
   * @returns any
   * @throws ApiError
   */
  public static programsControllerCreate(): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/programs',
    });
  }

  /**
   * @param startedAt
   * @param endedAt
   * @returns any
   * @throws ApiError
   */
  public static programsControllerFindAll(
    startedAt: string,
    endedAt: string
  ): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/programs',
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
  public static programsControllerDelete(id: string): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/api/programs',
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
  public static programsControllerFindOne(id: string): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/programs/{id}',
      path: {
        id: id,
      },
    });
  }
}
