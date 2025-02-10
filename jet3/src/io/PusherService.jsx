import Pusher from "pusher-js";

const PUSHER_APP_KEY = "99fda5c3c00f050a97e8";
const PUSHER_CLUSTER = "ap3";

class PusherService {
  constructor() {
    this.pusher = new Pusher(PUSHER_APP_KEY, {
      cluster: PUSHER_CLUSTER,
    });
  }

  subscribe(channelName, eventName, callback) {
    const channel = this.pusher.subscribe(channelName);
    channel.bind(eventName, callback);
  }

  unsubscribe(channelName) {
    this.pusher.unsubscribe(channelName);
  }
}

export default PusherService;
