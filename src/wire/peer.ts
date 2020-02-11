import Handshake from './handshake';
import Cipher from './cipher';
import LightningMessage from './messaging/lightning_message';
import {Direction} from './handshake/direction';

export default class Peer {

	private conduit: Handshake | Cipher;

	private remotePublicKey?: Buffer;

	private readBuffer: Buffer;
	private writeBuffer: Buffer;

	private inbox: LightningMessage[];

	constructor({direction, privateKey, remotePublicKey, ephemeralPrivateKey}: { direction: Direction, privateKey: Buffer, remotePublicKey?: Buffer, ephemeralPrivateKey?: Buffer }) {

		if (!Object.values(Direction).includes(direction)) {
			throw new Error('invalid direction');
		}

		if (!Buffer.isBuffer(privateKey) || privateKey.length !== 32) {
			throw new Error('invalid private key');
		}

		const handshake = new Handshake({privateKey});
		this.readBuffer = Buffer.alloc(0);
		this.writeBuffer = Buffer.alloc(0);
		this.inbox = [];

		if (direction === Direction.Outbound) {
			if (!Buffer.isBuffer(remotePublicKey) || remotePublicKey.length !== 33) {
				throw new Error('remote public key is necessary for out bound peers!');
			}

			this.remotePublicKey = remotePublicKey;

			const {responseBuffer} = handshake.actDynamically({
				direction,
				remotePublicKey,
				ephemeralPrivateKey
			});
			this.writeBuffer = responseBuffer;
		}

		this.conduit = handshake;

	}

	/**
	 * Returns array of new Lightning messages
	 * @param data
	 */
	public receive(data: Buffer): LightningMessage[] {
		this.readBuffer = Buffer.concat([this.readBuffer, data]);

		// check what state we're in
		if (this.conduit instanceof Handshake) {

			const nextStep = this.conduit.actDynamically({incomingBuffer: this.readBuffer});
			// write data
			this.writeBuffer = Buffer.concat([this.writeBuffer, nextStep.responseBuffer]);
			// ignore read data
			this.readBuffer = this.readBuffer.slice(nextStep.unreadIndexOffset);

			if (nextStep.cipher instanceof Cipher) {
				this.conduit = nextStep.cipher;
			}
		}

		const newMessages = [];

		if (this.conduit instanceof Cipher) {

			let unreadOffset = 0;
			do {
				const readResult = this.conduit.decrypt(this.readBuffer);
				unreadOffset = readResult.unreadIndexOffset;

				if (unreadOffset > 0) {
					this.readBuffer = this.readBuffer.slice(unreadOffset);
				}

				if (Buffer.isBuffer(readResult.message)) {
					const message = LightningMessage.parse(readResult.message);
					newMessages.push(message);
				}
			} while (unreadOffset > 0)
		}

		if (newMessages.length > 0) {
			this.inbox = [...this.inbox, ...newMessages];
		}

		return newMessages;
	}

	/**
	 * Returns encrypted message data that was also added to the pending write buffer
	 * @param message
	 */
	public send(message: LightningMessage): Buffer {
		if (!(this.conduit instanceof Cipher)) {
			throw new Error('cannot send data before handshake completes');
		}

		const ciphertext = this.conduit.encrypt(message.toBuffer());
		this.writeBuffer = Buffer.concat([this.writeBuffer, ciphertext]);

		return ciphertext;
	}

	/**
	 * Returns and initializes the write buffer
	 */
	public flush(): Buffer {
		const writeBuffer = this.writeBuffer;
		this.writeBuffer = Buffer.alloc(0);
		return writeBuffer;
	}

}
