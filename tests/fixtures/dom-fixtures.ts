/**
 * DOM Fixtures for testing UI Scout discovery methods
 */

export const tradingPlatformFixture = `
<!DOCTYPE html>
<html>
<head>
  <title>Trading Platform</title>
</head>
<body>
  <!-- Navigation Menu -->
  <nav role="navigation" class="main-menu">
    <ul role="menu">
      <li><button id="file-menu">File</button></li>
      <li><button id="view-menu">View</button></li>
      <li><button id="tools-menu">Tools</button></li>
      <li><button id="help-menu">Help</button></li>
    </ul>
  </nav>

  <!-- Trading Controls -->
  <div class="trading-panel">
    <button id="new-order-btn" data-testid="new-order" title="F9">New Order</button>
    <button class="buy-btn" data-action="buy">Buy</button>
    <button class="sell-btn" data-action="sell">Sell</button>
    
    <input type="number" id="volume-input" placeholder="Volume" value="1.00" />
    <input type="number" id="price-input" placeholder="Price" />
    <input type="text" id="symbol-input" placeholder="Symbol" value="EURUSD" />
    
    <select id="order-type" name="orderType">
      <option value="market">Market</option>
      <option value="limit">Limit</option>
      <option value="stop">Stop</option>
    </select>
  </div>

  <!-- Chart Timeframes -->
  <div class="timeframe-buttons">
    <button class="tf-btn active" data-timeframe="M1">M1</button>
    <button class="tf-btn" data-timeframe="M5">M5</button>
    <button class="tf-btn" data-timeframe="M15">M15</button>
    <button class="tf-btn" data-timeframe="H1">H1</button>
    <button class="tf-btn" data-timeframe="H4">H4</button>
    <button class="tf-btn" data-timeframe="D1">D1</button>
  </div>

  <!-- Market Watch -->
  <aside class="market-watch">
    <div class="currency-pair" role="button">EUR/USD</div>
    <div class="currency-pair" role="button">GBP/USD</div>
    <div class="currency-pair" role="button">USD/JPY</div>
    <div class="price">1.0895</div>
    <div class="price">1.2734</div>
    <div class="price">149.85</div>
  </aside>

  <!-- Bottom Panel Tabs -->
  <div class="bottom-panel">
    <div role="tablist" class="tab-container">
      <button role="tab" aria-selected="true">Positions</button>
      <button role="tab">Orders</button>
      <button role="tab">History</button>
    </div>
  </div>

  <!-- Dropdown Example -->
  <div class="dropdown">
    <button class="dropdown-toggle">Chart Type</button>
    <ul class="dropdown-menu" style="display: none;">
      <li>Candlestick</li>
      <li>Bar</li>
      <li>Line</li>
    </ul>
  </div>

  <!-- Modal -->
  <div class="modal" role="dialog" style="display: none;">
    <div class="modal-content">
      <button class="close-btn">&times;</button>
      <h2>Settings</h2>
      <input type="checkbox" id="dark-mode" />
      <label for="dark-mode">Dark Mode</label>
    </div>
  </div>
</body>
</html>
`;

export const simpleFormFixture = `
<!DOCTYPE html>
<html>
<body>
  <form>
    <input type="text" id="username" placeholder="Username" />
    <input type="password" id="password" placeholder="Password" />
    <input type="email" placeholder="Email" data-testid="email-input" />
    <textarea id="comments" placeholder="Comments"></textarea>
    <button type="submit" data-testid="submit-btn">Submit</button>
    <button type="reset">Reset</button>
  </form>
</body>
</html>
`;

export const navigationFixture = `
<!DOCTYPE html>
<html>
<body>
  <nav class="main-nav">
    <ul role="menu">
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>
  
  <div role="tablist">
    <button role="tab" aria-selected="true">Tab 1</button>
    <button role="tab">Tab 2</button>
    <button role="tab">Tab 3</button>
  </div>
  
  <select id="country-select">
    <option>USA</option>
    <option>Canada</option>
    <option>Mexico</option>
  </select>
</body>
</html>
`;

export const containerScopedFixture = `
<!DOCTYPE html>
<html>
<body>
  <div class="container-a">
    <button>Button A1</button>
    <button>Button A2</button>
    <input type="text" placeholder="Input A" />
  </div>
  
  <div class="container-b">
    <button>Button B1</button>
    <button>Button B2</button>
    <input type="text" placeholder="Input B" />
  </div>
  
  <div class="outside">
    <button>Outside Button</button>
    <input type="text" placeholder="Outside Input" />
  </div>
</body>
</html>
`;