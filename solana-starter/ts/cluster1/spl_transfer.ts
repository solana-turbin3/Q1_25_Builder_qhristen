import {
  Commitment,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import wallet from "../turbin3-wallet.json";
import {
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  transfer,
} from "@solana/spl-token";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("8yzrqZ558Tn5JiLKKMaS2r2k9eimd6jTwCGRpNkMmYsK");

// Recipient address
const to = new PublicKey("J11HpJqimkHFGvdQqph9c4iQ4wTV8SE9tGEAewxgSEXa");

(async () => {
  try {
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );
    console.log(`Your ata is: ${ata.address.toBase58()}`);

    // Get the token account of the toWallet address, and if it does not exist, create it
    const toAta = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      to // Recipient's PublicKey
    );
    console.log(`Your RecipientATA: ${toAta.address.toBase58()}`);

    // Transfer the new token to the "toTokenAccount" we just created
    // Transfer amount (e.g., 10 tokens; adjust decimals based on the token mint)
    const amount = 10 * 10 ** 6; // Assuming the token has 6 decimals

    // Create transaction
    const transaction = new Transaction().add(
      createTransferInstruction(
        ata.address,
        toAta.address,
        keypair.publicKey,
        amount
      )
    );

    // Sign and send the transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      keypair,
    ]);
    console.log("Transaction Signature:", signature);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
