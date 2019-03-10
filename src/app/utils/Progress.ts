import * as ProgressBar from 'progressbar.js';

export class Progress {
  private static _count = 0;
  private static _spinner: any;
  private static _element: HTMLElement;
  private static _progress = 0;
  private static _timer: number;

  public static show(): void {
    if (Progress._count === 0 && Progress._element == null) {
      Progress._progress = 0;
      clearTimeout(Progress._timer);
      Progress._element = document.createElement('div');
      Progress._element.className = 'gc-progress';
      const circleElement = document.createElement('div');
      circleElement.className = 'circle';
      Progress._element.appendChild(circleElement);
      document.body.appendChild(Progress._element);

      this._spinner = new ProgressBar.Circle(circleElement, {
        strokeWidth: 5,
        step: function(state, circle) {
          const value = Math.floor(circle.value() * 100);
          if (value === 0) {
            circle.setText('');
          } else {
            circle.setText(value);
          }
        }
      });

      Progress.fakeProgressHandler();
    }

    Progress._count++;
  }

  private static fakeProgressHandler(): void {
    Progress._timer = setTimeout(Progress.fakeProgressHandler, Math.floor(1000 + Math.random() * 1000));
    Progress.update(Progress._progress + 0.01);
  }

  public static update(progress: number): void {
    if (Progress._spinner && Progress._progress < progress && progress < 1) {
      Progress._progress = progress;
      Progress._spinner.animate(progress);
    }
  }

  public static hide(): void {
    if (Progress._count === 0) {
      return;
    }

    Progress._count--;
    setTimeout(Progress.innerHide.bind(Progress), 100);
  }

  private static innerHide(): void {
    if (Progress._count <= 0 && Progress._element != null) {
      this._spinner.stop();
      document.body.removeChild(Progress._element);
      Progress._element = null;
      Progress._progress = 0;
      clearTimeout(Progress._timer);
    }
  }
}
