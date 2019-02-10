import * as momentNs from 'moment';
const moment = momentNs;
import { DpTest, DPColors } from './datepicker.interface';
import { BehaviorSubject, Observable, Subscription, Subject } from 'rxjs';

const LOCAL_COMPARE = 'YYYY-MM-DD';

export class NguCalendar {
  private _dateColors = new DPColors();

  private rangeStore = new NguCalendarRangeStore();

  days = new BehaviorSubject([]);

  colors = new BehaviorSubject(this._dateColors);

  valueChanged = new Subject();

  pickerCell$: Observable<any>;

  months = moment.months();

  weekDays = moment.weekdaysShort();

  select = {
    today: () => this.chooseDate(0, 'day'),
    yesterday: () => this.chooseDate(1, 'day'),
    thisWeek: () => this.chooseDate(0, 'week'),
    lastWeek: () => this.chooseDate(1, 'week'),
    lastMonth: () => this.chooseDate(1, 'month'),
    lastYear: () => this.chooseDate(1, 'year')
  };
  hoverSub: Subscription;

  constructor(
    public calendarStartMonth = moment(),
    public multi = 1,
    public range = false
  ) {}

  monthDays(date: momentNs.MomentInput) {
    const myMoment = this.moment(date);
    this.calendarStartMonth = myMoment.clone();
    const arra = Array(this.multi)
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

  private getWeekDays(start: momentNs.Moment): DpTest[][] {
    const startDate = start.startOf('month');
    return Array<momentNs.Moment>(6)
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

  private getWeek(day: momentNs.Moment): momentNs.Moment[] {
    const sunday = day.clone().startOf('week');
    return Array<momentNs.Moment>(7)
      .fill(sunday)
      .map((c, i) => c.clone().add(i, 'day'));
  }

  selectMonth(month: number) {
    const monthsToAdd = month - this.calendarStartMonth.month();
    const myMoment = this.calendarStartMonth.add(monthsToAdd, 'month');
    this.monthDays(myMoment);
  }

  colorDefined(val: momentNs.MomentInput[], noSecond = false) {
    const d = this.range ? val : [val[0]];
    this._dateColors.active = [
      ...d.map(s => this.moment(s).format(LOCAL_COMPARE))
    ];
    this._dateColors.partil =
      d.length > 1
        ? this.momentBetweenTwoDays(
            this._dateColors.active[1],
            this._dateColors.active[0]
          )
        : [];
    noSecond && this._dateColors.active.splice(1, 1);
    this.colors.next(this._dateColors);
  }

  private momentBetweenTwoDays(
    a: momentNs.MomentInput,
    b: momentNs.MomentInput
  ) {
    const diff = this.moment(a).diff(this.moment(b), 'days') + 1;
    return Array(diff)
      .fill(this.moment(b))
      .map((g, i) =>
        this.moment(g.clone().add(i, 'day')).format(LOCAL_COMPARE)
      );
  }

  chooseDate(num: number, durationType: momentNs.DurationInputArg2) {
    const date = this.moment().subtract(num, durationType);
    const start = date.clone().startOf(durationType);
    const end = date.clone().endOf(durationType);
    this.colorDefined([start, end]);
    this.monthDays(start);
  }

  selectDate(momen: DpTest) {
    if (this.range) {
      const d = this.rangeStore.add(momen.date);

      d && this.rangeHover();

      d && this.colorDefined(this.rangeStore.inLocalFormat());

      if (this.rangeStore.isFull)
        this.valueChanged.next(this.rangeStore.inLocalFormat());
    } else {
      this.valueChanged.next(this.rangeStore.inLocalFormat());
      this.colorDefined([this.rangeStore.inLocalFormat()]);
    }
    if (!momen.isCurentMonth) this.monthDays(momen.date);
  }

  onHover(date: momentNs.MomentInput) {
    const isFuture = this.rangeStore.isBefore(date);
    const temp = [...this.rangeStore.inLocalFormat(), date];
    if (isFuture) this.colorDefined(temp, true);
  }

  private rangeHover() {
    if (this.rangeStore.isFull && this.hoverSub) {
      this.hoverSub.unsubscribe();
      this.hoverSub = null;
    } else if (!this.hoverSub) {
      this.hoverSub = this.pickerCell$.subscribe(res => {
        this.onHover(res.date);
      });
    }
  }

  button(type?: 'next' | 'prev') {
    this.monthDays(
      this.calendarStartMonth
        .add(type === 'next' ? 1 : -1, 'months')
        .startOf('month')
    );
  }

  moment(date: momentNs.MomentInput) {
    return moment(date);
  }
}

export class NguCalendarRangeStore {
  private store: momentNs.MomentInput[] = [];
  isFull = false;
  isSingle = false;

  add(date: momentNs.MomentInput) {
    const d = moment(date);
    if (this.isFull) this.push();

    if (this.isPast(d)) return false;

    if (!this.isSame(d)) return this.push(date);
    return false;
  }

  isPast(date: momentNs.Moment) {
    return this.isSingle && moment(this.store[0]).isAfter(date);
  }

  isSame(date: momentNs.Moment) {
    return !!this.store.find(
      e => moment(e).format(LOCAL_COMPARE) === date.format(LOCAL_COMPARE)
    );
  }

  isBefore(date: momentNs.MomentInput) {
    return moment(this.store[0]).isBefore(date);
  }

  inLocalFormat() {
    return this.store.map(e => moment(e).format(LOCAL_COMPARE));
  }

  private push(data?: momentNs.MomentInput) {
    data ? this.store.push(data) : (this.store = []);
    this.isFull = this.store.length === 2;
    this.isSingle = this.store.length === 1;
    return true;
  }
}
