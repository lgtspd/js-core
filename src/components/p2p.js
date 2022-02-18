import Libp2p from "libp2p";
import { NOISE } from "@chainsafe/libp2p-noise";
import MPLEX from "libp2p-mplex";
import Bootstrap from "libp2p-bootstrap";
import mDNS from "libp2p-mdns";
import TCP from "libp2p-tcp";
import Gossipsub from "libp2p-gossipsub";

import { Log } from "../../build/index.js";

export default class P2P {
  constructor(bootstrap) {
    this._bootstrap = bootstrap;
  }

  async init(emitSelf=false) {
    this.log = Log.link(this);
    this._node = await Libp2p.create({
      addresses: { listen: ["/ip4/0.0.0.0/tcp/0"] }, // Addresses for the node to listen on
      modules: {
        transport: [TCP], // Ways that the node can communicate/connect
        connEncryption: [NOISE], // Ways that the connection can be encrypted
        streamMuxer: [MPLEX], // Ways that the connections are multiplexed
        peerDiscovery: [mDNS, Bootstrap], // Ways that the node can discover peers
        pubsub: Gossipsub, // Publish / Subscribe Messaging Services
      },
      config: {
        peerDiscovery: {
          autoDial: true, // Autoconnect to discovered peers
          [Bootstrap.tag]: {
            // Connects to the nodes specified
            interval: 60e3,
            enabled: true,
            list: this._bootstrap,
          },
          mdns: {
            interval: 20e3,
            enabled: true,
          }
        },
        pubsub: {
          emitSelf: emitSelf
        }
      },
    });
    await this._node.start();
    this._node.on("peer:discovery", (peer) =>
      this.log.verbose(`Found ${peer.toB58String()}`)
    ); // peer disc.
    this._node.connectionManager.on("peer:connect", (connection) =>
      this.log.verbose(`Linked ${connection.remotePeer.toB58String()}`)
    );
    this.log.debug(`Using ${this._node.peerId.toB58String()}`);
  }

  subscribe(channel, func) {
    this.log.verbose(`link ${channel}`);
    this._node.pubsub.on(channel, func);
    this._node.pubsub.subscribe(channel);
  }

  unsubscribe(channel) {
    this.log.verbose(`drop ${channel}`);
    this._node.pubsub.unsubscribe(channel);
  }

  push(channel, message) {
    this.log.verbose(`push ${channel}`);
    this._node.pubsub.publish(channel, message);
  }

  close() {
    this._node.stop();
  }
}
