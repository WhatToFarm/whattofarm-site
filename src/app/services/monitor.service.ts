import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Params } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class MonitorService {

  constructor(
    private http: HttpClient,
  ) { }

  list(params: Params = {}): Observable<any> {
    const body = { ...params };

    return this.http.post<any>('/api/v1/admin/monitoring-target/list', body);
  }

  create(monitoring_address: string, pool_contract_address: string, farm_address: string, description: string): Observable<any> {
    const postCreateRequest = {
      monitoring_address,
      pool_contract_address,
      farm_address,
      description
    };

    return this.http.post<any>('/api/v1/admin/monitoring-target/create', postCreateRequest);
  }

  update(
    uuid: string, received_date: string, received_time: string, received_total: number, sent_date: string, sent_time: string,
    sent_total: number
  ): Observable<any> {
    const postUpdateRequest = {uuid, received_date, received_time, received_total, sent_date, sent_time, sent_total};

    return this.http.post<any>('/api/v1/admin/monitoring-target/calc', postUpdateRequest);
  }

  delete(uuid: string): Observable<any> {
    return this.http.get<any>(`/api/v1/admin/monitoring-target/remove/${uuid}`);
  }

}
