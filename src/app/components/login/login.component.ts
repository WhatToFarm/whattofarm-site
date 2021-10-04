import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  mode: 'login' | 'register' = 'login';

  loginForm = this.fb.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });
  registerForm = this.fb.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
    passwordRp: ['', Validators.required],
  });
  errorMessageLog = '';
  errorMessageReg = '';


  constructor(
    public activeModal: NgbActiveModal,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
  }

  async submitLogin(): Promise<void> {
    if (this.loginForm.valid) {
      this.errorMessageLog = '';
      const loginData = this.loginForm.value;

      try {
        await this.authService.login(loginData.login, loginData.password);
        this.activeModal.close();
      } catch (e) {
        this.errorMessageLog = e.error || e;
      }
    }
  }

  async submitRegister(): Promise<void> {
    if (this.registerForm.valid) {
      this.errorMessageReg = '';
      const registerData = this.registerForm.value;

      try {
        if (registerData?.password !== registerData.passwordRp) {
          throw new Error('Пароли не совпадают');
        }
        await this.authService.register(registerData.login, registerData.password );
        this.mode = 'login';
      } catch (e) {
        this.errorMessageReg = e.error || e.Error || e;
      }
    }
  }

}
