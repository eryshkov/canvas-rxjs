import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {Position} from './position.interface';
import {fromEvent} from 'rxjs';
import {map, pairwise, switchMap, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('canvas') private canvasRef: ElementRef;
  private canvas: HTMLCanvasElement;

  ngAfterViewInit(): void {
    this.canvas = this.canvasRef.nativeElement as HTMLCanvasElement;

    const cx = this.canvas.getContext('2d');
    cx.lineWidth = 4;

    const mouseMove$ = fromEvent<MouseEvent>(this.canvas, 'mousemove');

    const points$ = mouseMove$
      .pipe(
        map<MouseEvent, Position>(event => {
          const {top, left} = this.canvas.getBoundingClientRect();
          return {x: event.clientX - left, y: event.clientY - top};
        }),
        pairwise<Position>()
      );

    const mouseUp$ = fromEvent<MouseEvent>(this.canvas, 'mouseup');

    const mouseOut$ = fromEvent<MouseEvent>(this.canvas, 'mouseout');

    const mouseDown$ = fromEvent<MouseEvent>(this.canvas, 'mousedown')
      .pipe(
        switchMap(() => {
          return points$
            .pipe(
              takeUntil(mouseOut$),
              takeUntil(mouseUp$)
            );
        }),
      )
      .subscribe(element => {
        this.drawLine(element, cx);
      });
  }

  private drawLine([prev, next]: Position[], cx: CanvasRenderingContext2D) {
    cx.beginPath();

    cx.moveTo(prev.x, prev.y);
    cx.lineTo(next.x, next.y);
    cx.stroke();
  }
}
