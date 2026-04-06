#!/usr/bin/env python3
"""
Strategy 001 — BTCUSDT Funding Rate Z-Score Contrarian
Paper Trade Bot (Binance TESTNET)
======================================================
Fetches daily BTC funding rate from Cybotrade, computes a rolling z-score,
and places market orders on Binance Futures TESTNET when the z-score crosses
the threshold in the contrarian direction.

Deploy:  cron — runs once at 00:01 UTC (08:01 SGT) daily, then exits.
         Cron line (VPS1):
         1 0 * * * /home/username/funding_rate/.venv/bin/python /home/username/quant/CQA/Models/FundingRate/bot_001_btcusdt_fr_zscore.py >> /home/username/quant/CQA/Models/FundingRate/cron_001.log 2>&1

Parameters are LOCKED from OOS backtest. Do not change without re-running
the full research pipeline (funding_rate_strategy.py Modules 6–14).
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

sys.path.insert(0, str(Path(__file__).resolve().parent))
from utils_fetching import fetch_cybotrade

try:
    from binance.client import Client
    from binance.enums import SIDE_BUY, SIDE_SELL, FUTURE_ORDER_TYPE_MARKET
except ImportError:
    print("❌  python-binance not installed. Run: pip install python-binance")
    sys.exit(1)

# =============================================================================
# ── CONFIG — edit API keys only. Do NOT change strategy parameters. ──────────
# =============================================================================

# Cybotrade API (data source)
CYBOTRADE_API_KEY = "tZMCAKb5Ldr93klm2VuA0NFe0j1jib5IxcZJU19AMrs56efm"

# Binance Futures TESTNET credentials
TESTNET_API_KEY    = "8asjlKjwdlmPVb6WBeVN6IA2MlhcHOMr1YGyK3BisQYQQq7t5bcxy3tRvYw6np7b"
TESTNET_API_SECRET = "KmU15Hhscx4sZhDaLJDEpGVDaRNju6EX5ICJnd5VBF3TxHacTHm0eLrUySw1iTxm"

# Discord webhook for trade alerts (leave empty string "" to disable)
DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1487761049879969893/EKik1j6XevYZ32VHpERwpEd2omiZ-DqBCx9oFk9MIE1JBYGcH2MOBKXVxxYoZesRkleK"

# =============================================================================
# ── STRATEGY PARAMETERS — LOCKED from OOS backtest (2026-04-04) ──────────────
# Do not modify without re-running Modules 6–14 in funding_rate_strategy.py
# =============================================================================

SYMBOL        = "BTCUSDT"
QUANTITY      = 0.01            # BTC per order (TESTNET — adjust for live)
FR_ENDPOINT   = (               # 1d funding rate aggregate (matches backtest data)
    "coinglass|futures/funding-rate/history"
    "?exchange=Binance&symbol=BTCUSDT&interval=1d"
)
FR_START_MS   = int(datetime(2020, 1, 1, tzinfo=pytz.UTC).timestamp() * 1000)

LENGTH        = 60              # rolling z-score window (days)
THRESHOLD     = 1.5             # entry threshold (± σ)
DIRECTION     = "contrarian"    # short when FR high (crowd over-long), long when FR low (crowd over-short)
FEE_PCT       = 0.04            # taker fee % per trade (4 bps)

# =============================================================================
# ── FILE PATHS ────────────────────────────────────────────────────────────────
# =============================================================================

DATA_DIR  = Path(__file__).resolve().parents[2] / "CSV"   # CQA/CSV/
LOG_PATH  = DATA_DIR / "trade_log_001_btcusdt_4h_momentum.csv"

# =============================================================================
# ── BINANCE TESTNET CLIENT ────────────────────────────────────────────────────
# =============================================================================

# Suppress the live-API ping — it is geo-blocked on some VPS locations.
Client.ping = lambda self: {}
client = Client(TESTNET_API_KEY, TESTNET_API_SECRET)
client.FUTURES_URL = "https://testnet.binancefuture.com/fapi"

# =============================================================================
# ── HELPERS ───────────────────────────────────────────────────────────────────
# =============================================================================

def _alert(msg: str) -> None:
    """Print and optionally send to Discord."""
    ts = datetime.now(pytz.UTC).strftime("%Y-%m-%d %H:%M UTC")
    print(f"  [{ts}] {msg}")
    if DISCORD_WEBHOOK:
        try:
            requests.post(DISCORD_WEBHOOK, json={"content": msg}, timeout=5)
        except Exception as exc:
            print(f"  ⚠️  Discord error: {exc}")


def _get_position() -> int:
    """Return 1 (long), -1 (short), or 0 (flat) from Binance TESTNET."""
    pos = client.futures_position_information(symbol=SYMBOL)
    if not pos:
        return 0
    qty = float(pos[0].get("positionAmt", 0))
    return 1 if qty > 0 else (-1 if qty < 0 else 0)


def _open_long() -> None:
    client.futures_create_order(
        symbol=SYMBOL, side=SIDE_BUY,
        type=FUTURE_ORDER_TYPE_MARKET, quantity=QUANTITY,
    )


def _open_short() -> None:
    client.futures_create_order(
        symbol=SYMBOL, side=SIDE_SELL,
        type=FUTURE_ORDER_TYPE_MARKET, quantity=QUANTITY,
    )


def _close_position(current_pos: int) -> None:
    """Close existing position with reduceOnly order."""
    if current_pos == 0:
        return
    info = client.futures_position_information(symbol=SYMBOL)
    qty  = abs(float(info[0]["positionAmt"]))
    side = SIDE_SELL if current_pos > 0 else SIDE_BUY
    client.futures_create_order(
        symbol=SYMBOL, side=side,
        type=FUTURE_ORDER_TYPE_MARKET,
        quantity=qty, reduceOnly=True,
    )


def _log(action: str, signal: int, position: int, zscore: float) -> None:
    """Append one row to the trade log CSV."""
    row = pd.DataFrame([{
        "timestamp": datetime.now(pytz.UTC).isoformat(),
        "action":    action,
        "signal":    signal,
        "position":  position,
        "zscore":    round(zscore, 4),
    }])
    if LOG_PATH.exists():
        existing = pd.read_csv(LOG_PATH)
        pd.concat([existing, row], ignore_index=True).to_csv(LOG_PATH, index=False)
    else:
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        row.to_csv(LOG_PATH, index=False)


def _compute_signal(zscore: float) -> int:
    """Contrarian signal: short when FR z-score high (crowd over-long), long when low (crowd over-short)."""
    if zscore >  THRESHOLD:
        return -1   # SHORT — crowd over-long, fade them
    if zscore < -THRESHOLD:
        return  1   # LONG  — crowd over-short, fade them
    return 0        # FLAT


# =============================================================================
# ── MAIN TRADING LOOP ─────────────────────────────────────────────────────────
# =============================================================================

def main() -> None:
    _alert(
        f"🚀 Strategy 001 paper bot started\n"
        f"   Symbol={SYMBOL}  Length={LENGTH}  Threshold=±{THRESHOLD}  "
        f"Direction={DIRECTION}  Qty={QUANTITY} BTC\n"
        f"   Log: {LOG_PATH}"
    )

    now_str = datetime.now(pytz.UTC).strftime("%Y-%m-%d %H:%M UTC")
    print(f"\n{'='*55}")
    print(f"  Cycle start: {now_str}")

    # ── 1. Fetch daily funding rate ─────────────────────────────
    df = fetch_cybotrade(FR_ENDPOINT, CYBOTRADE_API_KEY, FR_START_MS)
    df["funding_rate"] = pd.to_numeric(df["close"], errors="coerce")
    df = df.sort_values("start_time").reset_index(drop=True)

    # ── 2. Compute rolling z-score ──────────────────────────────
    roll   = df["funding_rate"].rolling(LENGTH)
    df["zscore"] = (df["funding_rate"] - roll.mean()) / roll.std(ddof=1)
    df = df.dropna(subset=["zscore"])

    latest    = df.iloc[-1]
    zscore_v  = float(latest["zscore"])
    fr_v      = float(latest["funding_rate"])

    # ── 3. Determine target signal ──────────────────────────────
    target_signal = _compute_signal(zscore_v)
    current_pos   = _get_position()

    status_msg = (
        f"FR={fr_v:.5f} | zscore={zscore_v:+.3f} | "
        f"signal={target_signal:+d} | position={current_pos:+d}"
    )
    print(f"  {status_msg}")
    _alert(f"📊 Strategy 001 | {status_msg}")

    # ── 4. Reconcile position ───────────────────────────────────
    if target_signal == 1 and current_pos <= 0:
        if current_pos < 0:
            _close_position(current_pos)
        _open_long()
        _alert(f"✅ OPEN LONG  | {SYMBOL} | qty={QUANTITY}")
        _log("OPEN_LONG", target_signal, current_pos, zscore_v)

    elif target_signal == -1 and current_pos >= 0:
        if current_pos > 0:
            _close_position(current_pos)
        _open_short()
        _alert(f"✅ OPEN SHORT | {SYMBOL} | qty={QUANTITY}")
        _log("OPEN_SHORT", target_signal, current_pos, zscore_v)

    elif target_signal == 0 and current_pos != 0:
        _close_position(current_pos)
        _alert(f"✅ CLOSE      | {SYMBOL}")
        _log("CLOSE", target_signal, current_pos, zscore_v)

    else:
        _log("HOLD", target_signal, current_pos, zscore_v)

    print(f"  Log saved to: {LOG_PATH}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        _alert(f"⚠️  Fatal error: {exc}. Check cron_001.log.")
        raise
