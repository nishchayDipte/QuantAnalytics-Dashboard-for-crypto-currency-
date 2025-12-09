
# QuantAnalytics Dashboard
<img width="1336" height="631" alt="Screenshot 2025-12-09 193821" src="https://github.com/user-attachments/assets/7a9be33c-3d8e-46f8-af70-aad4179bb1d7" />

## Architecture 
<img width="1326" height="635" alt="image" src="https://github.com/user-attachments/assets/25f878a2-738c-4820-b3fe-3c408c7e7e38" />


A real-time cryptocurrency derivatives analytics platform designed for **Statistical Arbitrage** and **Pair Trading**. This application ingests live tick data via WebSockets, calculates dynamic hedge ratios using OLS or Kalman Filters, and visualizes Z-Scores for mean-reversion strategies.

## 1. Setup

This project is built with React and TypeScript using a standard toolchain.

### Installation
1.  Clone the repository to your local machine.
2.  Install the required dependencies:
    ```bash
    npm install
    ```

### Running the Application
To start the development server:
```bash
npm start
```
The application will launch in your default browser (usually at `http://localhost:3000`).

## 2. Dependencies

The project relies on a lightweight, performance-focused stack:

*   **React 19:** UI library for component-based architecture.
*   **Recharts:** Composable charting library for visualizing time-series data (Price, Spread, Z-Score).
*   **Tailwind CSS:** Utility-first CSS framework for rapid UI development and dark mode styling.
*   **Lucide React:** Iconography for the dashboard interface.
*   **Binance WebSocket API:** Native browser `WebSocket` implementation (no external SDK required) for real-time crypto market data.

## 3. Methodology

The core trading strategy implemented is **Pairs Trading**, a market-neutral strategy that capitalizes on temporary anomalies between two correlated assets (e.g., BTC/USDT and ETH/USDT).

### The Logic
1.  **Selection:** Select two assets (Asset Y and Asset X) that historically move together.
2.  **Spread Calculation:** Determine the relationship: $Y = \beta X + \alpha$. The "Spread" is the error term (residual) of this equation.
3.  **Normalization (Z-Score):** Convert the spread into a standard score to measure how far the current price relationship is from its historical mean.
4.  **Signal Generation:**
    *   **Entry:** When the Z-Score exceeds a threshold (e.g., +2.0 or -2.0), the spread is statistically "stretched." We bet it will snap back.
    *   **Exit:** When the Z-Score reverts to 0 (the mean), we close the position.

## 4. Analytics Explanation

The application processes raw tick data through several analytical stages in `utils/analytics.ts`.

### A. Sampling & Buffering
*   **Raw Data:** High-frequency tick data is ingested via WebSocket.
*   **Sampling:** To reduce noise and simulate varying trading frequencies, data is resampled into buckets (1s, 1m, 5m).
*   **Liquidity Filter:** Optional filtering removes ticks with quantity below a user-defined threshold to simulate realistic execution constraints.

### B. Hedge Ratio Estimation ($\beta$)
The app supports two methods to calculate the Hedge Ratio (Slope):

1.  **Ordinary Least Squares (OLS):**
    *   Calculates the linear regression slope over a fixed rolling window (e.g., last 30 periods).
    *   *Best for:* Stable market regimes where the correlation is constant.
    *   *Formula:* $\beta = \frac{Cov(X, Y)}{Var(X)}$

2.  **Kalman Filter:**
    *   A recursive algorithm that estimates the state of a dynamic system. It treats the Hedge Ratio ($\beta$) as a time-varying parameter that "walks" randomly.
    *   *Best for:* Dynamic markets where the correlation drifts over time. It adapts instantly to new data points without needing a fixed window buffer.
    *   *State Update:* $x_{k|k} = x_{k|k-1} + K_k(y_k - H_k x_{k|k-1})$

### C. Z-Score Calculation
Once the spread is derived, the Z-Score is calculated using a rolling window mean and standard deviation:

$$ Z = \frac{Spread_t - \mu_{window}}{\sigma_{window}} $$

*   **$\mu$ (Mu):** Rolling Mean of the spread.
*   **$\sigma$ (Sigma):** Rolling Standard Deviation of the spread.

### D. Real-Time Backtesting Engine
The dashboard runs a forward-test simulation on the sampled data:
*   **Entry Rule:** $|Z| > Threshold$ (User configurable, default 2.0).
*   **Exit Rule:** $Z$ crosses $0$ (Mean Reversion).
*   **PnL Calculation:** Approximated as the difference in spread values between entry and exit.


