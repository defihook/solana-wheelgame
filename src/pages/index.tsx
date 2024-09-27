/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { QuotLeft, QuotRight, SolSvgIcon } from "../components/svgIcons";
import Skeleton from "@mui/material/Skeleton";
import { useWallet } from "@solana/wallet-adapter-react";
import Confetti from "react-confetti";
import HistoryItem from "../components/HistoryItem";
import { getSolbalance } from "../contexts/utils";
import PageLoading, { MiniLoading } from "../components/PageLoading";
import Header from "../components/Header";
import {
  claim,
  getAllTransactions,
  getBankBalance,
  getUserPoolState,
  playGame,
} from "../contexts/transactions";
import { errorAlert } from "../components/toastGroup";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { HistoryItem as HistoryItemType, PROGRAM_ID } from "../contexts/type";
import ProgressBar from "../components/ProgressBar";
import LoadingText from "../components/LoadingText";
import Footer from "../components/Footer";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import CoinFlipping from "../components/CoinFlipping";
import Coin from "../components/Coin";

const Home: NextPage = () => {
  const wallet = useWallet();
  const [isBet, setIsBet] = useState(true);
  const [amount, setAmount] = useState(0.05);
  const [userLoading, setUserLoading] = useState(false);
  const [solBalance, setSolBanace] = useState(0);
  const [betLoading, setBetLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  const [isDepositing, setIsDepositing] = useState(false);
  const [isFliping, setIsFliping] = useState(false);
  const [isEnd, setIsEnd] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [setValue, setSetValue] = useState(0.05);
  const [userFunds, setUserFunds] = useState(0);
  const [txLoading, setTxLoading] = useState(false);
  const [isStartFlipping, setIsStartFlipping] = useState(false);

  const [isInc, setIsInc] = useState(false);
  const [isDec, setIsDec] = useState(false);

  const [isProgress, setIsProgress] = useState(false);

  const [txHistory, setTxHistory] = useState<HistoryItemType[]>([]);

  const getGlobalData = async () => {
    setIsDec(false);
    setUserLoading(true);
    if (wallet.publicKey !== null) {
      const balance = await getSolbalance(wallet.publicKey);
      const funds = await getUserPoolState(wallet);
      const bankBalance = await getBankBalance();
      console.log("Bank Balance: ", bankBalance / LAMPORTS_PER_SOL);
      if (funds) {
        setUserFunds(funds.claimableReward.toNumber() / LAMPORTS_PER_SOL);
      }
      setSolBanace(balance);
    }
    setUserLoading(false);
  };

  const getAllTxs = async () => {
    setTxLoading(true);
    const bankBalance = await getBankBalance();
    console.log("Bank Balance: ", bankBalance / LAMPORTS_PER_SOL);
    if (wallet.publicKey !== null) {
      const allTx = await getAllTransactions(new PublicKey(PROGRAM_ID));
      setTxHistory(allTx);
    }
    setTxLoading(false);
  };

  const updatePage = () => {
    getGlobalData();
    getAllTxs();
  };

  const getDataByInterval = async () => {
    // setInterval(async () => {
    //   if (wallet.publicKey === null) return;
    //   const balance = await getSolbalance(wallet.publicKey);
    //   const allTx = await getAllTransactions(new PublicKey(PROGRAM_ID));
    //   const funds = await getUserPoolState(wallet);
    //   if (funds) {
    //     setUserFunds(funds.claimableReward.toNumber() / LAMPORTS_PER_SOL);
    //   }
    //   setTxHistory(allTx);
    //   setSolBanace(balance);
    // }, 5000);
  };

  const handlePlayAgain = () => {
    setIsEnd(false);
    setIsWon(false);
    setIsProgress(false);
    setIsDec(false);
    setIsStartFlipping(false);
  };

  const handlePlay = async () => {
    if (wallet.publicKey === null) {
      errorAlert("Please connect wallet!");
      return;
    }
    if (amount + 0.002 > solBalance) {
      errorAlert("You don't have enough balance to play!");
      return;
    }

    if (amount + 0.002 > (await getSolbalance(wallet.publicKey))) {
      errorAlert("You don't have enough balance to play!");
      return;
    }

    try {
      const result = await playGame(
        wallet,
        isBet ? 1 : 0,
        amount,
        (e: boolean) => setBetLoading(e),
        (e: boolean) => setIsDepositing(e),
        (e: boolean) => setIsFliping(e),
        (e: boolean) => setIsEnd(e),
        (e: boolean) => setIsProgress(e),
        (e: boolean) => setIsDec(e),
        (e: boolean) => setIsInc(e),
        (e: boolean) => setIsWon(e),
        (e: boolean) => setIsStartFlipping(e),
        () => getAllTxs()
      );

      console.log("playGame result:", result);

      if (result && result.gameData.rewardAmount.toNumber() !== 0) {
        setSetValue(result.gameData.amount.toNumber() / LAMPORTS_PER_SOL);
      }
    } catch (error) {
      setIsEnd(false);
      setIsWon(false);
      console.log(error);
    }
  };

  const [forceRender, serForceRender] = useState(false);
  const decWalletBalance = (value: number) => {
    let balance = solBalance;
    setSolBanace(balance - value);
    serForceRender(!forceRender);
  };

  const incFundsBalance = (value: number) => {
    let balance = userFunds;
    setUserFunds(balance + value);
    serForceRender(!forceRender);
  };

  useEffect(() => {
    if (isDec) {
      decWalletBalance(amount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDec]);

  useEffect(() => {
    if (isWon) {
      setTimeout(() => {
        incFundsBalance(amount * 2);
      }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWon, isInc]);

  const handleClaim = async () => {
    if (wallet.publicKey === null) {
      errorAlert("Please connect wallet!");
      return;
    }
    if (userFunds === 0) {
      errorAlert("No funds available for withdrawal!");
      return;
    }
    try {
      await claim(
        wallet,
        () => setClaimLoading(true),
        () => setClaimLoading(false),
        () => updatePage()
      );
      setIsEnd(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getGlobalData();
    getAllTxs();
    getDataByInterval();
    // eslint-disable-next-line
  }, [wallet.connected, wallet.publicKey]);
  return (
    <div className="main-page">
      <Header
        balance={solBalance}
        wallet={wallet}
        userFunds={userFunds}
        handleClaim={handleClaim}
        isClaiming={claimLoading}
        userLoading={userLoading}
      />
      <main>
        {wallet.publicKey && (
          <div className="player-funds one-fund">
            <SolSvgIcon />
            <p>
              {userLoading ? "--" : solBalance.toLocaleString()}
              <span>SOL</span>
            </p>
          </div>
        )}
        {isEnd && (
          <div className="win-effect">
            {isWon && <Confetti width={2000} height={2000} />}
          </div>
        )}
        <div className="container">
          <div className="main-content"></div>
        </div>
      </main>
      <Footer />
      {/* <PageLoading loading={userLoading && !isProgress} /> */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/smoke-1.png" className="smoke smoke-1" alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/smoke-2.png" className="smoke smoke-2" alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/smoke-3.png" className="smoke smoke-3" alt="" />
    </div>
  );
};

export default Home;
