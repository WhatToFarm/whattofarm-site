import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiCountResponse, ApiListResponse, ApiPairListResponse, ApiPairListsResponse, ApiResponse,
  Link, PairListCreateRequest, PairListUpdateRequest, PairStat, PairStatListRequest, TokenWhitelistsResponse
} from '../models/defi';
import { Params } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class DefiService {
  constructor(private http: HttpClient) { }

  getPairCount(): Observable<ApiCountResponse> {
    return this.http.get<ApiCountResponse>('/api/v1/open/pairCount');
  }

  getPairStatList(
    q?: string,
    network?: string,
    pairAddresses: Array<string> = [],
    excludedPairAddresses: Array<string> = [],
    page = 1,
    size = 100,
    sortField = 'liquidity',
    sortDirection = 'desc',
    period = '',
    minLiquidity = '',
    maxLiquidity = '',
    list = ''): Observable<ApiListResponse<PairStat>> {
    const params = new HttpParams()
      .set('q', q ? q : '')
      .set('network', network ? network : '')
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortField', sortField)
      .set('sortDirection', sortDirection)
      .set('period', period)
      .set('minLiquidity', minLiquidity)
      .set('maxLiquidity', maxLiquidity)
      .set('list', list);

    const body = new PairStatListRequest(pairAddresses, excludedPairAddresses);
    return this.http.post<ApiListResponse<PairStat>>('/api/v1/open/pairStatList', body, { params });
  }

  postPairStatLinks(
    pairAddress: string,
    links: Array<Link>
  ): Observable<ApiResponse> {
    return this.http.post<ApiListResponse<PairStat>>(`/api/v1/secure/pairStatLinks/${pairAddress}`, links);
  }

  getPairLists(): Observable<ApiPairListsResponse> {
    return this.http.get<ApiPairListsResponse>('/api/v1/open/pairLists');
  }

  createPairList(
    name: string,
    groupName: string,
    position: number,
    isFeatured: boolean
  ): Observable<ApiPairListResponse> {
    const pairListCreateRequest = new PairListCreateRequest(name, groupName, position, isFeatured);

    return this.http.post<ApiPairListResponse>('/api/v1/secure/pairLists', pairListCreateRequest);
  }

  updatePairList(
    id: string,
    name: string,
    groupName: string,
    position: number,
    active: boolean,
    isFeatured: boolean
  ): Observable<ApiPairListResponse> {
    const pairListUpdateRequest = new PairListUpdateRequest(name, groupName, position, active, isFeatured);

    return this.http.put<ApiPairListResponse>(`/api/v1/secure/pairLists/${id}`, pairListUpdateRequest);
  }

  addPair(pairListId: string, pairAddress: string): Observable<ApiPairListsResponse> {
    return this.http.post<ApiPairListsResponse>(`/api/v1/secure/pairLists/${pairListId}/addPair/${pairAddress}`, {});
  }

  removePair(pairListId: string, pairAddress: string): Observable<ApiPairListsResponse> {
    return this.http.post<ApiPairListsResponse>(`/api/v1/secure/pairLists/${pairListId}/removePair/${pairAddress}`, {});
  }

  getTokenWhitelists(): Observable<TokenWhitelistsResponse> {
    return this.http.get<TokenWhitelistsResponse>('/api/v1/open/tokenWhitelists');
  }

  checkToken(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>('/api/v1/open/checkToken');
  }

  usersList(params: Params = {}): Observable<ApiListResponse<any>> {
    const body = { ...params };

    if (typeof body.page === 'string') {
      body.page = +(body.page);
    } else if (!body.page) {
      body.page = 1;
    }

    if (typeof body.size === 'string') {
      body.size = +(body.size);
    } else if (!body.size) {
      body.size = 100;
    }
    return this.http.get<ApiListResponse<any>>(`/api/v1/admin/user/list?page=${body.page}&size=${body.size}`);
  }

  removeUser(username: string): Observable<ApiResponse> {
    return this.http.get<ApiListResponse<any>>(`/api/v1/admin/user/remove?username=${username}`);
  }
}
