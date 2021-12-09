import MerkleTree, {MerkleNode} from '../src/chain/merkle.js';
import * as crypto from 'crypto';
import {default as chai} from 'chai';

const assert = chai.assert;

describe('Merkle Tree Tests', () => {

	it('should test Merkle root calculation', () => {

		const blockDetails = {
			'hash': '1e871187ba510207d88f1bb0aa1895fb2420066277fdbba7c857b339810dfcec',
			'confirmations': 1,
			'size': 553,
			'height': 132,
			'version': 536870912,
			'merkleroot': '25c8487847de572c21bff029a95d9a9fecd9f4c2736984b979d37258cd47bd1f',
			'tx': [
				'3bd3a1309a518c381248fdc26c3a6bd62c35db7705069f59206684308cc237b3',
				'a99011a19e9894753d6c65c8fa412838ea8042886537588e7205734d5de8956d'
			],
			'time': 1553088284,
			'mediantime': 1553087229,
			'nonce': 3,
			'bits': '207fffff',
			'difficulty': 4.656542373906925e-10,
			'chainwork': '000000000000000000000000000000000000000000000000000000000000010a',
			'previousblockhash': '78c3c76fe213ca9f5a0f616b155341eb12b963ce10107b18c9ff612cfc90843d'
		};

		const root = new MerkleTree(
			new MerkleNode(Buffer.from('b337c28c30846620599f060577db352cd66b3a6cc2fd4812388c519a30a1d33b', 'hex'), true),
			new MerkleNode(Buffer.from('6d95e85d4d7305728e583765884280ea382841fac8656c3d7594989ea11190a9', 'hex'), true)
		);
		const hash = root.hash.reverse();

		assert.equal(hash.toString('hex'), blockDetails.merkleroot);

		const versionBuffer = Buffer.alloc(4);
		const timeBuffer = Buffer.alloc(4);
		const nonceBuffer = Buffer.alloc(4);

		versionBuffer.writeUInt32LE(blockDetails.version, 0);
		timeBuffer.writeUInt32LE(blockDetails.time, 0);
		nonceBuffer.writeUInt32LE(blockDetails.nonce, 0);

		const blockHeaderComponents = [
			versionBuffer,
			Buffer.from(blockDetails.previousblockhash, 'hex').reverse(),
			Buffer.from(blockDetails.merkleroot, 'hex').reverse(),
			timeBuffer,
			Buffer.from(blockDetails.bits, 'hex').reverse(),
			nonceBuffer
		];

		const firstHashObject = crypto.createHash('sha256');
		for (const currentBuffer of blockHeaderComponents) {
			console.log('component:', currentBuffer.toString('hex'));
			firstHashObject.update(currentBuffer);
		}
		// temporary
		// firstHashObject.update(Buffer.from('0000002066720b99e07d284bd4fe67ff8c49a5db1dd8514fcdab610000000000000000007829844f4c3a41a537b3131ca992643eaa9d093b2383e4cdc060ad7dc548118751eb505ac1910018de19b302', 'hex'));

		const firstHash = firstHashObject.digest();
		const blockHash = crypto.createHash('sha256').update(firstHash).digest().reverse();
		console.log(firstHash.toString('hex'));
		console.log(blockHash.toString('hex'));
		// console.log(blockHash.reverse().toString('hex'));
		console.log('actual:', blockDetails.hash);
		console.log('actual reverse:', Buffer.from(blockDetails.hash, 'hex').reverse().toString('hex'));
		assert.equal(blockHash.toString('hex'), blockDetails.hash);
	});

});
