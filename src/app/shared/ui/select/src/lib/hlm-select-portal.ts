import { BrnPopoverContent } from '@spartan-ng/brain/popover';
import { Directive } from '@angular/core';

@Directive({
  selector: '[hlmSelectPortal]',
  hostDirectives: [{ directive: BrnPopoverContent, inputs: ['context', 'class'] }],
})
export class HlmSelectPortal {}
