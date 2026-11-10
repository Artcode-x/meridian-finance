// Express-роут для Node.js сервера. Node 18+ (глобальный fetch).
// ANTHROPIC_API_KEY хранится только на сервере.
const express = require('express');
const router = express.Router();

const SYSTEM = `You are a cautious portfolio analyst inside a crypto tracker app.
You receive ONLY asset symbols, percentage weights and 24h percentage moves. You do not know amounts, the user, or anything else.
Produce a 7-day scenario analysis. Rules:
- Be honest about uncertainty. Short-term crypto moves are close to unpredictable; keep confidence modest (usually 20-60).
- Base the analysis only on the data provided plus widely known properties of the assets (e.g. higher beta of small caps, correlation with BTC). Do not invent news, prices or events.
- Scenario changePct values are portfolio-level percent changes over the horizon, ordered bear <= base <= bull.
- No guarantees, no price targets for single assets, no instructions to buy or sell. "actions" are risk-management ideas (rebalancing, concentration, position sizing).
Return ONLY a JSON object, no markdown, with this shape:
{"outlook":"bullish|neutral|bearish","confidence":0-100,"horizon":"7 days","summary":"2 sentences",
"scenarios":[{"key":"bear","changePct":n,"note":"..."},{"key":"base","changePct":n,"note":"..."},{"key":"bull","changePct":n,"note":"..."}],
"drivers":["..."],"risks":["..."],"actions":["..."]}
Each list has 2-4 short items (max ~120 chars each).`;

const valid = (b) =>
  b &&
  Array.isArray(b.assets) &&
  b.assets.length > 0 &&
  b.assets.length <= 10 &&
  b.assets.every(
    (a) =>
      /^[A-Z0-9]{1,12}$/.test(a.symbol) &&
      Number.isFinite(a.weight) &&
      Number.isFinite(a.change24h),
  ) &&
  b.portfolio &&
  Number.isFinite(b.portfolio.change24h);

// Добавь свой rate limit (express-rate-limit) на этот роут: каждый вызов стоит денег.
router.post(
  '/api/portfolio/forecast',
  express.json({ limit: '8kb' }),
  async (req, res) => {
    if (!valid(req.body)) return res.status(400).json({ error: 'bad payload' });

    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: process.env.FORECAST_MODEL || 'claude-sonnet-5-5',
          max_tokens: 900,
          system: SYSTEM,
          messages: [{ role: 'user', content: JSON.stringify(req.body) }],
        }),
      });
      if (!r.ok) return res.status(502).json({ error: 'upstream' });

      const data = await r.json();
      const text = (data.content || []).map((c) => c.text || '').join('');
      const json = JSON.parse(text.replace(/```json|```/g, '').trim());
      res.json(json);
    } catch (e) {
      res.status(502).json({ error: 'forecast unavailable' });
    }
  },
);

module.exports = router;
