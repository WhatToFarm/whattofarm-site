import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BannerService {

  constructor(
    private http: HttpClient,
  ) { }

  list(): Observable<any> {
    return this.http.get<any>('/api/v1/admin/banner/list');
  }

  upload(url: string, position: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('url', url);
    formData.append('position', position);
    formData.append('file', file);

    return this.http.post<any>('/api/v1/admin/banner/upload', formData);
  }

  delete(uuid): Observable<any> {
    return this.http.get<any>(`/api/v1/admin/banner/remove/${uuid}`);
  }

  get(position): Observable<any> {
    const session = localStorage.getItem('sessionUUID');
    return this.http.get<any>(`/api/v1/open/get/image/${position}/${session}`);
  }


}
