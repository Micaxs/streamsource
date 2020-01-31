import { Component, OnInit } from '@angular/core';
import { EventsService } from '../services/events.service';


@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit {

  ownEvents: any = [];
  allEvents: any;

  constructor(
    private eventsServioce: EventsService
  ) { }

  ngOnInit() {
    // Retrieve all owned events
    this.eventsServioce.getOwned().subscribe(
      data => {
        this.ownEvents = data;
      },
      error => {
        if (error.status === 404) {
          console.log('No events found!');
        }
      }
    );

    // Retrieve all events.
    this.eventsServioce.getEvents().subscribe(
      data => {
        this.allEvents = data.streams;
      },
      error => {
        if (error.status === 404) {
          console.log('No events found!');
        }
      }
    );
  }

  
}
