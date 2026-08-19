import { BrnFieldControlDescribedBy } from '@spartan-ng/brain/field';
import { NgIcon, provideIcons } from '@ng-icons/core';
import type { BooleanInput } from '@angular/cdk/coercion';
import { lucideChevronDown } from '@ng-icons/lucide';
import { BrnSelectTrigger } from '@spartan-ng/brain/select';
import type { ClassValue } from 'clsx';
import { hlm } from '@spartan-ng/helm/utils';
import {
  ChangeDetectionStrategy,
  booleanAttribute,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'hlm-select-trigger',
  imports: [NgIcon, BrnSelectTrigger, BrnFieldControlDescribedBy],
  providers: [provideIcons({ lucideChevronDown })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [attr.data-size]="size()"
      [forceInvalid]="forceInvalid()"
      [class]="_computedClass()"
      [id]="buttonId()"
      data-slot="select-trigger"
      brnFieldControlDescribedBy
      brnSelectTrigger
    >
      <ng-content />
      <ng-icon
        name="lucideChevronDown"
        class="text-muted-foreground text-[length:--spacing(4)] ms-auto"
      />
    </button>
  `,
})
export class HlmSelectTrigger {
  private static _id = 0;

  public readonly userClass = input<ClassValue>('', { alias: 'class' });
  protected readonly _computedClass = computed(() =>
    hlm(
      'border-input data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 data-[matches-spartan-invalid=true]:ring-destructive/20 dark:data-[matches-spartan-invalid=true]:ring-destructive/40 data-[matches-spartan-invalid=true]:border-destructive dark:data-[matches-spartan-invalid=true]:border-destructive/50 gap-1.5 rounded-lg border bg-transparent py-2 ps-2.5 pe-2 text-sm transition-colors focus-visible:ring-3 data-[matches-spartan-invalid=true]:ring-3 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:gap-1.5 flex w-fit items-center justify-between whitespace-nowrap outline-none disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0',
      this.userClass(),
    ),
  );

  public readonly buttonId = input<string>(`hlm-select-trigger-${HlmSelectTrigger._id++}`);

  public readonly size = input<'default' | 'sm'>('default');

  /** Whether to force the trigger into an invalid state. */
  public readonly forceInvalid = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
  });
}
