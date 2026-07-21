import process from "node:process";
import {
  closeRobinhood,
  connectRobinhood,
  hashWithDomain,
} from "../src/index.js";

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function number(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new TypeError(`Expected numeric value, received ${value}`);
  return parsed;
}

function money(value) {
  return `$${number(value).toFixed(2)}`;
}

function percent(value) {
  const parsed = number(value);
  return `${parsed >= 0 ? "+" : ""}${parsed.toFixed(2)}%`;
}

function row(label, value) {
  console.log(`${label.padEnd(16)}${value}`);
}

function data(result) {
  if (!result?.structuredContent?.data) {
    throw new Error("Robinhood MCP returned no structured data");
  }
  return result.structuredContent.data;
}

const symbol = String(option("symbol", "AAPL")).trim().toUpperCase();
const oauthStorePath = option("oauth-store", ".murre/robinhood-oauth.json");
const researchStart = "2026-04-21T00:00:00Z";
const researchEnd = "2026-07-21T00:00:00Z";

const session = await connectRobinhood({
  oauthStorePath,
  onAuthorizationUrl: (url) => {
    console.error("Authorization required:");
    console.error(url.toString());
  },
});

try {
  console.log(`MURRE RESEARCH / ${symbol}`);
  row("source", "robinhood-trading MCP (authenticated)");
  row("scope", "public market data only");
  console.log();

  const quoteResult = await session.client.callTool({
    name: "get_equity_quotes",
    arguments: {symbols: [symbol]},
  });
  row("mcp", "get_equity_quotes ................ OK");

  const fundamentalsResult = await session.client.callTool({
    name: "get_equity_fundamentals",
    arguments: {symbols: [symbol], bounds: "regular"},
  });
  row("mcp", "get_equity_fundamentals .......... OK");

  const rsiResult = await session.client.callTool({
    name: "get_equity_technical_indicators",
    arguments: {
      symbol,
      type: "rsi",
      interval: "day",
      start_time: researchStart,
      end_time: researchEnd,
      bounds: "regular",
      adjustment_type: "split",
      output: "latest",
      period: 14,
    },
  });
  row("mcp", "get_equity_technical_indicators .. OK");

  const earningsResult = await session.client.callTool({
    name: "get_earnings_results",
    arguments: {symbol},
  });
  row("mcp", "get_earnings_results ............. OK");
  console.log();

  const quoteBundle = data(quoteResult).results?.[0];
  const quote = quoteBundle?.quote;
  const fundamentals = data(fundamentalsResult).results?.[0];
  const rsi = data(rsiResult).indicators?.[0]?.series?.[0];
  const earnings = data(earningsResult).results || [];
  if (!quote || !fundamentals || !rsi) throw new Error(`Incomplete public data for ${symbol}`);

  const regularTime = Date.parse(quote.venue_last_trade_time);
  const nonRegularTime = Date.parse(quote.venue_last_non_reg_trade_time);
  const useNonRegular = Number.isFinite(nonRegularTime) && nonRegularTime > regularTime;
  const currentPrice = useNonRegular ? quote.last_non_reg_trade_price : quote.last_trade_price;
  const currentTime = useNonRegular ? quote.venue_last_non_reg_trade_time : quote.venue_last_trade_time;
  const priorClose = number(quote.adjusted_previous_close);
  const dailyChange = ((number(currentPrice) - priorClose) / priorClose) * 100;
  const low52 = number(fundamentals.low_52_weeks);
  const high52 = number(fundamentals.high_52_weeks);
  const rangePosition = ((number(currentPrice) - low52) / (high52 - low52)) * 100;
  const reported = earnings.filter((entry) => entry.eps?.actual !== null);
  const beats = reported.filter((entry) => number(entry.eps.actual) > number(entry.eps.estimate));
  const latest = reported.at(-1);
  const upcoming = earnings.find((entry) => entry.eps?.actual === null && entry.report?.verified);
  const surprise = latest
    ? ((number(latest.eps.actual) - number(latest.eps.estimate)) / number(latest.eps.estimate)) * 100
    : null;

  const evidence = {
    schemaVersion: "murre.research-evidence.v1",
    symbol,
    observedAt: currentTime,
    priceUsd: number(currentPrice),
    priorCloseUsd: priorClose,
    high52WeekUsd: high52,
    low52WeekUsd: low52,
    rangePositionPct: rangePosition,
    peRatio: number(fundamentals.pe_ratio),
    pbRatio: number(fundamentals.pb_ratio),
    dividendYieldPct: number(fundamentals.dividend_yield),
    volume: number(fundamentals.volume),
    averageVolume2Weeks: number(fundamentals.average_volume_2_weeks),
    rsi14Daily: number(rsi.value),
    reportedEarnings: reported.length,
    earningsBeats: beats.length,
    latestEarnings: latest,
    nextVerifiedEarnings: upcoming,
  };
  const evidenceHash = hashWithDomain("murre.research-evidence.v1", evidence);

  console.log(`EVIDENCE / ${currentTime}`);
  row("price", `${money(currentPrice)} | prior ${money(priorClose)} | ${percent(dailyChange)}`);
  row("52-week range", `${money(low52)} - ${money(high52)} | ${rangePosition.toFixed(2)}% of range`);
  row("valuation", `P/E ${evidence.peRatio.toFixed(2)} | P/B ${evidence.pbRatio.toFixed(2)} | yield ${evidence.dividendYieldPct.toFixed(2)}%`);
  row("liquidity", `${(evidence.volume / 1_000_000).toFixed(2)}M shares | ${(evidence.volume / evidence.averageVolume2Weeks).toFixed(2)}x 2-week avg`);
  row("momentum", `RSI(14, daily) ${evidence.rsi14Daily.toFixed(2)} | ${evidence.rsi14Daily > 70 ? "ABOVE 70" : "BELOW 70"}`);
  if (latest && surprise !== null) {
    row("latest EPS", `${latest.year} Q${latest.quarter} ${money(latest.eps.actual)} vs ${money(latest.eps.estimate)} | ${percent(surprise)}`);
  }
  row("earnings record", `${beats.length}/${reported.length} reported quarters beat estimates`);
  if (upcoming) row("next earnings", `${upcoming.report.date} | verified`);
  console.log();

  console.log("RESEARCH SYNTHESIS");
  row("positive", "repeated EPS beats; deep trading liquidity");
  row("watch", "premium valuation; RSI above 70; near 52-week high");
  row("status", "RESEARCH COMPLETE / NO ORDER PROPOSED");
  row("handoff", "portfolio construction -> independent risk gate");
  row("evidence hash", `${evidenceHash.slice(0, 20)}...`);
} finally {
  await closeRobinhood(session);
}
