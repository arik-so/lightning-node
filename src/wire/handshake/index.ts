import Bigi = require('bigi');
import debugModule = require('debug');
import ecurve = require('ecurve');
import * as crypto from 'crypto';
import {Point} from 'ecurve';
import Cipher from '../cipher';
import HKDF from '../hkdf';
import Chacha from 'chacha-poly1305-wasm';
import ChachaNonce from '../chacha_nonce';
import {Direction} from './direction';

const debug = debugModule('bolt08:handshake');
const secp256k1 = ecurve.getCurveByName('secp256k1');

/**
 * Protocol for handling the key setup
 */
export default class Handshake {

	private direction?: Direction;
	private nextActIndex: number = -1;

	private privateKey: Bigi;
	private publicKey: Point;

	private ephemeralPrivateKey: Bigi;
	private ephemeralPublicKey: Point;

	private remotePublicKey: Point;
	private remoteEphemeralKey: Point;

	private temporaryKeys: Buffer[] = [];

	private hash: HandshakeHash;
	private chainingKey: Buffer;

	private cipher: Cipher;

	constructor({privateKey = null}: { privateKey?: Buffer }) {
		if (!privateKey) {
			privateKey = crypto.randomBytes(32);
		}
		this.privateKey = Bigi.fromBuffer(privateKey);
		this.publicKey = secp256k1.G.multiply(this.privateKey);

		// initialize handshake hash
		const protocolName = Buffer.from('Noise_XK_secp256k1_ChaChaPoly_SHA256', 'ascii');
		this.chainingKey = crypto.createHash('sha256').update(protocolName).digest();
		const prologue = Buffer.from('lightning', 'ascii');
		this.hash = new HandshakeHash(Buffer.concat([this.chainingKey, prologue]));
	}

	public actDynamically({direction, incomingBuffer, ephemeralPrivateKey, remotePublicKey}: { direction?: Direction, incomingBuffer?: Buffer, ephemeralPrivateKey?: Buffer, remotePublicKey?: Buffer }): { responseBuffer?: Buffer, cipher?: Cipher, unreadIndexOffset: number } {
		if (!(this.direction in Direction)) {
			if (!(direction in Direction)) {
				throw new Error('invalid direction');
			}

			this.assumeDirection(direction);
			this.nextActIndex = 0;
		}

		let unreadIndexOffset = 0;
		let responseBuffer: Buffer = null;
		let txHander: Cipher;

		// we generate a local, static ephemeral private key
		if (!this.ephemeralPrivateKey) {
			if (!ephemeralPrivateKey) {
				ephemeralPrivateKey = crypto.randomBytes(32);
			}
			this.ephemeralPrivateKey = Bigi.fromBuffer(ephemeralPrivateKey);
		}

		if (this.nextActIndex === 0) {
			if (this.direction === Direction.Outbound) {
				// we are starting the communication

				if (!remotePublicKey) {
					throw new Error('remote public key must be known to initiate handshake');
				}

				responseBuffer = this.serializeActOne({
					ephemeralPrivateKey: this.ephemeralPrivateKey.toBuffer(32),
					remotePublicKey: remotePublicKey
				});

				this.nextActIndex = 1; // next step: process incoming act two
			} else {
				if (!incomingBuffer) {
					throw new Error('incoming message must be known to receive handshake');
				}

				unreadIndexOffset = 50;
				this.processActOne(incomingBuffer.slice(0, unreadIndexOffset));

				responseBuffer = this.serializeActTwo({ephemeralPrivateKey: this.ephemeralPrivateKey.toBuffer(32)});

				this.nextActIndex = 2; // next step: process incoming act three
			}

		} else if (this.nextActIndex === 1 && this.direction === Direction.Outbound) {
			if (!incomingBuffer) {
				throw new Error('incoming message must be known to receive handshake');
			}

			unreadIndexOffset = 50;
			this.processActTwo(incomingBuffer.slice(0, unreadIndexOffset));

			responseBuffer = this.serializeActThree();
			txHander = this.cipher;
			this.nextActIndex = -1; // we are done
		} else if (this.nextActIndex === 2 && this.direction === Direction.Inbound) {
			if (!incomingBuffer) {
				throw new Error('incoming message must be known to receive handshake');
			}

			unreadIndexOffset = 66;
			this.processActThree(incomingBuffer.slice(0, unreadIndexOffset));

			txHander = this.cipher;
			this.nextActIndex = -1; // we are done
		} else {
			throw new Error('invalid state!');
		}

		return {
			responseBuffer,
			unreadIndexOffset,
			cipher: txHander
		};
	}

