import { Connection, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';

interface Props {
    connection: Connection;
    payer: PublicKey;
    instructions: TransactionInstruction[];
}

export async function buildV0Transaction({ connection, payer, instructions }: Props): Promise<VersionedTransaction> {
    const { blockhash } = await connection.getLatestBlockhash();
    const message = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: blockhash,
        instructions,
    }).compileToV0Message();
    const transaction = new VersionedTransaction(message);

    return transaction;
}
