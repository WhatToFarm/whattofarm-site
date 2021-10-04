import { DecimalPipe } from '@angular/common';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faHeart as faHeartOutline, faStar } from '@fortawesome/free-regular-svg-icons';
import {
  faChartLine,
  faDatabase,
  faDollarSign,
  faTrashAlt,
  faEdit, faExternalLinkAlt, faGlobe, faHeart, faPlus, faSave, faSearch,
  faSignInAlt, faSignOutAlt, faSortAmountDown, faSortAmountDownAlt, faTimes
} from '@fortawesome/free-solid-svg-icons';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ThousandSuffixPipe } from './pipes/thousand-suffix';
import { WebsocketModule } from './websocket/websocket.module';
import { DragulaModule } from 'ng2-dragula';
import { HttpConfigInterceptor } from './interceptors/httpconfig.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    ThousandSuffixPipe
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    NgbModule,
    FontAwesomeModule,
    DragulaModule.forRoot(),
    WebsocketModule.config({
      url: environment.wsUrl
    })
  ],
  providers: [
    ThousandSuffixPipe,
    DecimalPipe,
    { provide: HTTP_INTERCEPTORS, useClass: HttpConfigInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faSearch, faTimes, faPlus, faHeart, faHeartOutline, faEdit,
      faSave, faSignInAlt, faSignOutAlt, faStar, faSortAmountDown, faSortAmountDownAlt, faExternalLinkAlt,
      faGlobe, faTwitter, faChartLine, faDollarSign, faDatabase, faTrashAlt);
  }
}
