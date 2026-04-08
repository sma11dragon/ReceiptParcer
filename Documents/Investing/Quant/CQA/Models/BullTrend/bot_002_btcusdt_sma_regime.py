#!/usr/bin/env python3
"""
Strategy 002 — BTCUSDT SMA Crossover + 200d MA Regime Filter
Paper Trade Bot (Binance TESTNET)
======================================================
Fetches the last 210 daily BTC/USDT closes from Binance,
computes SMA(10), SMA(100), and SMA(200), then places a
LONG market order when the crossover + regime conditions
are met, and closes the position when they are not.

Signal:  LONG  when SMA(10) > SMA(100) AND close > SMA(200)
         FLAT  otherwise  (no shorting)

Deploy:  cron — runs once at 00:01 UTC (08:01 SGT) daily, then exits.
         Cron line (VPS1):
         1 0 * * * /home/username/funding_rate/.venv/bin/python /home/username/quant/CQA/Models/BullTrend/bot_002_btcusdt_sma_regime.py >> /home/username/quant/CQA/Models/BullTrend/cron_002.log 2>&1

Parameters are LOCKED from OOS backtest (Module 01–03).
Do not change without re-running the research pipeline.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import sys
import pytz
import requests
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime

try:
    from binance.client import Client
    from binance.enums import SIDE_BUY, SIDE_SELL, FUTURE_ORDER_TYPE_MARKET
except ImportError:
    print("❌  python-binance not installed. Run: pip install python-binance")
    sys.exit(1)

# =============================================================================
# ── CONFIG — edit API keys only. Do NOT change strategy parameters. ──────────
# =============================================================================

# Binance Futures TESTNET credentials (same account as Strategy 001)
TESTNET_API_KEY    = "8asjlKjwdlmPVb6WBeVN6IA2MlhcHOMr1YGyK3BisQYQQq7t5bcxy3tRvYw6np7b"
TESTNET_API_SECRET = "KmU15Hhscx4sZhDaLJDEpGVDaRNju6EX5ICJnd5VBF3TxHacTHm0eLrUySw1iTxm"

# Discord webhook for trade alerts (leave empty string "" to disable)
DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1487761049879969893/EKik1j6XevYZ32VHpERwpEd2omiZ-DqBCx9oFk9MIE1JBYGcH2MOBKXVxxYoZesRkleK"

# =============================================================================
# ── STRATEGY PARAMETERS — LOCKED from OOS backtest (2026-04-05) ──────────────
# Do not modify without re-running Modules 01–03 in CQA/Models/BullTrend/
# =============================================================================

SYMBOL    = "BTCUSDT"
QUANTITY  = 0.01            # BTC per order (TESTNET — adjust for live)

SHORT_W   = 10              # SMA short window (days)
LONG_W    = 100             # SMA long window (days)
REGIME_W  = 200             # Regime filter: 200d MA (fixed — not optimised)
BARS      = REGIME_W + 10   # Bars to fetch — enough to warm up all three MAs

FEE_PCT   = 0.06            # taker fee % per trade (6 bps)

# =============================================================================
# ── FILE PATHS ────────────────────────────────────────────────────────────────
# =============================================================================

DATA_DIR  = Path(__file__).resolve().parents[2] / "CSV"   # CQA/CSV/
LOG_PATH  = DATA_DIR / "trade_log_002_btcusdt_1d_sma_regime.csv"

# =============================================================================
# ── BINANCE TESTNET CLIENT ────────────────────────────────────────────────────
# =============================================================================

# Suppress the live-API ping — geo-blocked on some VPS locations.
Client.ping = lambda self: {}
client = Client(TESTNET_API_KEY, TESTNET_API_SECRET)
client.FUTURES_URL = "https://testnet.binancefuture.com/fapi"

# =============================================================================
# ── HELPERS ───────────────────────────────────────────────────────────────────
# =============================================================================

def _alert(msg: str) -> None:
    """Print with timestamp and optionally send to Discord."""
    ts = datetime.now(pytz.UTC).strftime("%Y-%m-%d %H:%M UTC")
    print(f"  [{ts}] {msg}")
    if DISCORD_WEBHOOK:
        try:
            requests.post(DISCORD_WEBHOOK, json={"content": msg}, timeout=5)
        except Exception as exc:
            print(f"  ⚠️  Discord error: {exc}")


def _fetch_daily_klines() -> pd.DataFrame:
    """
    Fetch the last BARS daily closes from Binance LIVE public endpoint.
    Does NOT use the TESTNET client — market data is always from live Binance.
    """
    resp = requests.get(
        "https://data-api.binance.vision/api/v3/klines",
        params={"symbol": SYMBOL, "interval": "1d", "limit": BARS},
        timeout=10,
    )
    resp.raise_for_status()
    raw = resp.json()
    df = pd.DataFrame(raw, columns=[
        "open_time", "open", "high", "low", "close", "volume",
        "close_time", "quote_vol", "trades",
        "taker_buy_vol", "taker_buy_quote_vol", "ignore",
    ])
    df["close"]     = pd.to_numeric(df["close"])
    df["open_time"] = pd.to_datetime(df["open_time"], unit="ms", utc=True)
    return df.sort_values("open_time").reset_index(drop=True)


def _compute_signal(df: pd.DataFrame) -> tuple:
    """
    Compute SMA crossover + 200d MA regime filter on the provided DataFrame.
    Returns (signal, close, sma_short, sma_long, sma_regime).
    signal = 1 (LONG) if SMA(10) > SMA(100) AND close > SMA(200), else 0 (FLAT).
    """
    df = df.copy()
    df["sma_short"]  = df["close"].rolling(SHORT_W).mean()
    df["sma_long"]   = df["close"].rolling(LONG_W).mean()
    df["sma_regime"] = df["close"].rolling(REGIME_W).mean()

    row = df.iloc[-1]
    close      = float(row["close"])
    sma_short  = float(row["sma_short"])
    sma_long   = float(row["sma_long"])
    sma_regime = float(row["sma_regime"])

    if any(np.isnan(v) for v in [sma_short, sma_long, sma_regime]):
        return 0, close, sma_short, sma_long, sma_regime

    signal = 1 if (sma_short > sma_long and close > sma_regime) else 0
    return signal, close, sma_short, sma_long, sma_regime


def _get_position() -> int:
    """Return 1 (long), -1 (short), or 0 (flat) from Binance TESTNET."""
    pos = client.futures_position_information(symbol=SYMBOL)
    if not pos:
        return 0
    qty = float(pos[0].get("positionAmt", 0))
    return 1 if qty > 0 else (-1 if qty < 0 else 0)


def _open_long() -> None:
    client.futures_create_order(
        symbol=SYMBOL,
        side=SIDE_BUY,
        type=FUTURE_ORDER_TYPE_MARKET,
        quantity=QUANTITY,
    )


def _close_position() -> None:
    """Close any open position (long or short) with a reduceOnly order."""
    info = client.futures_position_information(symbol=SYMBOL)
    qty  = float(info[0]["positionAmt"])
    if qty == 0:
        return
    # SIDE_SELL closes a long; SIDE_BUY closes a short (buy-to-cover)
    side = SIDE_SELL if qty > 0 else SIDE_BUY
    client.futures_create_order(
        symbol=SYMBOL,
        side=side,
        type=FUTURE_ORDER_TYPE_MARKET,
        quantity=abs(qty),
        reduceOnly=True,
    )


def _log(action: str, signal: int, position: int,
         close: float, sma_short: float,
         sma_long: float, sma_regime: float) -> None:
    """Append one row to the trade log CSV."""
    regime_active = 1 if (sma_short > sma_long and close > sma_regime) else 0
    row = pd.DataFrame([{
        "timestamp"    : datetime.now(pytz.UTC).isoformat(),
        "action"       : action,
        "signal"       : signal,
        "position"     : position,
        "close"        : round(close, 2),
        "sma_short"    : round(sma_short, 2),
        "sma_long"     : round(sma_long, 2),
        "sma_regime"   : round(sma_regime, 2),
        "regime_active": regime_active,
    }])
    if LOG_PATH.exists():
        existing = pd.read_csv(LOG_PATH)
        pd.concat([existing, row], ignore_index=True).to_csv(LOG_PATH, index=False)
    else:
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        row.to_csv(LOG_PATH, index=False)


# =============================================================================
# ── MAIN TRADING LOOP ─────────────────────────────────────────────────────────
# =============================================================================

def main() -> None:
    _alert(
        f"🚀 Strategy 002 paper bot started\n"
        f"   Symbol={SYMBOL}  SMA=({SHORT_W}/{LONG_W})  "
        f"Regime={REGIME_W}d MA  Qty={QUANTITY} BTC\n"
        f"   Signal: LONG when SMA{SHORT_W}>SMA{LONG_W} AND close>SMA{REGIME_W}\n"
        f"   Log: {LOG_PATH}"
    )

    now_str = datetime.now(pytz.UTC).strftime("%Y-%m-%d %H:%M UTC")
    print(f"\n{'='*60}")
    print(f"  Cycle start: {now_str}")

    # ── 1. Fetch latest daily klines ────────────────────────────
    df = _fetch_daily_klines()
    print(f"  Fetched {len(df)} daily bars  "
          f"(latest close: {df.iloc[-1]['open_time'].date()})")

    # ── 2. Compute signal ────────────────────────────────────────
    signal, close, ss, sl, sr = _compute_signal(df)
    current_pos = _get_position()

    crossover_ok = ss > sl
    regime_ok    = close > sr

    status_msg = (
        f"close={close:,.0f}  "
        f"SMA{SHORT_W}={ss:,.0f}  SMA{LONG_W}={sl:,.0f}  SMA{REGIME_W}={sr:,.0f}  |  "
        f"crossover={'✅' if crossover_ok else '❌'}  "
        f"regime={'✅' if regime_ok else '❌'}  |  "
        f"signal={signal}  position={current_pos}"
    )
    print(f"  {status_msg}")
    _alert(f"📊 Strategy 002 | {status_msg}")

    # ── 3. Reconcile position ────────────────────────────────────
    if signal == 1 and current_pos == 0:
        _open_long()
        _alert(f"✅ OPEN LONG  | {SYMBOL} | qty={QUANTITY}")
        _log("OPEN_LONG", signal, current_pos, close, ss, sl, sr)

    elif signal == 0 and current_pos == 1:
        _close_position()
        _alert(f"✅ CLOSE LONG | {SYMBOL}")
        _log("CLOSE", signal, current_pos, close, ss, sl, sr)

    elif current_pos == -1:
        # Unexpected short position (e.g. manual override or account conflict).
        # This strategy is long-only — close the short immediately and alert.
        _close_position()
        _alert(f"⚠️ UNEXPECTED SHORT closed | {SYMBOL} | signal={signal}")
        _log("CLOSE_SHORT_UNEXPECTED", signal, current_pos, close, ss, sl, sr)
        if signal == 1:
            _open_long()
            _alert(f"✅ OPEN LONG after closing unexpected short | {SYMBOL} | qty={QUANTITY}")
            _log("OPEN_LONG", signal, 0, close, ss, sl, sr)

    else:
        _log("HOLD", signal, current_pos, close, ss, sl, sr)

    print(f"  Log saved to: {LOG_PATH}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        _alert(f"⚠️  Fatal error: {exc}. Check cron_002.log.")
        raise
