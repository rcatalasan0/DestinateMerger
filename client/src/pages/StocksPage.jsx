import { useState, useRef, useEffect, useCallback } from "react";

// API Configuration - Change this to match your Flask server
const API_BASE_URL = "http://127.0.0.1:5000";

export default function StocksPage() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [smoothChart, setSmoothChart] = useState(true);
  const canvasRef = useRef(null);

  // Fetch available stocks on mount
  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stocks`);
      const result = await response.json();
      if (response.ok) {
        setStocks(Array.isArray(result.stocks) ? result.stocks : []);

      }
    } catch (err) {
      console.error("Failed to fetch stocks:", err);
    }
  };

  const fetchPrediction = async (tickerSymbol = ticker) => {
    const symbolToFetch = tickerSymbol || ticker;
    if (!symbolToFetch.trim()) {
      setError("Please enter a stock ticker");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/predict?ticker=${encodeURIComponent(symbolToFetch.toUpperCase())}&days=7`

      );
      const result = await response.json();

      if (response.ok) {
        setData(result);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch prediction");
        setData(null);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to connect to server. Make sure Flask is running on port 5000.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Draw chart when data changes
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data?.predictions?.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const points = data.predictions;
    const w = canvas.width;
    const h = canvas.height;
    const pad = 40;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Get price range
    const prices = points.map((p) => p.predicted_price);
    const min = Math.min(...prices) * 0.995;
    const max = Math.max(...prices) * 1.005;
    const yRange = max - min;
    const yScale = (h - pad * 2) / (yRange || 1);
    const xStep = (w - pad * 2) / (points.length - 1);

    const getPos = (i, price) => ({
      x: pad + i * xStep,
      y: h - pad - (price - min) * yScale,
    });

    const getPoint = (i) => getPos(i, points[i].predicted_price);

    // Draw grid lines
    ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad + (i * (h - pad * 2)) / 4;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();

      // Price labels
      const price = max - (i * yRange) / 4;
      ctx.fillStyle = "#64748b";
      ctx.font = "11px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`$${price.toFixed(0)}`, pad - 8, y + 4);
    }

    // Draw area fill
    ctx.beginPath();
    const startPoint = getPoint(0);
    ctx.moveTo(startPoint.x, startPoint.y);

    if (smoothChart) {
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = getPoint(i);
        const p2 = getPoint(i + 1);
        const ctrlX = (p1.x + p2.x) / 2;
        ctx.bezierCurveTo(ctrlX, p1.y, ctrlX, p2.y, p2.x, p2.y);
      }
    } else {
      for (let i = 1; i < points.length; i++) {
        const p = getPoint(i);
        ctx.lineTo(p.x, p.y);
      }
    }

    const lastPoint = getPoint(points.length - 1);
    ctx.lineTo(lastPoint.x, h - pad);
    ctx.lineTo(pad, h - pad);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.02)");
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);

    if (smoothChart) {
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = getPoint(i);
        const p2 = getPoint(i + 1);
        const ctrlX = (p1.x + p2.x) / 2;
        ctx.bezierCurveTo(ctrlX, p1.y, ctrlX, p2.y, p2.x, p2.y);
      }
    } else {
      for (let i = 1; i < points.length; i++) {
        const p = getPoint(i);
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();

    // Draw dots
    const lastHistoricalIndex = points.length - 2;
    const predictionIndex = points.length - 1;
    const lastHistoricalPrice = points[lastHistoricalIndex]?.predicted_price;
    const predictionPrice = points[predictionIndex]?.predicted_price;

    points.forEach((point, i) => {
      const p = getPoint(i);
      let dotColor = "#3b82f6";
      let dotSize = 5;

      if (i === lastHistoricalIndex) {
        dotColor = "#ffffff";
        dotSize = 6;
      } else if (i === predictionIndex) {
        dotColor = predictionPrice > lastHistoricalPrice ? "#10b981" : "#ef4444";
        dotSize = 7;
      }

      // Outer ring for special points
      if (i >= lastHistoricalIndex) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotSize + 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();

      if (i === lastHistoricalIndex) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Date labels
      if (i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2)) {
        ctx.fillStyle = "#64748b";
        ctx.font = "10px system-ui, sans-serif";
        ctx.textAlign = "center";
        const dateStr = new Date(point.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        ctx.fillText(dateStr, p.x, h - pad + 16);
      }
    });

    // Legend
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "left";

    // Historical dot
    ctx.beginPath();
    ctx.arc(w - 160, 20, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#3b82f6";
    ctx.fill();
    ctx.fillStyle = "#64748b";
    ctx.fillText("Historical", w - 150, 24);

    // Forecast dot
    ctx.beginPath();
    ctx.arc(w - 80, 20, 5, 0, Math.PI * 2);
    ctx.fillStyle = predictionPrice > lastHistoricalPrice ? "#10b981" : "#ef4444";
    ctx.fill();
    ctx.fillStyle = "#64748b";
    ctx.fillText("Forecast", w - 70, 24);
  }, [data, smoothChart]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // Calculate stats
  const getStats = () => {
    if (!data?.predictions?.length) return null;

    const points = data.predictions;
    const historicalPoints = points.slice(0, -1);
    const forecastPoint = points[points.length - 1];

    if (historicalPoints.length === 0) return null;

    const startPrice = historicalPoints[0].predicted_price;
    const endPrice = historicalPoints[historicalPoints.length - 1].predicted_price;
    const forecastPrice = forecastPoint.predicted_price;
    const change = forecastPrice - endPrice;
    const changePct = (change / endPrice) * 100;

    return {
      ticker: data.ticker,
      startPrice,
      endPrice,
      forecastPrice,
      change,
      changePct,
      forecastDate: forecastPoint.date,
      isPositive: change >= 0,
    };
  };

  const stats = getStats();

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      fetchPrediction();
    }
  };

  const handleQuickSelect = (symbol) => {
    setTicker(symbol);
    fetchPrediction(symbol);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Defense Sector ML Predictions</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Stock Market{" "}
              <span className="text-primary">Predictor</span>
            </h1>

            <p className="text-muted-foreground text-lg mb-8 max-w-xl">
              Get 7-day historical data and next-day ML forecasts for defense sector stocks.
              Powered by Random Forest regression.
            </p>

            {/* Search Box */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter ticker (e.g., LMT)"
                  className="w-full pl-12 pr-4 py-3 bg-card border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
              <button
                onClick={() => fetchPrediction()}
                disabled={loading}
                className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-semibold rounded-lg transition-all flex items-center justify-center gap-2 min-w-[140px]"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>Predict</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Stock Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-muted-foreground text-sm py-1">Quick select:</span>
              {stocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleQuickSelect(stock.symbol)}
                  className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-secondary-foreground hover:text-foreground transition-all"
                >
                  {stock.symbol}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      {data && (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chart Card */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  7-Day Price Projection
                </h2>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smoothChart}
                    onChange={(e) => setSmoothChart(e.target.checked)}
                    className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                  />
                  <span>Smooth lines</span>
                </label>
              </div>

              <canvas
                ref={canvasRef}
                width={800}
                height={360}
                className="w-full h-auto"
              />
            </div>

            {/* Stats Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Overview</h2>

              {stats && (
                <div className="space-y-4">
                  {/* Ticker */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Ticker</div>
                    <div className="text-2xl font-bold text-foreground">{stats.ticker}</div>
                  </div>

                  {/* Next Day Forecast */}
                  <div className={`p-4 rounded-lg ${stats.isPositive ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Next Day Forecast
                    </div>
                    <div className={`text-2xl font-bold ${stats.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      ${stats.forecastPrice.toFixed(2)}
                    </div>
                    <div className={`text-sm mt-1 ${stats.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {stats.isPositive ? "+" : ""}${stats.change.toFixed(2)} ({stats.isPositive ? "+" : ""}{stats.changePct.toFixed(2)}%)
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Start Price</div>
                      <div className="text-lg font-semibold text-foreground">${stats.startPrice.toFixed(2)}</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">End Price</div>
                      <div className="text-lg font-semibold text-foreground">${stats.endPrice.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Daily Points */}
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">Daily Points</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                      {data.predictions.map((point, i) => {
                        const isLast = i === data.predictions.length - 1;
                        return (
                          <div
                            key={i}
                            className={`flex items-center justify-between p-2 rounded-lg ${isLast ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isLast ? "bg-primary" : "bg-muted-foreground"}`} />
                              <span className="text-sm text-foreground">
                                {new Date(point.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              {isLast && (
                                <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                                  Forecast
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              ${point.predicted_price.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Model Info */}
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                    <div>Model: {data.model}</div>
                    <div>Updated: {new Date(data.generated_at).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Raw JSON (Collapsible) */}
          <details className="mt-6 bg-card border border-border rounded-xl">
            <summary className="p-4 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              View Raw API Response
            </summary>
            <pre className="p-4 pt-0 text-sm text-foreground overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </section>
      )}

      {/* Available Stocks Section */}
      {!data && stocks.length > 0 && (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Available Defense Stocks</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stocks.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleQuickSelect(stock.symbol)}
                className="p-6 bg-card border border-border rounded-xl text-left hover:bg-muted/50 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {stock.symbol}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{stock.name}</div>
                  </div>
                  <div className="px-2 py-1 text-xs bg-muted rounded text-muted-foreground capitalize">
                    {stock.sector}
                  </div>
                </div>
                <div className="mt-4 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to get prediction →
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
