import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    if (!localStorage.getItem('sessionUUID')) {
      const sUUID = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('sessionUUID', sUUID);
    }
  }

}
