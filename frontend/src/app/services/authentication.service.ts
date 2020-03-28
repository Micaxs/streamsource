import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class AuthenticationService {
  url: string;
  token: string;
  header: any;

  constructor(private http: HttpClient) {
    this.url = environment.apiEndpoint;
    this.token = JSON.parse(localStorage.getItem('token'));

    const headerSettings: { [name: string]: string | string[]; } = { 'Content-Type': 'application/json' };
    this.header = new HttpHeaders(headerSettings);
  }

  login(model: any) {
    return this.http.post<any>(this.url + '/login', model, { headers: this.header });
  }

  userdata(key: string) {
    let headerSettings = { 'Content-Type': 'application/json', 'Authorization': key };
    this.header = new HttpHeaders(headerSettings);
    return this.http.get<any>(this.url + '/userdata', { headers: this.header });
  }

  register(model: any) {
    return this.http.post<any>(this.url + '/register', model, { headers: this.header });
  }

  check() {
    let token = JSON.parse(localStorage.getItem('token'));
    return this.http.get<any>(this.url + '/check/'+token);
  }

}
