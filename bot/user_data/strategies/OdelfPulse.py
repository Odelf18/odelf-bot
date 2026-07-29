# pragma pylint: disable=missing-docstring, invalid-name
"""
OdelfPulse — fallback strategy if OdelfTrend is too quiet.

Based on official SampleStrategy (RSI + TEMA + Bollinger) with can_short enabled.
Educational / paper-trading only.
"""

from datetime import datetime
from pandas import DataFrame

import talib.abstract as ta
from technical import qtpylib
from freqtrade.strategy import IStrategy, IntParameter


class OdelfPulse(IStrategy):
    """RSI mean-reversion with Bollinger/TEMA guards — long and short."""

    INTERFACE_VERSION = 3

    can_short = True
    timeframe = "5m"
    process_only_new_candles = True
    startup_candle_count = 200

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

    buy_rsi = IntParameter(20, 40, default=35, space="buy", optimize=False)
    sell_rsi = IntParameter(60, 80, default=65, space="sell", optimize=False)
    short_rsi = IntParameter(60, 80, default=65, space="sell", optimize=False)
    exit_short_rsi = IntParameter(20, 40, default=35, space="exit", optimize=False)

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
        dataframe["rsi"] = ta.RSI(dataframe)
        dataframe["tema"] = ta.TEMA(dataframe, timeperiod=9)
        bollinger = qtpylib.bollinger_bands(
            qtpylib.typical_price(dataframe), window=20, stds=2
        )
        dataframe["bb_middleband"] = bollinger["mid"]
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (qtpylib.crossed_above(dataframe["rsi"], self.buy_rsi.value))
                & (dataframe["tema"] <= dataframe["bb_middleband"])
                & (dataframe["tema"] > dataframe["tema"].shift(1))
                & (dataframe["volume"] > 0)
            ),
            ["enter_long", "enter_tag"],
        ] = (1, "rsi_long")

        dataframe.loc[
            (
                (qtpylib.crossed_below(dataframe["rsi"], self.short_rsi.value))
                & (dataframe["tema"] >= dataframe["bb_middleband"])
                & (dataframe["tema"] < dataframe["tema"].shift(1))
                & (dataframe["volume"] > 0)
            ),
            ["enter_short", "enter_tag"],
        ] = (1, "rsi_short")

        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (qtpylib.crossed_above(dataframe["rsi"], self.sell_rsi.value))
                & (dataframe["volume"] > 0)
            ),
            ["exit_long", "exit_tag"],
        ] = (1, "rsi_exit_long")

        dataframe.loc[
            (
                (qtpylib.crossed_below(dataframe["rsi"], self.exit_short_rsi.value))
                & (dataframe["volume"] > 0)
            ),
            ["exit_short", "exit_tag"],
        ] = (1, "rsi_exit_short")

        return dataframe