	private assumeDirection(direction: Direction) {
		if (this.direction in Direction) {
			if (direction === this.direction) {
				return; // nothing is changing
			}
			throw new Error('directions cannot change!');
		}
		this.direction = direction;
	}

	private assertDirection(direction: Direction) {
		if (this.direction !== direction) {
			throw new Error('invalid action for direction!');
		}
	}

	public serializeActOne({ephemeralPrivateKey = null, remotePublicKey}: { ephemeralPrivateKey?: Buffer, remotePublicKey: Buffer }): Buffer {
		this.assumeDirection(Direction.Outbound);
		this.remotePublicKey = Point.decodeFrom(secp256k1, remotePublicKey);
		this.hash.update(this.remotePublicKey.getEncoded(true));

		if (!ephemeralPrivateKey) {
			ephemeralPrivateKey = crypto.randomBytes(32);
		}

		const ephemeralPrivateKeyInteger = Bigi.fromBuffer(ephemeralPrivateKey);
		return this.serializeActMessage({
			actIndex: 0,
			ephemeralPrivateKey: ephemeralPrivateKeyInteger,
			peerPublicKey: this.remotePublicKey
		});
	}

	public processActOne(actOneMessage: Buffer) {
		this.assumeDirection(Direction.Inbound);
		this.hash.update(this.publicKey.getEncoded(true));

		this.remoteEphemeralKey = this.processActMessage({
			actIndex: 0,
			message: actOneMessage,
			localPrivateKey: this.privateKey
		});
	}

	public serializeActTwo({ephemeralPrivateKey = null}: { ephemeralPrivateKey?: Buffer }): Buffer {
		this.assertDirection(Direction.Inbound);

		if (!ephemeralPrivateKey) {
			ephemeralPrivateKey = crypto.randomBytes(32);
		}

		const ephemeralPrivateKeyInteger = Bigi.fromBuffer(ephemeralPrivateKey);
		return this.serializeActMessage({
			actIndex: 1,
			ephemeralPrivateKey: ephemeralPrivateKeyInteger,
			peerPublicKey: this.remoteEphemeralKey
		});
	}

	public processActTwo(actTwoMessage: Buffer) {
		this.assertDirection(Direction.Outbound);
		this.remoteEphemeralKey = this.processActMessage({
			actIndex: 1,
			message: actTwoMessage,
			localPrivateKey: this.ephemeralPrivateKey
		});
	}

	public serializeActThree(): Buffer {
		this.assertDirection(Direction.Outbound);

		// do the stuff here
		const temporaryKey = this.temporaryKeys[1]; // from the second act
		const chacha = Chacha.encrypt(temporaryKey, ChachaNonce.encode(BigInt(1)), this.hash.value, this.publicKey.getEncoded(true));
		debug('Act 3 chacha: %s', chacha.toString('hex'));

		this.hash.update(chacha);

		const sharedSecret = Handshake.ecdh({
			privateKey: this.privateKey,
			publicKey: this.remoteEphemeralKey
		});

		const derivative = HKDF.derive(this.chainingKey, sharedSecret);
		this.chainingKey = derivative.slice(0, 32);
		this.temporaryKeys[2] = derivative.slice(32);

		const tag = Chacha.encrypt(this.temporaryKeys[2], ChachaNonce.encode(BigInt(0)), this.hash.value, Buffer.alloc(0));

		const transmissionKeys = HKDF.derive(this.chainingKey, Buffer.alloc(0));
		const sendingKey = transmissionKeys.slice(0, 32);
		const receivingKey = transmissionKeys.slice(32);

		this.cipher = new Cipher({sendingKey, receivingKey, chainingKey: this.chainingKey});

		return Buffer.concat([Buffer.alloc(1, 0), chacha, tag]);
	}

