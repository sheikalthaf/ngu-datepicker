import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
  Output,
  EventEmitter
} from '@angular/core';
import { merge } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { NguCalendar } from './datepicker-core';
import { DpHoverDirective } from './datepicker.directive';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'av-datepicker',
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatepickerComponent implements OnInit, AfterViewInit {
  @Input() datepickerField: any;

  @Input() multi = 1;

  @Input() format = 'YYYY-MM-DD';

  @Input() range = true;

  @Input() value = [];

  @Output() dateChanged = new EventEmitter();

  @ViewChildren(DpHoverDirective) dateCell: QueryList<DpHoverDirective>;

  datepicker = new NguCalendar();

  months = this.datepicker.months;

  weekDays = this.datepicker.weekDays;

  isMonthTable = false;

  buttons = this.datepicker.select;

  buttonsContent: any;

  context = {
    $implicit: {
      buttons: this.datepicker.select
    }
  };

  constructor() {}

  ngOnInit() {
    const val = this.value;
    const v = this.range ? val : [val];
    this.datepicker.range = this.range;
    this.datepicker.multi = this.multi;
    this.datepicker.setOutputFormat(this.format);
    this.datepicker.initialValue(v);
    this.datepicker.valueChanged.subscribe(va => this.dateChanged.emit(va));
  }

  ngAfterViewInit() {
    this.datepicker.pickerCell$ = this.dateCell.changes.pipe(
      startWith(1),
      switchMap(() => merge(...this.dateCell.map(e => e.cellHovered)))
    );
  }

  open() {}

  close() {}
}
