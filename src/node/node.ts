import Peer from '../wire/peer';
import * as crypto from 'crypto';
import {Direction} from '../wire/handshake/direction';
import * as net from 'net';
import Socket from '../wire/socket';
import LightningMessage, {LightningMessageTypes} from '../wire/messaging/lightning_message';
import LightningMessageHandler from './handler';

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

		peer.registerHandler([LightningMessageTypes.INIT], new class implements LightningMessageHandler {
			async processMessage(message: LightningMessage): Promise<LightningMessage[]> {
				return [message]; // return the same message
			}
		});

		tcpSocket.connect(port, domain, () => {
			socket.flush();
		});

		return socket;
	}

}
