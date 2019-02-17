import { DpTest, DPColors } from './datepicker.interface';
import { BehaviorSubject, Observable, Subscription, Subject } from 'rxjs';
import * as momentImported from 'moment';
const moment = momentImported;

const LOCAL_COMPARE = 'YYYY-MM-DD';

/**
 * this is store which help to avoid some duplicates in datepicker values
 */
export class NguCalendarRangeStore {
  private store: momentImported.MomentInput[] = [];
  isFull = false;
  isSingle = false;

  add(date: momentImported.MomentInput) {
    const d = moment(date);
    if (this.isFull) this.push();

    if (this.isPast(d)) return false;

    return this.push(date);
    // return false;
  }

  isPast(date: momentImported.Moment) {
    return this.isSingle && moment(this.store[0]).isAfter(date);
  }

  isSame(date: momentImported.Moment) {
    return !!this.store.find(e => moment(e).format(LOCAL_COMPARE) === date.format(LOCAL_COMPARE));
  }

  isBefore(date: momentImported.MomentInput) {
    return moment(this.store[0]).isBefore(date);
  }

  inLocalFormat() {
    return this.store.map(e => moment(e).format(LOCAL_COMPARE));
  }

  push(data?: momentImported.MomentInput | momentImported.MomentInput[]) {
    if (Array.isArray(data)) this.store = data;
    else if (!data) this.store = [];
    else this.store.push(data);

    this.isFull = this.store.length === 2;
    this.isSingle = this.store.length === 1;
    return true;
  }
}

export class NguCalendar {
  private _dateColors = new DPColors();

  private rangeStore = new NguCalendarRangeStore();

  private outputFormat = '' + LOCAL_COMPARE;

  days = new BehaviorSubject([]);

  colors = new BehaviorSubject(this._dateColors);

  valueChanged = new Subject<string | string[]>();

  pickerCell$: Observable<DpTest>;

  months = moment.months();

  weekDays = moment.weekdaysShort();

  select = {
    today: () => this.chooseDate(0, 'day'),
    yesterday: () => this.chooseDate(1, 'day'),
    thisWeek: () => this.chooseDate(0, 'week'),
    lastWeek: () => this.chooseDate(1, 'week'),
    lastMonth: () => this.chooseDate(1, 'month'),
    lastYear: () => this.chooseDate(1, 'year'),
    last: (num: number) => this.chooseDate(num, 'day', true)
  };

  hoverSub: Subscription;

  constructor(public calendarStartMonth = moment(), public multi = 1, public range = false) {}

  monthDays(date: momentImported.MomentInput) {
    const myMoment = this.moment(date);
    this.calendarStartMonth = myMoment.clone();
    const arra = Array<momentImported.Moment>(this.multi)
      .fill(myMoment)
      .map((d, i) => {
        const clo = d.clone().add(i, 'month');
        const arr = this.getWeekDays(clo);
        const extras = {
          month: clo.month(),
          year: clo.year(),
          day: clo.day(),
          week: clo.week()
        };
        return { arr, extras };
      });
    this.days.next(arra);
  }

  private getWeekDays(start: momentImported.Moment): DpTest[][] {
    const startDate = start.startOf('month');
    return Array<momentImported.Moment>(6)
      .fill(startDate)
      .map((n, i) => {
        const week = n.clone().add(i, 'weeks');
        return this.getWeek(week).map(myMoment => {
          const day = myMoment.format('D');
          const date = myMoment.format();
          const compare = myMoment.format(LOCAL_COMPARE);
          const isCurentMonth = startDate.month() === myMoment.month();
          return { day, isCurentMonth, date, compare };
        });
      });
  }

  private getWeek(day: momentImported.Moment): momentImported.Moment[] {
    const sunday = day.clone().startOf('week');
    return Array<momentImported.Moment>(7)
      .fill(sunday)
      .map((c, i) => c.clone().add(i, 'day'));
  }

  selectMonth(month: number) {
    const monthsToAdd = month - this.calendarStartMonth.month();
    const myMoment = this.calendarStartMonth.add(monthsToAdd, 'month');
    this.monthDays(myMoment);
  }

  initialValue(data: momentImported.MomentInput[]) {
    if (typeof data === 'string') data = [data];
    const d = data.map(e => '' + e);
    this.rangeStore.push(d);
    this.colorDefined();
    this.monthDays(d[0]);
  }

  private colorDefined(val = this.rangeStore.inLocalFormat(), isHovered = false) {
    const d = this.range ? val : [val[0]];
    this._dateColors.active = [...d.map(s => this.moment(s).format(LOCAL_COMPARE))];
    this._dateColors.partil =
      d.length > 1
        ? this.momentBetweenTwoDays(this._dateColors.active[1], this._dateColors.active[0])
        : [];
    isHovered && this._dateColors.active.splice(1, 1);
    this.colors.next(this._dateColors);
  }

  private momentBetweenTwoDays(a: momentImported.MomentInput, b: momentImported.MomentInput) {
    const diff = this.moment(a).diff(this.moment(b), 'days') + 1;
    return Array<momentImported.Moment>(diff)
      .fill(this.moment(b))
      .map((g, i) => this.moment(g.clone().add(i, 'day')).format(LOCAL_COMPARE));
  }

  chooseDate(num: number, durationType: momentImported.DurationInputArg2, currentAsEnd = false) {
    const now = this.moment();
    let start: momentImported.MomentInput;
    let end: momentImported.MomentInput;
    if (currentAsEnd) {
      end = now;
      start = now.clone().subtract(num, durationType);
    } else {
      const date = now.clone().subtract(num, durationType);
      start = date.clone().startOf(durationType);
      end = date.clone().endOf(durationType);
    }
    this.rangeStore.push(this.range ? [start, end] : [start]);
    this.colorDefined();
    this.monthDays(start);
    this.patchValue();
  }

  selectDate(momen: DpTest) {
    if (this.range) {
      const d = this.rangeStore.add(momen.date);

      d && this.rangeHover();

      d && this.colorDefined();

      if (this.rangeStore.isFull) this.patchValue();
    } else {
      this.rangeStore.push([momen.date]);
      this.patchValue();
      this.colorDefined();
    }
    if (!momen.isCurentMonth) this.monthDays(momen.date);
  }

  private patchValue() {
    this.valueChanged.next(
      this.rangeStore.inLocalFormat().map(e => moment(e).format(this.outputFormat))
    );
  }

  onCellHover(date: momentImported.MomentInput) {
    const isFuture = this.rangeStore.isBefore(date);
    const temp = [...this.rangeStore.inLocalFormat(), date] as string[];
    if (isFuture) this.colorDefined(temp, true);
  }

  private rangeHover() {
    if (this.rangeStore.isFull && this.hoverSub) {
      this.hoverSub.unsubscribe();
      this.hoverSub = null;
    } else if (!this.hoverSub) {
      this.hoverSub = this.pickerCell$.subscribe(res => {
        this.onCellHover(res.date);
      });
    }
  }

  button(type?: 'next' | 'prev') {
    this.monthDays(
      this.calendarStartMonth.add(type === 'next' ? 1 : -1, 'months').startOf('month')
    );
  }

  moment(date: momentImported.MomentInput) {
    return moment(date);
  }

  setOutputFormat(format: string) {
    if (format) this.outputFormat = format;
  }
}
