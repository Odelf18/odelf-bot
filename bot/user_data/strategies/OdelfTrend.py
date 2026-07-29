# pragma pylint: disable=missing-docstring, invalid-name
"""
OdelfTrend — Binance futures long/short strategy for Odelf Bot showcase.

Adapted from community TrendFollowingStrategy (freqtrade-strategies/futures).
5m EMA20 cross + OBV confirmation. Educational / paper-trading only.
"""

from datetime import datetime
from pandas import DataFrame

import talib.abstract as ta
from freqtrade.strategy import IStrategy


class OdelfTrend(IStrategy):
    """EMA20 trend-follow with OBV filter — long and short on futures."""

    INTERFACE_VERSION = 3

    can_short = True
    timeframe = "5m"
    process_only_new_candles = True
    startup_candle_count = 30

    minimal_roi = {
        "0": 0.02,
        "30": 0.01,
        "60": 0.005,
    }

    stoploss = -0.06

    trailing_stop = True
    trailing_stop_positive = 0.01
    trailing_stop_positive_offset = 0.02
    trailing_only_offset_is_reached = True

    use_exit_signal = True
    exit_profit_only = False
    ignore_roi_if_entry_signal = False

    order_types = {
        "entry": "limit",
        "exit": "limit",
        "stoploss": "market",
        "stoploss_on_exchange": False,
    }

    def leverage(
        self,
        pair: str,
        current_time: datetime,
        current_rate: float,
        proposed_leverage: float,
        max_leverage: float,
        entry_tag: str | None,
        side: str,
        **kwargs,
    ) -> float:
        return min(2.0, max_leverage)

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe["obv"] = ta.OBV(dataframe)
        dataframe["ema20"] = ta.EMA(dataframe, timeperiod=20)
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe["close"] > dataframe["ema20"])
                & (dataframe["close"].shift(1) <= dataframe["ema20"].shift(1))
                & (dataframe["obv"] > dataframe["obv"].shift(1))
                & (dataframe["volume"] > 0)
            ),
            ["enter_long", "enter_tag"],
        ] = (1, "ema20_obv_long")

        dataframe.loc[
            (
                (dataframe["close"] < dataframe["ema20"])
                & (dataframe["close"].shift(1) >= dataframe["ema20"].shift(1))
                & (dataframe["obv"] < dataframe["obv"].shift(1))
                & (dataframe["volume"] > 0)
            ),
            ["enter_short", "enter_tag"],
        ] = (1, "ema20_obv_short")

        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe["close"] < dataframe["ema20"])
                & (dataframe["close"].shift(1) >= dataframe["ema20"].shift(1))
                & (dataframe["volume"] > 0)
            ),
            ["exit_long", "exit_tag"],
        ] = (1, "ema20_exit_long")

        dataframe.loc[
            (
                (dataframe["close"] > dataframe["ema20"])
                & (dataframe["close"].shift(1) <= dataframe["ema20"].shift(1))
                & (dataframe["volume"] > 0)
            ),
            ["exit_short", "exit_tag"],
        ] = (1, "ema20_exit_short")

        return dataframe
