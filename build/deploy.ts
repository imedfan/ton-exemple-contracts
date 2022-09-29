import { beginCell , Address, Cell, CellMessage, CommonMessageInfo, fromNano, InternalMessage, StateInit, toNano } from "ton";
import { TonClient, WalletContract, WalletV3R2Source, contractAddress, SendMode } from "ton";
import fs from "fs";
import { mnemonicToWalletKey } from "ton-crypto";


async function main() {
    function initData() {
        const initialCounterValue = 17;
        return beginCell().storeUint(initialCounterValue, 64).endCell();
    }
    
    
    const initDataCell = initData();
    const initCodeCell = Cell.fromBoc(fs.readFileSync("counter.cell"))[0];
    
    const newContractAddress = contractAddress({workchain: 0, initialData: initDataCell, initialCode: initCodeCell});
    
    
    const mnemonic = " ";
    
    const key = await mnemonicToWalletKey(mnemonic.split(" "));
    
    const client = new TonClient({ endpoint: "https://toncenter.com/api/v2/jsonRPC"});
    const wallet = WalletContract.create(client, WalletV3R2Source.create({ publicKey: key.publicKey, workchain: 0}));
    
    
    async function deploy () {
        const seqno = await wallet.getSeqNo();
    
        const transfer = wallet.createTransfer({
            secretKey: key.secretKey, 
            seqno: seqno,
            sendMode: SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS, 
            order: new InternalMessage({
                to: newContractAddress,
                value: toNano(0.02),
                bounce: false,
                body: new CommonMessageInfo({
                    stateInit: new StateInit({ data: initDataCell, code: initCodeCell}),
                    body: null,
                }),
            }),
        });
    
        await client.sendExternalMessage(wallet, transfer);
    }
}

main();



