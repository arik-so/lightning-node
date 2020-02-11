/**
 * This allows external sources to submit events to the monitor
 */
export default class Listener {

	/**
	 * To be called when a new block gets mined alongside its block and parent hash so the monitor can correctly handle reorgs
	 * @param height
	 * @param hash
	 * @param parent_hash
	 */
	public static new_block(height: number, hash: string, parent_hash: string) {

	}

	/**
	 * To be called when a new (relevant) transaction enters the mempool
	 * @param hex The full transaction hex
	 * @param prevOutTxHexMap A map of the transaction's inputs' txids' full hex values
	 */
	public static new_transaction(hex: string, prevOutTxHexMap?: { [hex: string]: string }) {

	}

	/**
	 * To be called when a transaction gets confirmed, alongside the block's hash so reorgs can adjust confirmation details accordingly
	 * @param txid
	 * @param block_hash
	 */
	public static transaction_confirmed(txid: string, block_hash: string) {

	}

}
