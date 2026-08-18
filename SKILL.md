---
name: angular-format-order
description: Format Angular TypeScript components and HTML templates using the project's custom descending-length ordering rules for imports, injected dependencies, and template attributes. Use when creating, editing, refactoring, or formatting Angular .ts or .html files. Do not change application behavior; this skill is formatting-only.
---

# Angular Format Order

Apply these formatting rules whenever creating or modifying Angular component TypeScript (`.ts`) or template (`.html`) files.

## Core rule

This skill is **formatting-only**.

- Do not change business logic.
- Do not rename variables, methods, services, selectors, bindings, or imports.
- Do not add or remove dependencies only for formatting purposes.
- Do not change expressions, conditions, event handlers, or values.
- Preserve the project's existing indentation and quote style unless another explicit project instruction overrides it.
- If an existing formatter or linter conflicts with these rules, follow the explicit project instructions first and report the conflict instead of silently changing behavior.

---

# TypeScript rules

## 1. Import declarations

For named imports using `{ ... }`, order the **import declarations** from the longest imported identifier to the shortest imported identifier.

Use the **first identifier inside `{}`** as the sort key.

Example:

```ts
import { NonNullableFormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserInfoService } from '@core/services/user-info.service';
import { ButtonComponent } from '@shared/components/button/button.component';
import { LoginResponse } from '@features/auth/interfaces/auth';
import { privateUiText } from '@core/i18n/private-ui-text';
import { LoginService } from '@features/auth/services/login.service';
import { AlertService } from '@core/services/alert.service';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
```

Length comparison is based only on the imported identifier, not on:

- the full import line;
- the module path;
- the number of characters in `from '...'`;
- aliases or path depth.

### Multiple identifiers inside one import

Do **not** reorder the identifiers inside the same `{ ... }` unless explicitly requested.

Example:

```ts
import { NonNullableFormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
```

Keep the internal identifier order as written.

### Equal-length imports

If two first imported identifiers have the same length, preserve their existing relative order.

This makes the sort stable and avoids unnecessary diffs.

### Other import forms

Preserve relative placement for:

```ts
import type { User } from './user';
import AuthService from './auth.service';
import * as utils from './utils';
import './styles.scss';
```

Do not convert one import style into another only to satisfy this skill.

---

## 2. Injected dependencies

For class fields that inject Angular dependencies with `inject(...)`, order them by the length of the **property name on the left side**, descending.

Example:

```ts
private readonly userInfoService = inject(UserInfoService);
private readonly loginService = inject(LoginService);
private readonly destroyRef = inject(DestroyRef);
private readonly router = inject(Router);
private readonly alert = inject(AlertService);
private readonly fb = inject(NonNullableFormBuilder);
```

The sort keys are:

```text
userInfoService
loginService
destroyRef
router
alert
fb
```

Do not sort by the injected class name.

### Equal-length injected properties

If two property names have the same length, preserve their existing relative order.

### Scope

Apply this rule to consecutive dependency fields declared with `inject(...)`.

Do not move normal component state merely to mix it with injected dependencies.

Example:

```ts
private readonly loginService = inject(LoginService);
private readonly router = inject(Router);

hide = true;
loading = false;
```

Component variables such as `hide` and `loading` do not require length-based ordering.

---

# HTML template rules

For every Angular/HTML opening tag, order attributes in the following groups:

1. Event bindings: `(event)`
2. Property/attribute bindings: `[property]`
3. All remaining attributes

Within **each group**, order attributes by the length of the **attribute name**, from longest to shortest.

Do not use the value/expression length when sorting.

## 1. Event bindings first

Example:

```html
<button
  (mouseenter)="showHelp()"
  (click)="hide = !hide"
>
```

Compare:

```text
mouseenter
click
```

The longer event name comes first.

## 2. Property bindings second

Example:

```html
<button
  [attr.aria-label]="passwordVisibilityLabel()"
  [title]="passwordVisibilityLabel()"
>
```

Compare the binding names:

```text
attr.aria-label
title
```

The longer binding name comes first.

## 3. Remaining attributes last

Example:

```html
<button
  class="btn border border-primary"
  type="button"
>
```

Compare:

```text
class
type
```

`class` is longer, so it comes first.

## Complete example

Input or generated markup should be formatted as:

```html
<button
  (click)="hide = !hide"
  [attr.aria-label]="passwordVisibilityLabel()"
  [title]="passwordVisibilityLabel()"
  class="btn border border-primary"
  type="button"
>
```

---

# Angular template attribute classification

Use these groups consistently.

## Group 1 — Event bindings

Examples:

```html
(click)
(change)
(input)
(submit)
(keydown.enter)
(mouseenter)
```

## Group 2 — Bound properties

Examples:

```html
[disabled]
[value]
[class.active]
[style.width.px]
[attr.aria-label]
[formControl]
```

## Group 3 — Remaining attributes

Examples:

```html
class
type
id
name
role
placeholder
autocomplete
formControlName
aria-label
data-testid
```

Structural syntax such as `*ngIf` or legacy structural directives belongs to the remaining-attributes group unless the project has a more specific rule.

Modern Angular control-flow blocks such as `@if`, `@for`, and `@switch` are not tag attributes and must not be reordered by this skill.

---

# Sorting details

When comparing lengths:

- Ignore the wrapper characters `(` `)` and `[` `]`.
- For event bindings, compare the event name itself.
- For property bindings, compare the complete binding name inside `[]`.
- For normal attributes, compare the attribute name.
- Ignore attribute values.
- Sort descending: longest name first.
- For equal lengths, keep original order.

Examples:

```text
[attr.aria-label] -> compare "attr.aria-label"
[title]           -> compare "title"
(click)           -> compare "click"
class             -> compare "class"
type              -> compare "type"
```

---

# Multiline formatting

When a tag has multiple Angular bindings or would be difficult to read on one line, prefer one attribute per line.

Example:

```html
<input
  (keydown.enter)="submit()"
  [attr.aria-describedby]="descriptionId"
  [formControl]="emailControl"
  autocomplete="email"
  placeholder="Correo electrónico"
  type="email"
/>
```

Do not force an already-readable short tag onto multiple lines solely because this skill exists unless formatting the surrounding block already requires it.

---

# Workflow

Whenever this skill is used:

1. Identify modified Angular `.ts` and `.html` files.
2. In `.ts` files:
   - reorder named import declarations using the first imported identifier length;
   - reorder consecutive `inject(...)` dependency fields using property-name length;
   - leave normal state variables alone.
3. In `.html` files:
   - group attributes as events, bindings, then remaining attributes;
   - sort each group by attribute-name length descending.
4. Preserve semantics.
5. Review the diff and remove any formatting-only churn unrelated to these rules.
6. If the repository has lint/format commands, run the relevant existing command when appropriate and verify it does not undo these rules.

---

# Final checklist

Before finishing, verify:

- Imports are ordered longest-to-shortest using the first identifier inside `{}`.
- Identifiers inside a single import were not reordered.
- `inject(...)` fields are ordered by left-side property-name length.
- Normal component variables were not unnecessarily reordered.
- HTML events `()` appear before bindings `[]`.
- HTML bindings `[]` appear before normal attributes.
- Attributes inside every group are longest-to-shortest by attribute-name length.
- Equal-length items retain their previous order.
- No application behavior changed.
