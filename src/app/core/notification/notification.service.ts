import { Service } from '@angular/core';
import { toast } from '@spartan-ng/brain/sonner';

@Service()
export class NotificationService {
  success(message: string): void {
    toast.success(message);
  }

  error(message: string): void {
    toast.error(message);
  }

  warning(message: string): void {
    toast.warning(message);
  }

  info(message: string): void {
    toast.info(message);
  }
}
