import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';
import { fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { DpTest } from './datepicker.interface';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[dpHover]'
})
export class DpHoverDirective {
  @Input() dpHover: DpTest;
  cellHovered = fromEvent(this.el.nativeElement, 'mouseover').pipe(map(e => this.dpHover));
  constructor(private renderer: Renderer2, private el: ElementRef) {}
}
