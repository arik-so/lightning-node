import * as crypto from 'crypto';

export default class MerkleTree {
	private left: MerkleTree | MerkleNode;
	private right: MerkleTree | MerkleNode;

	constructor(left: MerkleTree | MerkleNode, right: MerkleTree | MerkleNode) {
		this.left = left;
		this.right = right;
	}

	get hash(): Buffer {
		const leftHash = this.left.hash;
		const rightHash = this.right.hash;
		const firstHash = crypto.createHash('sha256').update(leftHash).update(rightHash).digest();
		return crypto.createHash('sha256').update(firstHash).digest();
	}
}

export class MerkleNode {
	private value: Buffer;
	private isHash: boolean;

	constructor(value: Buffer, isHash: boolean) {
		this.value = value;
		this.isHash = isHash;
	}

	get hash(): Buffer {
		if (this.isHash) {
			return this.value;
		}
		return crypto.createHash('sha256').update(this.value).digest();
	}
}
