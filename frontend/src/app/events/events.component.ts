import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { EventsService } from '../services/events.service';
import { Router } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class EventsComponent implements OnInit {

  ownEvents: any = [];
  allEvents: any;

  constructor(
    private eventsService: EventsService,
    private router: Router
  ) { }

  formatEventsData(events) {
    events.forEach(event => {
      switch (event.type) {
        case "live": event.type = '';
        case "vod": event.type = '';
        default: event.type = '<i class="fa fa-file event-icon" aria-hidden="true"></i>';
      }
      event.date = moment(event.start).format("ddd, DD MMM YYYY")
      event.time = `${moment(event.start).format("HH:mm")} <i class="fa fa-arrow-right" aria-hidden="true"></i> ${moment(event.stop).format("HH:mm")}`
    });
    return events;
  }

  clickedEvent(eventId) {
      this.router.navigate(['/events/'+eventId]);
  }


  ngOnInit() {
    // Retrieve all owned events
    this.eventsService.getOwned().subscribe(
      data => {
        this.ownEvents = this.formatEventsData(data);
        console.log(data);
      },
      error => {
        if (error.status === 404) {
          this.ownEvents = [];
          console.log('No events found!');
        }
      }
    );

    // Retrieve all events.
    this.eventsService.getEvents().subscribe(
      data => {
        this.allEvents = data.streams;
      },
      error => {
        if (error.status === 404) {
          this.allEvents = [];
          console.log('No events found!');
        }
      }
    );
  }

  
}
