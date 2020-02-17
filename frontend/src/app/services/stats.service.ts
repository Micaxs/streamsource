import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class StatsService {
  url: string;
  token: string;
  header: any;

  constructor(private http: HttpClient) {
    this.url = environment.apiEndpoint;
    this.token = JSON.parse(localStorage.getItem('token'));

    const headerSettings: { [name: string]: string | string[]; } = { 'Content-Type': 'application/json', 'Authorization': this.token };
    this.header = new HttpHeaders(headerSettings);
  }

  getStats() {
    return this.http.get<any>(this.url + '/stats', { headers: this.header });
  }

  getStreamStats() {
    // Total object from this contains the amount of live and vod streams...
    return this.http.get<any>(this.url + '/streams', { headers: this.header });
  }

}
