import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthenticationService } from '../services/authentication.service';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  errorMsg: string;
  successMsg: string;
  registerForm: FormGroup;
  invalidregister: boolean = false;
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authenticationService: AuthenticationService
  ) { }


  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      username: ['', Validators.compose([Validators.required])],
      password: ['', Validators.required],
      passwordrepeat: ['', Validators.required],
      firstname: [''],
      lastname: [''],
      phone: [''],
      country: ['', Validators.required],
      token: ['', Validators.required]
    });
  }

  login() {
    this.router.navigate(['/login']);
  }

  onSubmit(){

    if (this.registerForm.invalid) {
      return;
    }

    const registerData = {
      email: this.registerForm.controls.username.value,
      password: this.registerForm.controls.password.value,
      token: this.registerForm.controls.token.value,
      firstname: this.registerForm.controls.firstname.value,
      lastname: this.registerForm.controls.lastname.value,
      phone: this.registerForm.controls.phone.value,
      country: this.registerForm.controls.country.value
    }

    if (this.registerForm.controls.password.value !== this.registerForm.controls.passwordrepeat.value) {
      this.invalidregister = true;
      this.errorMsg = 'Passwords do not match!';
      return;
    }

    this.authenticationService.register(registerData).subscribe(
      data => {
        if (data.message) {

          this.successMsg = data.message;
          setTimeout (() => {
            this.router.navigate(['/login']);
         }, 3000);
          
        }
      },
      error => {
        this.invalidregister = true;
        if (error.status === 401) {
          this.errorMsg = 'The registration key is invalid!';
        } else if (error.status === 400) {
          this.errorMsg = 'Account with this email already exists!';
        } else {
          this.errorMsg = 'Something went wrong!';
        }
        return;
      }
    );

  }


}
