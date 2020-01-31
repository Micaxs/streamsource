import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthenticationService } from '../services/authentication.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  invalidLogin: boolean = false;
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authenticationService: AuthenticationService
  ) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.compose([Validators.required])],
      password: ['', Validators.required]
    });
  }

  register() {
    this.router.navigate(['/register']);
  }

  onSubmit(){
    //console.log(this.loginForm.value);

    if (this.loginForm.invalid) {
      return;
    }

    const loginData = {
      email: this.loginForm.controls.username.value,
      password: this.loginForm.controls.password.value
    }

    this.authenticationService.login(loginData).subscribe(
      data => {
        if (data.token) {
          localStorage.setItem('token', JSON.stringify(data.token));
          this.authenticationService.userdata(data.token).subscribe(userdata =>{
            localStorage.setItem('userdata', JSON.stringify(userdata.data));
            this.router.navigate(['/dashboard']);
          });
        }
      },
      error => {
        this.invalidLogin = true;
      }
    );

  }

}
