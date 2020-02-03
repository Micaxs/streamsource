import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from './../../environments/environment';


@Injectable({
  providedIn: 'root'
})

export class EventsService {
  url: string;
  token: string;
  header: any;

  constructor(private http: HttpClient) {
    this.url = environment.apiEndpoint;
    this.token = JSON.parse(localStorage.getItem('token'));

    const headerSettings: { [name: string]: string | string[]; } = { 'Content-Type': 'application/json', 'Authorization': this.token };
    this.header = new HttpHeaders(headerSettings);
  }

  getEvents() {
    return this.http.get<any>(this.url + '/events', { headers: this.header });
  }

  getEvent(streamkey: string) {
    return this.http.get<any>(this.url + '/events/' + streamkey, { headers: this.header });
  }

  getOwned() {
    return this.http.get<any>(this.url + '/events/owned', { headers: this.header });
  }

  createEvent(model: any) {
    return this.http.post<any>(this.url + '/events', model, { headers: this.header });
  }

  editEvent(streamId: Number, model: any) {
    return this.http.put<any>(this.url + '/events/' + streamId, model, { headers: this.header });
  }

}
