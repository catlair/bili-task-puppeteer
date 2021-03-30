import { LiveSignInfoDto } from '../dto/Live.dto';

export abstract class LiveTaskData {
  static liveSign: LiveSignInfoDto['data'] = null;
}
