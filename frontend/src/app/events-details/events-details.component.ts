import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { EventsService } from '../services/events.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-events-details',
  templateUrl: './events-details.component.html',
  styleUrls: ['./events-details.component.css']
})
export class EventsDetailsComponent implements OnInit {

  // Variables
  id: any;
  eventData: any = [];

  constructor(
    private eventsService: EventsService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.id = this.activatedRoute.snapshot.params.id;
    
    this.eventsService.getEvent(this.id).subscribe(
      data => {
        this.eventData = data[0];
        console.log(this.eventData);
      },
      error => {
        if (error.status === 404) {
          this.eventData = [];
          console.log('Event not found!');
        }
      }
    );
  }

  


}
