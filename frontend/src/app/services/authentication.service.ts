import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})

export class AuthenticationService {
  url: string;
  token: string;
  header: any;

  constructor(private http: HttpClient) {
    this.url = 'http://mica.pw:3000';
    this.token = JSON.parse(localStorage.getItem('token'));

    const headerSettings: { [name: string]: string | string[]; } = { 'Content-Type': 'application/json', 'authorization': '123' };
    this.header = new HttpHeaders(headerSettings);
  }

  login(model: any) {
    return this.http.post<any>(this.url + '/login', model, { headers: this.header });
  }

  userdata(token: string) {
    let headerSettings = { 'Content-Type': 'application/json', 'Authorization': token };
    this.header = new HttpHeaders(headerSettings);
    return this.http.get<any>(this.url + '/userdata', { headers: this.header });
  }

  register(model: any) {
    return this.http.post<any>(this.url + '/register', model, { headers: this.header });
  }

}