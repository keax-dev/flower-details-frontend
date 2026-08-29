import { Service } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { inject } from '@angular/core';

@Service()
export class NotificationService {
  private readonly messageService = inject(NzMessageService);

  success(message: string): void {
    this.messageService.success(message);
  }

  error(message: string): void {
    this.messageService.error(message);
  }

  warning(message: string): void {
    this.messageService.warning(message);
  }

  info(message: string): void {
    this.messageService.info(message);
  }

  errorApi(messages: string | string[]): void {
    if (Array.isArray(messages)) {
      messages.forEach((message) => this.messageService.error(message));
      return;
    }

    this.error(messages);
  }
}
