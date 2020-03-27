import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  pageTitle: string;
  headingBackgroundClass: string = 'header-bg-dashboard';
  greeting: string;
  userData: any;
  name: string;

  constructor(
    private router: Router,
  ) {}


  getGreetingTime (m) {
    var g = null; //return g
    
    if(!m || !m.isValid()) { return; } //if we can't find a valid or filled moment, we return.
    
    var split_afternoon = 12 //24hr time to split the afternoon
    var split_evening = 17 //24hr time to split the evening
    var currentHour = parseFloat(m.format("HH"));
    
    if(currentHour >= split_afternoon && currentHour <= split_evening) {
      g = "afternoon";
    } else if(currentHour >= split_evening) {
      g = "evening";
    } else {
      g = "morning";
    }
    
    return g;
  }


  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userdata');
    this.router.navigate(['/login']);
  }

  ngOnInit() {
    let url = this.router.url;
    url = url.split('/')[1];
    switch (url) {
      case 'dashboard':
        this.pageTitle = 'Dashboard';
        this.headingBackgroundClass = 'header-bg-dashboard';
        break;
      case 'events':
        this.pageTitle = 'Streaming Events';
        this.headingBackgroundClass = 'header-bg-events';
        break;
      case 'postprocess':
        this.pageTitle = 'Post Processing';
        this.headingBackgroundClass = 'header-bg-postprocess';
        break;
      case 'users':
        this.pageTitle = 'User Management';
        this.headingBackgroundClass = 'header-bg-users';
        break;
      case 'player':
        this.pageTitle = 'Webintegration';
        this.headingBackgroundClass = 'header-bg-player';
        break;
    }
    

    this.userData = JSON.parse(localStorage.getItem('userdata'));
    this.name = this.userData.first_name + ' ' + this.userData.last_name;
    this.greeting = 'Good ' + this.getGreetingTime(moment()) + ', ' + this.name;



  }

}