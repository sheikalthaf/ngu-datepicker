import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { DatepickerModule } from '../../../ngu-datepicker/src/public_api';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, FormsModule, ReactiveFormsModule, DatepickerModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
