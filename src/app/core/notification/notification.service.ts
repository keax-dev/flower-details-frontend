import { Service } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { inject } from '@angular/core';

@Service()
export class NotificationService {
  private readonly messageService = inject(NzMessageService);

  success(message: string): void {
    this.messageService.success(escapeMessage(message));
  }

  error(message: string): void {
    this.messageService.error(escapeMessage(message));
  }

  warning(message: string): void {
    this.messageService.warning(escapeMessage(message));
  }

  info(message: string): void {
    this.messageService.info(escapeMessage(message));
  }

  errorApi(messages: string | string[]): void {
    if (Array.isArray(messages)) {
      messages.forEach((message) => this.error(message));
      return;
    }

    this.error(messages);
  }
}

function escapeMessage(message: string): string {
  return message.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
