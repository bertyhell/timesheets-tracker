/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class ActiveStatesService {

    /**
     * @returns any 
     * @throws ApiError
     */
    public static activeStatesControllerCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/active-states',
        });
    }

    /**
     * @param startedAt 
     * @param endedAt 
     * @returns any 
     * @throws ApiError
     */
    public static activeStatesControllerFindAll(
startedAt: string,
endedAt: string,
): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/active-states',
            query: {
                'startedAt': startedAt,
                'endedAt': endedAt,
            },
        });
    }

    /**
     * @param id 
     * @returns any 
     * @throws ApiError
     */
    public static activeStatesControllerDelete(
id: string,
): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/active-states',
            path: {
                'id': id,
            },
        });
    }

    /**
     * @param id 
     * @returns any 
     * @throws ApiError
     */
    public static activeStatesControllerFindOne(
id: string,
): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/active-states/{id}',
            path: {
                'id': id,
            },
        });
    }

}
