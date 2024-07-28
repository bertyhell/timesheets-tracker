/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateWebsiteDto } from '../models/CreateWebsiteDto';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class WebsitesService {

    /**
     * @param requestBody 
     * @returns any 
     * @throws ApiError
     */
    public static websitesControllerCreate(
requestBody: CreateWebsiteDto,
): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/websites',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param startedAt 
     * @param endedAt 
     * @returns any 
     * @throws ApiError
     */
    public static websitesControllerFindAll(
startedAt: string,
endedAt: string,
): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/websites',
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
    public static websitesControllerDelete(
id: string,
): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/websites',
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
    public static websitesControllerFindOne(
id: string,
): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/websites/{id}',
            path: {
                'id': id,
            },
        });
    }

}
