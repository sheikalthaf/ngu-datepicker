import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatepickerComponent } from './datepicker.component';
import { DpHoverDirective } from './datepicker.directive';

@NgModule({
  declarations: [DatepickerComponent, DpHoverDirective],
  exports: [DatepickerComponent],
  imports: [CommonModule]
})
export class DatepickerModule {}
