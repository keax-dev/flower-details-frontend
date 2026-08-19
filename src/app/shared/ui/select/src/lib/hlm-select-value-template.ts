import { BrnSelectValueTemplate } from '@spartan-ng/brain/select';
import { Directive } from '@angular/core';

@Directive({ selector: '[hlmSelectValueTemplate]', hostDirectives: [BrnSelectValueTemplate] })
export class HlmSelectValueTemplate {}
