import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiItemResponse } from 'src/app/models/defi';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
  ) { }

  async login(username: string, password: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const loginRequest = {
        username,
        password
      };

      this.http.post('/api/v1/open/login', loginRequest).subscribe((res: ApiItemResponse<any>) => {
        localStorage.setItem('authToken', res.result.token);
        localStorage.setItem('user', JSON.stringify(res.result));
        resolve();
      }, () => {
        reject('Wrong credentials');
      });
    });
  }

  async register(username: string, password: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const registerRequest = {
        username,
        password
      };

      this.http.post('/api/v1/open/register', registerRequest).subscribe(res => {
        resolve();
      }, () => {
        reject('Wrong credentials');
      });
    });
  }

  get token(): string {
    return localStorage.getItem('authToken') ?? '';
  }

  get isAdmin(): boolean {
    return JSON.parse(localStorage.getItem('user'))?.isAdmin;
  }
}
