import Peer from '../wire/peer.js';
import * as crypto from 'crypto';
import {Direction} from '../wire/handshake/direction.js';
import * as net from 'net';
import Socket from '../wire/socket.js';
import {LightningMessageTypes} from '../wire/messaging/lightning_message.js';
import InitHandler from './handlers/init_handler.js';
import PingHandler from './handlers/ping_handler.js';

export default class Node {

	private identityKey: Buffer;

	constructor(identityKey?: Buffer) {
		this.identityKey = identityKey;
		if (!identityKey) {
			this.identityKey = crypto.randomBytes(32);
		}
	}

	public start() {
		// open TCP listening port, set up handlers, etc.
	}

	public connect(domain: string, port: number, publicKey: Buffer): Socket {
		// instantiate a tcp socket and a peer
		const peer = new Peer({
			direction: Direction.Outbound,
			remotePublicKey: publicKey,
			privateKey: this.identityKey
		});

		const tcpSocket = new net.Socket();
		const socket = new Socket(tcpSocket, peer);

		const initHandler = new InitHandler();
		peer.registerHandler([LightningMessageTypes.INIT], initHandler);

		const pingHandler = new PingHandler();
		peer.registerHandler([LightningMessageTypes.PING], pingHandler);

		tcpSocket.connect(port, domain, () => {
			socket.flush();
		});

		return socket;
	}

	public get channels(): any[] {
		return [];
	}

	public get peers(): any[] {
		return [];
	}

}
