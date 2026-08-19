import { BrnSelectValues } from '@spartan-ng/brain/select';
import { Directive } from '@angular/core';

@Directive({ selector: '[hlmSelectValues]', hostDirectives: [BrnSelectValues] })
export class HlmSelectValues {}
