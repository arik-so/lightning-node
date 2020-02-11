import Handshake, {Role} from './handshake';
import Cipher from './cipher';
import LightningMessage from './messaging/lightning_message';

export enum Direction {
	Inbound,
	Outbound
}

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

		if (direction === Direction.Outbound) {
			if (!Buffer.isBuffer(remotePublicKey) || remotePublicKey.length !== 33) {
				throw new Error('remote public key is necessary for out bound peers!');
			}

			this.remotePublicKey = remotePublicKey;

			const {responseBuffer} = handshake.actDynamically({
				role: Role.INITIATOR,
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

}
