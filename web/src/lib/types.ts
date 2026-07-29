export type OpenTrade = {
  trade_id: number;
  pair: string;
  is_short: boolean;
  leverage: number;
  amount?: number;
  stake_amount?: number;
  open_rate: number;
  current_rate?: number;
  profit_pct?: number;
  profit_abs?: number;
  open_timestamp?: number;
  enter_tag?: string;
};

export type ClosedTrade = {
  trade_id: number;
  pair: string;
  is_short: boolean;
  leverage: number;
  amount?: number;
  stake_amount?: number;
  open_rate: number;
  close_rate?: number;
  profit_pct?: number;
  profit_abs?: number;
  open_timestamp?: number;
  close_timestamp?: number;
  enter_tag?: string;
  exit_reason?: string;
};

export type ProfitStats = {
  profit_closed_coin: number;
  profit_closed_percent_mean: number;
  profit_closed_ratio_mean: number;
  profit_all_coin: number;
  profit_all_percent_mean: number;
  profit_all_percent_sum: number;
  trade_count: number;
  closed_trade_count: number;
  winning_trades: number;
  losing_trades: number;
  winrate?: number;
  best_pair?: string;
  best_rate?: number;
  worst_pair?: string;
  worst_rate?: number;
  starting_balance?: number;
  final_balance?: number;
  max_drawdown_account?: number;
  max_drawdown_abs?: number;
  profit_factor?: number;
  expectancy?: number;
  avg_duration?: string;
  trading_volume?: number;
};

export type DailyRow = {
  date: string;
  abs_profit: number;
  rel_profit: number;
  trade_count: number;
};

export type PairPerf = {
  pair: string;
  profit: number;
  profit_pct: number;
  count: number;
  wins: number;
};

export type SideSplit = {
  long_count: number;
  short_count: number;
  long_profit: number;
  short_profit: number;
};

export type SessionMeta = {
  timeframe: string;
  leverage: number;
  max_open_trades: number;
  stake_currency: string;
  trading_mode: string;
  dry_run: boolean;
  exchange: string;
  whitelist: string[];
};

export type BotSnapshot = {
  online: boolean;
  mock: boolean;
  updatedAt: string;
  state?: string;
  strategy?: string;
  profit: ProfitStats;
  openTrades: OpenTrade[];
  closedTrades: ClosedTrade[];
  daily: DailyRow[];
  equityCurve: { t: string; equity: number }[];
  pairPerf: PairPerf[];
  sideSplit: SideSplit;
  session: SessionMeta;
};
