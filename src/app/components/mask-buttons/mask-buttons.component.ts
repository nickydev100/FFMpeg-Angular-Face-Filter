import {Component, EventEmitter, Output} from '@angular/core';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';

@Component({
  selector: 'app-mask-buttons',
  templateUrl: './mask-buttons.component.pug',
  styleUrls: ['./mask-buttons.component.scss']
})
export class MaskButtonsComponent {
  masks = [
    'mascot-flame-hairs-mask1',
    'mascot-rocketman',
    'mascot-flame-hairs-mask2',
    'flame-hairs',
    'flame-hairs-mask1',
  ];

  @Output()
  change: EventEmitter<string> = new EventEmitter();

  constructor(private _sanitizer: DomSanitizer) {

  }

  getButtonUrl(button: string): SafeStyle {
    return this._sanitizer.bypassSecurityTrustStyle(`url(assets/images/buttons/${button}.png`);
  }

  buttonHandler(maskId: string): void {
    this.change.emit(maskId);
  }
}
