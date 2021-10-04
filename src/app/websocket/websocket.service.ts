import { Inject, Injectable, OnDestroy } from '@angular/core';
import { interval, Observable, Observer, Subject, SubscriptionLike } from 'rxjs';
import { distinctUntilChanged, filter, map, share, takeWhile } from 'rxjs/operators';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { config } from './websocket.config';
import { IWebsocketService, IWsMessage, WebSocketConfig } from './websocket.interfaces';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements IWebsocketService, OnDestroy {
  private config: WebSocketSubjectConfig<IWsMessage<any>>;

  private websocketSub: SubscriptionLike;
  private statusSub: SubscriptionLike;

  private reconnection$?: Observable<number>;
  private websocket$?: WebSocketSubject<IWsMessage<any>>;
  private connection$?: Observer<boolean>;
  private wsMessages$?: Subject<IWsMessage<any>>;

  private reconnectInterval: number;
  private reconnectAttempts: number;
  private isConnected?: boolean;

  public status: Observable<boolean>;

  constructor(@Inject(config) private wsConfig: WebSocketConfig) {
    this.wsMessages$ = new Subject<IWsMessage<any>>();

    this.reconnectInterval = wsConfig.reconnectInterval || 5000; // pause between connections
    this.reconnectAttempts = wsConfig.reconnectAttempts || 10; // number of connection attempts

    this.config = {
      url: wsConfig.url,
      closeObserver: {
        next: (event: CloseEvent) => {
          this.websocket$ = undefined;
          this.connection$?.next(false);
        }
      },
      openObserver: {
        next: (event: Event) => {
          console.log('WebSocket connected!');
          this.connection$?.next(true);
        }
      }
    };

    // connection status
    this.status = new Observable<boolean>((observer) => {
      this.connection$ = observer;
    }).pipe(share(), distinctUntilChanged());

    // run reconnect if not connection
    this.statusSub = this.status
      .subscribe((isConnected) => {
        this.isConnected = isConnected;

        if (!this.reconnection$ && typeof (isConnected) === 'boolean' && !isConnected) {
          this.reconnect();
        }
      });

    this.websocketSub = this.wsMessages$.subscribe(
      null, (error: ErrorEvent) => console.error('WebSocket error!', error)
    );

    this.connect();
  }

  ngOnDestroy(): void {
    this.websocketSub.unsubscribe();
    this.statusSub.unsubscribe();
  }

  /*
  * connect to WebSocked
  * */
  private connect(): void {
    this.websocket$ = new WebSocketSubject(this.config);

    this.websocket$.subscribe(
      (message) => this.wsMessages$?.next(message),
      (error: Event) => {
        console.error(error);

        if (!this.websocket$) {
          this.reconnect();
        }
      });
  }

  /*
  * reconnect if not connecting or errors
  * */
  private reconnect(): void {
    this.reconnection$ = interval(this.reconnectInterval)
      .pipe(takeWhile((v, index) => index < this.reconnectAttempts && !this.websocket$));

    this.reconnection$.subscribe(
      () => this.connect(),
      null,
      () => {
        this.reconnection$ = undefined;

        if (!this.websocket$) {
          this.wsMessages$?.complete();
          this.connection$?.complete();
        }
      });
  }

  /*
  * on message event
  * */
  public on<T>(event: string): Observable<T> {
    if (event && this.wsMessages$) {
      return this.wsMessages$.pipe(
        filter((message: IWsMessage<T>) => message.event === event),
        map((message: IWsMessage<T>) => message.data)
      );
    }

    throw new Error('Unable to connect');
  }

  /*
  * on message to server
  * */
  public send(event: string, data: any = {}): void {
    if (event && this.isConnected) {
      this.websocket$?.next(<any>JSON.stringify({ event, data }));
    } else {
      console.error('Send error!');
    }
  }
}
