import {Chacha} from 'chacha-poly1305-wasm';
import HKDF from './hkdf.js';
import {default as debugModule} from 'debug';
import ChachaNonce from './chacha_nonce.js';

const debug = debugModule('lightning-node:wire:cipher');

export default class Cipher {
	private sendingKey: Buffer;
	private receivingKey: Buffer;

	private sendingChainingKey: Buffer;
	private receivingChainingKey: Buffer;

	private sendingNonce: number = 0;
	private receivingNonce: number = 0;

	constructor({sendingKey, receivingKey, chainingKey}: { sendingKey: Buffer, receivingKey: Buffer, chainingKey: Buffer }) {
		this.sendingKey = sendingKey;
		this.receivingKey = receivingKey;
		this.sendingChainingKey = chainingKey;
		this.receivingChainingKey = chainingKey;
	}

	public encrypt(message: Buffer): Buffer {
		const length = message.length;

		const lengthBuffer = Buffer.alloc(2);
		lengthBuffer.writeUInt16BE(length, 0);

		const encryptedLength = Chacha.encrypt(this.sendingKey, ChachaNonce.encode(BigInt(this.sendingNonce)), Buffer.alloc(0), lengthBuffer);
		this.incrementSendingNonce();

		const encryptedMessage = Chacha.encrypt(this.sendingKey, ChachaNonce.encode(BigInt(this.sendingNonce)), Buffer.alloc(0), message);
		this.incrementSendingNonce();

		return Buffer.concat([encryptedLength, encryptedMessage]);
	}

	public decrypt(undelimitedBuffer: Buffer): { message?: Buffer, unreadIndexOffset: number } {
		if (undelimitedBuffer.length < 18) {
			debug('Buffer too short to decode message length');
			return {
				message: null, // we failed to decrypt anything
				unreadIndexOffset: 0
			}
		}

		const encryptedLength = undelimitedBuffer.slice(0, 18);
		const lengthBuffer = Chacha.decrypt(this.receivingKey, ChachaNonce.encode(BigInt(this.receivingNonce)), Buffer.alloc(0), encryptedLength);
		const length = lengthBuffer.readUInt16BE(0);
		const taggedLength = length + 16;

		const lastEncryptedDataIndex = 18 + taggedLength;
		debug('Decrypting Lightning message of length %d (with tag: %d)', length, taggedLength);
		const encryptedMessage = undelimitedBuffer.slice(18, lastEncryptedDataIndex);
		debug('Tagged Lightning message: %s', encryptedMessage.toString('hex'));

		// verify I have enough stuff in here
		if (encryptedMessage.length < taggedLength) {
			// we do not have enough data
			debug('Tagged Lightning message: too short, aborting');
			return {
				message: null, // we failed to decrypt anything
				unreadIndexOffset: 0
			}
		}

		// if so, increment nonce
		this.incrementReceivingNonce();

		const message = Chacha.decrypt(this.receivingKey, ChachaNonce.encode(BigInt(this.receivingNonce)), Buffer.alloc(0), encryptedMessage);

		this.incrementReceivingNonce();

		return {message, unreadIndexOffset: lastEncryptedDataIndex};
	}

	private incrementSendingNonce() {
		this.sendingNonce++;
		if (this.sendingNonce >= 1000) {
			this.sendingKey = this.rotateSendingKey(this.sendingKey);
			this.sendingNonce = 0;
		}
	}

	private incrementReceivingNonce() {
		this.receivingNonce++;
		if (this.receivingNonce >= 1000) {
			this.receivingKey = this.rotateReceivingKey(this.receivingKey);
			this.receivingNonce = 0;
		}
	}

	private rotateSendingKey(key: Buffer): Buffer {
		const derivative = HKDF.derive(this.sendingChainingKey, key);
		this.sendingChainingKey = derivative.slice(0, 32);
		return derivative.slice(32);
	}

	private rotateReceivingKey(key: Buffer): Buffer {
		const derivative = HKDF.derive(this.receivingChainingKey, key);
		this.receivingChainingKey = derivative.slice(0, 32);
		return derivative.slice(32);
	}
}
