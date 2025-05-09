import moment from 'moment';

export class RouteUtil {

  static durationAsString(durationInSeconds: number) {
    return moment.utc(moment.duration(durationInSeconds, "seconds").asMilliseconds()).format("HH:mm")
  }
}
