import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { config } from './websocket.config';
import { WebSocketConfig } from './websocket.interfaces';
import { WebsocketService } from './websocket.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  providers: [
    WebsocketService
  ]
})
export class WebsocketModule {
  public static config(wsConfig: WebSocketConfig): ModuleWithProviders<WebsocketModule> {
    return {
      ngModule: WebsocketModule,
      providers: [{ provide: config, useValue: wsConfig }]
    };
  }
}
