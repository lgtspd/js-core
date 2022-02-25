import Libp2p from "libp2p";
import { NOISE } from "@chainsafe/libp2p-noise";
import MPLEX from "libp2p-mplex";
import Bootstrap from "libp2p-bootstrap";
import mDNS from "libp2p-mdns";
import TCP from "libp2p-tcp";
import Gossipsub from "libp2p-gossipsub";

import { Log } from "../../build/utils/imports.js"

export default class Net {
    constructor(node) {
        this.log = Log.link(this);
        node.on("peer:discovery", (peer) => this.log.verbose(`Found ${peer.toB58String()}`));
        node.connectionManager.on("peer:connect", conn => this.log.verbose(`Linked ${conn.remotePeer.toB58String()}`));
        this.node = node
        this.log.verbose(`Using  ${this.node.peerId.toB58String()}`);
    }

    static async init(bootstrap, emitSelf=false) {
        const node = await Libp2p.create({
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
                        list: bootstrap,
                    },
                    mdns: {
                        interval: 20e3,
                        enabled: true,
                    }
                },
                pubsub: {
                    emitSelf: emitSelf
                }
            }
        });
        await node.start();
        return new Net(node)
    }

    subscribe(channel, func) {
        this.log.verbose(`link ${channel}`);
        this.node.pubsub.on(channel, func);
        this.node.pubsub.subscribe(channel);
    }
    
    unsubscribe(channel) {
      this.log.verbose(`drop ${channel}`);
      this.node.pubsub.unsubscribe(channel);
    }

    push(channel, message) {
      this.log.verbose(`push ${channel}`);
      this.node.pubsub.publish(channel, message);
    }

    close() {
      this.node.stop();
    }    
}