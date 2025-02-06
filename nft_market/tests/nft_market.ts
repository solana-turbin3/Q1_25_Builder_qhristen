import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NftMarket } from "../target/types/nft_market"; // Adjust the path to your IDL
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { expect } from "chai";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

describe("nft_market", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NftMarket as Program<NftMarket>;

  const admin = Keypair.generate();
  const marketplaceName = "TestMarketplace";
  const fee = 500; // 5% fee

  let marketplace: PublicKey;
  let rewardsMint: PublicKey;
  let treasury: PublicKey;

  let collectionMint = PublicKey
  let maker = Keypair.generate();
  let taker = Keypair.generate();
  let makerMint: PublicKey;
  let makerAta: PublicKey;
  let takerAta: PublicKey;

  let listing: PublicKey;
  let vault: PublicKey;


  const confirm = async (signature: string): Promise<string> => {
    const block = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature,
      ...block,
    });
    return signature;
  };

  const log = async (signature: string): Promise<string> => {
    console.log(
      `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${provider.connection.rpcEndpoint}`
    );
    return signature;
  };



  before(async () => {
    // Airdrop SOL to admin, maker, and taker
    const airdropAmount = 2e9; // 2 SOL

    // Airdrop to admin (payer)
    await provider.connection
      .requestAirdrop(admin.publicKey, airdropAmount)
      .then(async (signature: string) => {
        const latestBlockhash = await anchor
          .getProvider()
          .connection.getLatestBlockhash();
        await anchor.getProvider().connection.confirmTransaction(
          {
            signature,
            ...latestBlockhash,
          },
          "confirmed"
        );
        return signature;
      });

    await provider.connection
      .requestAirdrop(maker.publicKey, airdropAmount)
      .then(async (signature: string) => {
        const latestBlockhash = await anchor
          .getProvider()
          .connection.getLatestBlockhash();
        await anchor.getProvider().connection.confirmTransaction(
          {
            signature,
            ...latestBlockhash,
          },
          "confirmed"
        );
        return signature;
      });

    await provider.connection
      .requestAirdrop(taker.publicKey, airdropAmount)
      .then(async (signature: string) => {
        const latestBlockhash = await anchor
          .getProvider()
          .connection.getLatestBlockhash();
        await anchor.getProvider().connection.confirmTransaction(
          {
            signature,
            ...latestBlockhash,
          },
          "confirmed"
        );
        return signature;
      });

    // Initialize the marketplace
    [marketplace] = PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace"), Buffer.from(marketplaceName)],
      program.programId
    );

    [rewardsMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("rewards"), marketplace.toBytes()],
      program.programId
    );

    [treasury] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), marketplace.toBytes()],
      program.programId
    );

    await program.methods
      .initialize(marketplaceName, fee)
      .accountsPartial({
        admin: admin.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([admin])
      .rpc()
      .then(confirm)
      .then(log);



    // Create a test NFT mint
    makerMint = await createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      0, // Decimals for NFTs are 0
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    // Create associated token accounts for the maker and taker
    makerAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      admin,
      makerMint,
      maker.publicKey
    ).then((acc) => acc.address);

    // takerAta = await getOrCreateAssociatedTokenAccount(
    //   provider.connection,
    //   admin,
    //   makerMint,
    //   taker.publicKey
    // ).then((acc) => acc.address);

    // Mint 1 NFT to the maker's ATA
    await mintTo(
      provider.connection,
      admin,
      makerMint,
      makerAta,
      admin,
      1 // Mint 1 NFT
    );
  });

  it("should list an NFT", async () => {
    const price = new anchor.BN(200000000); // 0.2 SOL

    [listing] = PublicKey.findProgramAddressSync(
      [marketplace.toBuffer(), makerMint.toBuffer()],
      program.programId
    );

    [vault] = PublicKey.findProgramAddressSync(
      [listing.toBuffer(), makerMint.toBuffer()],
      program.programId
    );

    await program.methods
      .list(price)
      .accountsPartial({
        maker: maker.publicKey,
        makerMint,
        collectionMint: makerMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);

    const listingAccount = await program.account.listing.fetch(listing);
    expect(listingAccount.maker.equals(maker.publicKey)).to.be.true;
    expect(listingAccount.nftMint.equals(makerMint)).to.be.true;
    expect(listingAccount.price.eq(price)).to.be.true;
  });

  it("should purchase an NFT", async () => {

    await program.methods
      .purchase()
      .accounts({
        maker: maker.publicKey,
        makerMint,
        taker: taker.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([taker])
      .rpc()
      .then(confirm)
      .then(log);

    const listingAccount = await program.account.listing.fetchNullable(listing);
    expect(listingAccount).to.be.null;

    const takerBalance = await provider.connection.getTokenAccountBalance(
      takerAta
    );
    expect(takerBalance.value.amount).to.equal("1");
  });


  it("should delist an NFT", async () => {
    await program.methods
      .delist()
      .accountsPartial({
        maker: maker.publicKey,
        makerMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();

    const listingAccount = await program.account.listing.fetchNullable(listing);
    expect(listingAccount).to.be.null;
  });

});
