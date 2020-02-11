import * as crypto from 'crypto';
import Peer from './peer';
import {Socket as TcpSocket} from 'net';
import LightningMessage from './messaging/lightning_message';

export default class Socket {

	private readonly socket: TcpSocket;
	private readonly peer: Peer;

	private dataPromise: Promise<LightningMessage[]>;
	private dataResolve;
	private dataReject;

	private readonly outbox: LightningMessage[];

	constructor(socket: TcpSocket, peer: Peer) {
		this.socket = socket;
		this.peer = peer;
		this.outbox = [];

		this.socket.on('data', (data: Buffer) => {
			console.log('Received:');
			console.log(data.toString('hex'), '\n');

			this.processIncomingData(data);
		});

		this.socket.on('error', (error: Error) => {
			console.log('Error:');
			console.trace(error);
			this.destroy(error);
		});

		this.socket.on('close', () => {
			console.log('Connection closed');
			this.destroy();
		});

	}

	private processIncomingData(data: Buffer) {
		const newMessages = this.peer.receive(data);

		// resolve promises awaiting data input
		if (this.dataPromise && newMessages.length > 0) {
			this.dataResolve(newMessages);
			this.dataPromise = null;
		}
	}

	private destroy(error?: Error) {
		if (this.dataPromise) {
			this.dataReject(error || new Error('connection closed'));
			this.dataPromise = null;
		}
		this.socket.destroy();
	}

	public send(message: LightningMessage) {
		if (this.socket.destroyed) {
			throw new Error('socket destroyed');
		}

		try {
			// first, let's check if we have anything in the outbox
			for (const oldMessage of this.outbox) {
				this.peer.send(oldMessage);
			}
			this.peer.send(message);
		} catch (e) {
			this.outbox.push(message);
		}

		// flush everything from the peer down the socket
		this.socket.write(this.peer.flush());
	}

	public async receive(): Promise<LightningMessage[]> {
		if (this.dataPromise) {
			return this.dataPromise;
		}

		if (this.socket.destroyed) {
			return Promise.reject(new Error('socket destroyed'));
		}

		this.dataPromise = new Promise((resolve, reject) => {
			this.dataResolve = resolve;
			this.dataReject = reject;
		});

		return this.dataPromise;
	}
}
