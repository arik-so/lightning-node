import Peer from './peer';
import {Socket as TcpSocket} from 'net';
import LightningMessage from './messaging/lightning_message';
import debugModule = require('debug');

const debug = debugModule('lightning-node:wire:socket');

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
			debug('Received: %s', data.toString('hex'));
			this.processIncomingData(data);
		});

		this.socket.on('error', (error: Error) => {
			console.log('Error:');
			console.trace(error);
			this.destroy(error);
		});

		this.socket.on('close', () => {
			debug('Connection closed');
			this.destroy();
		});

	}

	public flush() {
		// if we have new incoming data, it needs to be sent immediately
		const writeBuffer = this.peer.flush();
		if (writeBuffer.length > 0) {
			debug('Sending: %s', writeBuffer.toString('hex'));
			this.socket.write(writeBuffer);
		}
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
		this.flush();
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

	private processIncomingData(data: Buffer) {
		const newMessages = this.peer.receive(data);

		this.flush();

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
}