	public processActThree(actThreeMessage: Buffer) {
		this.assertDirection(Direction.Inbound);

		if (actThreeMessage.length != 66) {
			throw new Error('act one/two message must be 50 bytes');
		}
		const version = actThreeMessage.readUInt8(0);
		if (version !== 0) {
			throw new Error('unsupported version');
		}

		const chacha = actThreeMessage.slice(1, 50);
		const tag = actThreeMessage.slice(50, 66);

		const remotePublicKey = Chacha.decrypt(this.temporaryKeys[1], ChachaNonce.encode(BigInt(1)), this.hash.value, chacha);
		this.remotePublicKey = Point.decodeFrom(secp256k1, remotePublicKey);

		this.hash.update(chacha);
		const sharedSecret = Handshake.ecdh({
			privateKey: this.ephemeralPrivateKey,
			publicKey: this.remotePublicKey
		});

		const derivative = HKDF.derive(this.chainingKey, sharedSecret);
		this.chainingKey = derivative.slice(0, 32);
		this.temporaryKeys[2] = derivative.slice(32);

		// make sure the tag checks out
		Chacha.decrypt(this.temporaryKeys[2], ChachaNonce.encode(BigInt(0)), this.hash.value, tag);

		const transmissionKeys = HKDF.derive(this.chainingKey, Buffer.alloc(0));
		const receivingKey = transmissionKeys.slice(0, 32);
		const sendingKey = transmissionKeys.slice(32);

		this.cipher = new Cipher({sendingKey, receivingKey, chainingKey: this.chainingKey});
	}

	private serializeActMessage({actIndex, ephemeralPrivateKey, peerPublicKey}: { actIndex: number, ephemeralPrivateKey: Bigi, peerPublicKey: Point }) {
		const ephemeralPublicKey = secp256k1.G.multiply(ephemeralPrivateKey);
		this.ephemeralPrivateKey = ephemeralPrivateKey;
		this.ephemeralPublicKey = ephemeralPublicKey;
		this.hash.update(this.ephemeralPublicKey.getEncoded(true));

		const sharedEphemeralSecret = Handshake.ecdh({
			privateKey: ephemeralPrivateKey,
			publicKey: peerPublicKey
		});

		const derivative = HKDF.derive(this.chainingKey, sharedEphemeralSecret);
		this.chainingKey = derivative.slice(0, 32);
		const temporaryKey = derivative.slice(32);
		this.temporaryKeys[actIndex] = temporaryKey;

		const chachaTag = Chacha.encrypt(temporaryKey, ChachaNonce.encode(BigInt(0)), this.hash.value, Buffer.alloc(0));
		this.hash.update(chachaTag);

		return Buffer.concat([Buffer.alloc(1, 0), this.ephemeralPublicKey.getEncoded(true), chachaTag]);
	}

	private processActMessage({actIndex, message, localPrivateKey}: { actIndex: number, message: Buffer, localPrivateKey: Bigi }): Point {
		if (message.length != 50) {
			throw new Error('act one/two message must be 50 bytes');
		}
		const version = message.readUInt8(0);
		if (version !== 0) {
			throw new Error('unsupported version');
		}

		const ephemeralPublicKey = message.slice(1, 34);
		const chachaTag = message.slice(34, 50);

		const peerPublicKey = Point.decodeFrom(secp256k1, ephemeralPublicKey);
		this.hash.update(ephemeralPublicKey);

		const sharedEphemeralSecret = Handshake.ecdh({
			privateKey: localPrivateKey,
			publicKey: peerPublicKey
		});

		const derivative = HKDF.derive(this.chainingKey, sharedEphemeralSecret);
		this.chainingKey = derivative.slice(0, 32);
		const temporaryKey = derivative.slice(32);
		this.temporaryKeys[actIndex] = temporaryKey;

		Chacha.decrypt(temporaryKey, ChachaNonce.encode(BigInt(0)), this.hash.value, chachaTag);
		this.hash.update(chachaTag);
		return peerPublicKey;
	}

	private static ecdh({privateKey, publicKey}: { privateKey: Bigi, publicKey: Point }) {
		const ephemeralSecretPreimage = publicKey.multiply(privateKey);
		const sharedSecret = crypto.createHash('sha256').update(ephemeralSecretPreimage.getEncoded(true)).digest();
		debug('Shared secret: %s', sharedSecret.toString('hex'));
		return sharedSecret;
	}

}

export class HandshakeHash {

	private currentHash: Buffer;

	constructor(firstInput: Buffer | string) {
		this.currentHash = Buffer.alloc(0);
		this.update(firstInput);
	}

	get value(): Buffer {
		return this.currentHash;
	}

	public update(value: Buffer | string): Buffer {
		this.currentHash = crypto.createHash('sha256').update(this.currentHash).update(value).digest();
		return this.currentHash;
	}
}
