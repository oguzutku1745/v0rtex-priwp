"use client";

import "@covalenthq/goldrush-kit/styles.css";
import {
    GoldRushProvider,
    NFTWalletTokenListView,
    TokenBalancesListView,
    TokenTransfersListView,
    AddressActivityListView,
} from "@covalenthq/goldrush-kit";

export default function GoldRushExample() {
    return (
        <main className="">
            <GoldRushProvider
                apikey={"cqt_rQj4bKGKhvYGpCPxp4dTmhrYp9Ck"}
                mode="dark"
                color="emerald"
            ></GoldRushProvider>
        </main>
    );
}
