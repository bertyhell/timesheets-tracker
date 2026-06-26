import { CreateProgramDto } from '../dto/create-activity.dto';

export interface WindowChangeEvent {
  program: CreateProgramDto;
  icon: string | null;
}

export interface IWindowListener {
  start(onWindowChange: (event: WindowChangeEvent) => Promise<void>): Promise<CreateProgramDto | null>;
  stop(): void;
}
