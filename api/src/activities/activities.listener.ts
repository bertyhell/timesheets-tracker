import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import ActiveWindow, { type WindowInfo } from '@paymoapp/active-window';

import { logger } from '../shared/logger';

import { ActivitiesService } from './activities.service';
import { type CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivitiesListener implements OnApplicationBootstrap {
  private activeWindowSubscriptionId: number;
  private lastActivity: CreateActivityDto | null = null;

  constructor(@Inject(ActivitiesService) private activitiesService: ActivitiesService) {}

  async onApplicationBootstrap() {
    await this.startListening();
  }

  async startListening() {
    ActiveWindow.initialize();

    if (!ActiveWindow.requestPermissions()) {
      console.error(
        'Error: You need to grant screen recording permission in System Preferences > Security & Privacy > Privacy > Screen Recording'
      );
      process.exit(0);
    }

    this.startTrackingOpenPrograms();
  }

  async stopListening() {
    ActiveWindow.unsubscribe(this.activeWindowSubscriptionId);
    this.lastActivity = null;
  }

  private startTrackingOpenPrograms() {
    this.activeWindowSubscriptionId = ActiveWindow.subscribe(
      async (windowInfo: WindowInfo | null) => {
        if (!windowInfo) {
          return;
        }
        const currentActivity: CreateActivityDto = {
          programName: windowInfo.application,
          windowTitle: windowInfo.title,
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
        };

        if (!this.lastActivity) {
          this.lastActivity = currentActivity;
        } else if (
          // If same program and title, ignore entry
          (this.lastActivity.programName === currentActivity.programName &&
            this.lastActivity.windowTitle === currentActivity.windowTitle) ||
          // If windows explorer en no title, ignore entry
          (currentActivity.programName === 'Windows Explorer' && currentActivity.windowTitle === '')
        ) {
          // ignore entry since it's the same activity as this.lastActivity
        } else {
          // Activity changes, write last activity to database
          const { icon: _icon, ...info } = windowInfo;
          logger.info(
            'changed application or title: ',
            new Date().toISOString(),
            JSON.stringify(info)
          );
          await this.activitiesService.create({
            programName: this.lastActivity.programName,
            windowTitle: this.lastActivity.windowTitle,
            startedAt: this.lastActivity.startedAt,
            endedAt: currentActivity.startedAt,
          });
          this.lastActivity = currentActivity;
        }
      }
    );
  }
}
