# Backend Development Instructions - FutHub Monetization Features

Hello! The frontend for the FutHub monetization features is **100% complete** and ready. However, several API endpoints are missing, which is why some pages appear blank.

## 🎯 What Needs To Be Built

The frontend is calling 4 API endpoints that don't exist yet:

1. **AI Copilot Chat** - `POST /api/ai/copilot` (conversational AI)
2. **Portfolio Optimizer** - `POST /api/ai/optimize-portfolio` (AI portfolio analysis)
3. **Market Sentiment** - `GET /api/market/sentiment` (sentiment aggregation)
4. **Bulk Trades** - `POST /api/trades/bulk` (already documented, needs implementation)

---

## 📋 Complete Documentation Available

I've created comprehensive guides in the repository:

### Main Guides:
- **`BACKEND_UPDATE_INSTRUCTIONS.md`** - Complete API specs, database schemas, entitlements system
- **`BACKEND_AI_COPILOT.md`** - Full OpenAI integration for Smart Buy AI feature
- **`BACKEND_STRIPE_WEBHOOKS.md`** - Stripe subscription webhook handlers
- **`BACKEND_ENV_TEMPLATE.md`** - All environment variables needed

### Important Notes:
- Database migrations included (users, entitlements, portfolio, referrals, sentiment)
- Entitlements system for Free/Basic/Pro/Elite tiers is fully documented
- Rate limiting configurations per tier
- Security best practices included
- Testing checklists provided

---

## 🔴 CRITICAL: Missing Endpoints Details

### 1. AI Copilot Chat Endpoint

**Endpoint:** `POST /api/ai/copilot`

**Purpose:** Conversational AI for trading advice (different from Smart Buy AI)

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What players should I invest in right now?"
    }
  ],
  "context": {
    "includePortfolio": true,
    "includeMarketData": true
  }
}
```

**Response:**
```json
{
  "response": "Based on current market conditions and your portfolio, I recommend looking at high-rated Premier League midfielders. Players like Kevin De Bruyne and Bruno Fernandes are showing strong buy signals due to Weekend League demand.",
  "suggestions": [
    {
      "title": "Analyze De Bruyne",
      "description": "Deep dive into KDB market trends",
      "action": "Tell me more about De Bruyne's price history"
    },
    {
      "title": "Compare Midfielders",
      "description": "Compare top midfielders for investment",
      "action": "Compare De Bruyne vs Bruno Fernandes"
    }
  ]
}
```

**Implementation Notes:**
- Use OpenAI GPT-4 or GPT-3.5-turbo
- Include user's portfolio context in system prompt
- Include current market data (trending players, prices)
- Track conversation history (messages array)
- Rate limit: 10 requests/hour for Pro, 30/hour for Elite
- Cache responses for 5 minutes
- Requires `ai_copilot` feature entitlement

**System Prompt Example:**
```
You are a FIFA Ultimate Team trading expert assistant. You provide conversational advice based on:
- User's portfolio and trading history
- Current market trends and prices
- Technical indicators (RSI, moving averages)
- Market timing (Weekend League, content releases)

Be conversational, helpful, and provide actionable suggestions. Keep responses concise (2-3 paragraphs max).
```

---

### 2. Portfolio Optimizer Endpoint

**Endpoint:** `POST /api/ai/optimize-portfolio`

**Purpose:** AI-powered portfolio analysis and optimization recommendations

**Request Body:**
```json
{
  "goal": "balanced",
  "trades": [
    {
      "id": 123,
      "player": "Mohamed Salah",
      "buyPrice": 45000,
      "sellPrice": null,
      "quantity": 3,
      "platform": "ps",
      "createdAt": "2025-12-01T10:00:00Z"
    }
  ]
}
```

**Query Parameters:**
- `goal` (required): `"aggressive"` | `"balanced"` | `"conservative"`

**Response:**
```json
{
  "score": 75,
  "scoreDescription": "Your portfolio shows good diversification but has moderate concentration risk in high-rated attackers. Overall risk/reward profile is balanced.",
  "riskLevel": "medium",
  "recommendations": [
    {
      "priority": "high",
      "title": "Reduce position concentration",
      "description": "70% of your capital is in Mohamed Salah. Consider taking partial profits and diversifying into 2-3 other players.",
      "expectedGain": 12
    },
    {
      "priority": "medium",
      "title": "Add defensive assets",
      "description": "Your portfolio lacks defensive players which tend to be more stable. Consider adding a top-rated CB or GK.",
      "expectedGain": 8
    },
    {
      "priority": "low",
      "title": "Set stop-loss orders",
      "description": "Protect gains by setting mental stop-losses at -10% for volatile positions.",
      "expectedGain": 5
    }
  ],
  "diversification": {
    "topPositions": [
      {
        "player": "Mohamed Salah",
        "percentage": 70
      },
      {
        "player": "Erling Haaland",
        "percentage": 20
      },
      {
        "player": "Kylian Mbappé",
        "percentage": 10
      }
    ]
  },
  "metrics": {
    "sharpe": 1.8,
    "maxDrawdown": 15,
    "winRate": 68
  }
}
```

**Implementation Notes:**
- Calculate portfolio metrics (total value, P&L, concentration)
- Use position sizing analysis (detect over-concentration)
- Calculate risk metrics:
  - **Sharpe Ratio:** Return per unit of risk
  - **Max Drawdown:** Largest peak-to-trough decline
  - **Win Rate:** % of profitable trades
- Generate recommendations based on goal:
  - **Aggressive:** High risk/reward, concentrated positions
  - **Balanced:** Moderate diversification, mixed risk
  - **Conservative:** High diversification, low volatility
- Requires `ai_copilot` or `advanced_analytics` feature
- Can use OpenAI for recommendation generation or rule-based system

**Calculation Examples:**
```python
def calculate_portfolio_score(trades, goal):
    # Concentration risk (0-100, lower is better)
    concentration = calculate_concentration(trades)

    # Diversification score (0-100, higher is better)
    diversification = 100 - concentration

    # Win rate from closed trades
    win_rate = calculate_win_rate(trades)

    # Combine based on goal
    if goal == 'aggressive':
        score = (win_rate * 0.7) + (concentration * 0.3)  # Favor high returns
    elif goal == 'conservative':
        score = (diversification * 0.7) + (win_rate * 0.3)  # Favor safety
    else:  # balanced
        score = (win_rate * 0.5) + (diversification * 0.5)

    return round(score)

def calculate_concentration(trades):
    total_value = sum(t['buyPrice'] * t['quantity'] for t in trades)
    max_position = max(t['buyPrice'] * t['quantity'] for t in trades)
    return (max_position / total_value) * 100 if total_value > 0 else 0
```

---

### 3. Market Sentiment Endpoint

**Endpoint:** `GET /api/market/sentiment`

**Purpose:** Aggregate sentiment data from multiple sources (Twitter, Discord, Community)

**Query Parameters:**
- `timeframe` (optional): `"1h"` | `"6h"` | `"24h"` | `"7d"` (default: `"24h"`)

**Response:**
```json
{
  "overallScore": 72,
  "summary": "Market sentiment is bullish heading into the weekend. TOTY content speculation and Weekend League demand are driving positive sentiment across all platforms.",
  "sources": {
    "twitter": {
      "score": 75,
      "mentions": 1250
    },
    "discord": {
      "score": 68,
      "messages": 3400
    },
    "community": {
      "score": 73,
      "traders": 850
    }
  },
  "trendingTopics": [
    {
      "hashtag": "TOTY",
      "mentions": 5600,
      "trend": "up",
      "sentiment": "positive"
    },
    {
      "hashtag": "MarketCrash",
      "mentions": 2300,
      "trend": "down",
      "sentiment": "negative"
    },
    {
      "hashtag": "WeekendLeague",
      "mentions": 4100,
      "trend": "up",
      "sentiment": "positive"
    }
  ],
  "topPlayers": [
    {
      "name": "Kylian Mbappé",
      "mentions": 890,
      "changePercent": 8.5,
      "sentimentScore": 85
    },
    {
      "name": "Erling Haaland",
      "mentions": 720,
      "changePercent": 5.2,
      "sentimentScore": 78
    },
    {
      "name": "Mohamed Salah",
      "mentions": 650,
      "changePercent": -3.1,
      "sentimentScore": 45
    }
  ],
  "aiInsight": "Strong bullish sentiment around TOTY release next week. High-rated meta players showing increased social media buzz. Weekend League starting Friday will likely drive prices up 5-10% for popular cards. Consider taking profits on Monday after Weekend League ends."
}
```

**Implementation Options:**

**Option A: Real Sentiment Analysis (Complex)**
- Integrate with Twitter API v2 for FUT hashtags
- Set up Discord bot to monitor trading servers
- Use sentiment analysis library (VADER, TextBlob, or OpenAI)
- Store sentiment data in `card_sentiment` table (see database schema)
- Update every 5-15 minutes via cron job

**Option B: Mock/Placeholder Data (Quick Start)**
```python
@app.route('/api/market/sentiment')
def market_sentiment():
    # Return mock data for now
    return jsonify({
        'overallScore': random.randint(50, 80),
        'summary': 'Market sentiment is currently positive...',
        'sources': {
            'twitter': {'score': 70, 'mentions': 1000},
            'discord': {'score': 65, 'messages': 2000},
            'community': {'score': 68, 'traders': 500}
        },
        'trendingTopics': [],
        'topPlayers': [],
        'aiInsight': 'Sentiment data will be available soon.'
    })
```

**Option C: Community Voting (Recommended MVP)**
- Let users vote on sentiment (bullish/bearish)
- Aggregate votes per player card
- Calculate score from vote ratio
- Simpler to implement, real data from users

```python
# User votes on sentiment
POST /api/players/:card_id/sentiment
{
  "platform": "ps",
  "vote": "bullish"  # or "bearish"
}

# Aggregate and return
GET /api/market/sentiment
# Calculate from card_sentiment table
```

**Implementation Notes:**
- Cache aggressively (5-15 minute TTL)
- Public endpoint (no auth required, but rate limited)
- Score calculation: (bullish_votes - bearish_votes) / total_votes * 100
- Normalize to 0-100 scale (50 = neutral)

---

### 4. Bulk Trades Endpoint ✅

**Endpoint:** `POST /api/trades/bulk`

**Purpose:** Record multiple trades at once (for power traders)

**Request Body:**
```json
{
  "trades": [
    {
      "player": "Mohamed Salah",
      "buyPrice": 45000,
      "sellPrice": 48000,
      "quantity": 2,
      "platform": "ps",
      "notes": "Weekend League flip"
    },
    {
      "player": "Erling Haaland",
      "buyPrice": 52000,
      "sellPrice": 55000,
      "quantity": 1,
      "platform": "ps",
      "notes": "TOTY hype"
    }
  ]
}
```

**Response:**
```json
{
  "count": 2,
  "success": true,
  "trades": [
    {
      "id": 1234,
      "player": "Mohamed Salah",
      "profit": 6000,
      "profitPercent": 6.67
    },
    {
      "id": 1235,
      "player": "Erling Haaland",
      "profit": 3000,
      "profitPercent": 5.77
    }
  ]
}
```

**Implementation:**
```python
@app.route('/api/trades/bulk', methods=['POST'])
@require_auth
def bulk_trades():
    data = request.get_json()
    trades_data = data.get('trades', [])

    if not trades_data:
        return jsonify({'error': 'No trades provided'}), 400

    created_trades = []
    for trade in trades_data:
        # Validate required fields
        if not all(k in trade for k in ['player', 'buyPrice', 'sellPrice', 'platform']):
            continue

        # Calculate profit (with 5% EA tax)
        buy_price = float(trade['buyPrice'])
        sell_price = float(trade['sellPrice'])
        quantity = int(trade.get('quantity', 1))

        revenue = sell_price * quantity
        ea_tax = revenue * 0.05
        net_revenue = revenue - ea_tax
        cost = buy_price * quantity
        profit = net_revenue - cost

        # Create trade record
        new_trade = Trade(
            user_id=get_current_user_id(),
            player_name=trade['player'],
            buy_price=buy_price,
            sell_price=sell_price,
            quantity=quantity,
            platform=trade['platform'],
            profit=profit,
            notes=trade.get('notes', ''),
            created_at=datetime.now()
        )

        db.session.add(new_trade)
        created_trades.append({
            'id': new_trade.id,
            'player': new_trade.player_name,
            'profit': profit,
            'profitPercent': (profit / cost) * 100 if cost > 0 else 0
        })

    db.session.commit()

    return jsonify({
        'count': len(created_trades),
        'success': True,
        'trades': created_trades
    }), 201
```

**Note:** This is the only endpoint already fully documented in `BACKEND_UPDATE_INSTRUCTIONS.md` section 2.6!

---

## 🗂️ Database Schema Updates Required

All schema updates are in `BACKEND_UPDATE_INSTRUCTIONS.md`, but here's a summary:

### New Tables Needed:
```sql
-- User entitlements (already in docs)
CREATE TABLE user_entitlements (...);

-- Portfolio tracking (if implementing portfolio optimizer)
CREATE TABLE user_portfolios (...);

-- Sentiment tracking (if implementing sentiment)
CREATE TABLE card_sentiment (
  id SERIAL PRIMARY KEY,
  card_id VARCHAR(50) NOT NULL,
  platform VARCHAR(10) NOT NULL,
  sentiment_score DECIMAL(3,2) DEFAULT 0,
  bullish_count INTEGER DEFAULT 0,
  bearish_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(card_id, platform)
);

-- Chat history (for AI copilot)
CREATE TABLE ai_chat_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  messages JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Implementation Priority

### Phase 1: MVP (Get Pages Working)
1. **Bulk Trades** ✅ - Easiest, fully documented
2. **Mock Sentiment** - Return placeholder data, pages work immediately
3. **Basic Portfolio Optimizer** - Simple rule-based analysis, no AI needed yet
4. **Basic AI Copilot** - Simple OpenAI integration

### Phase 2: Full Features
1. **Real Sentiment** - Community voting system
2. **Advanced Portfolio** - Add real metrics (Sharpe, drawdown)
3. **Enhanced Copilot** - Add context, better prompts

### Phase 3: Polish
1. **Caching** - Redis for all endpoints
2. **Rate Limiting** - Tier-based limits
3. **Monitoring** - Logging, metrics, alerts

---

## 🚀 Quick Start: Mock Endpoints (30 minutes)

Create a file `app/routes/mock_endpoints.py`:

```python
from flask import Blueprint, jsonify, request
from app.decorators import require_auth
import random

bp = Blueprint('mock', __name__)

@bp.route('/api/ai/copilot', methods=['POST'])
@require_auth
def mock_copilot():
    data = request.get_json()
    user_message = data.get('messages', [{}])[-1].get('content', '')

    return jsonify({
        'response': f"I understand you're asking about: '{user_message}'. This is a mock response while the AI system is being built. Full analysis coming soon!",
        'suggestions': [
            {
                'title': 'View Market Trends',
                'description': 'Check current trending players',
                'action': 'Show me trending players'
            }
        ]
    })

@bp.route('/api/ai/optimize-portfolio', methods=['POST'])
@require_auth
def mock_portfolio_optimizer():
    data = request.get_json()
    trades = data.get('trades', [])

    return jsonify({
        'score': random.randint(60, 85),
        'scoreDescription': f'Your portfolio contains {len(trades)} positions. Full analysis system is being built.',
        'riskLevel': 'medium',
        'recommendations': [
            {
                'priority': 'high',
                'title': 'Portfolio analysis coming soon',
                'description': 'Advanced AI analysis will be available shortly',
                'expectedGain': 10
            }
        ],
        'diversification': {
            'topPositions': []
        },
        'metrics': {
            'sharpe': 1.5,
            'maxDrawdown': 12,
            'winRate': 65
        }
    })

@bp.route('/api/market/sentiment', methods=['GET'])
def mock_sentiment():
    return jsonify({
        'overallScore': random.randint(55, 75),
        'summary': 'Sentiment analysis is being built. Community voting system coming soon!',
        'sources': {
            'twitter': {'score': 70, 'mentions': 1200},
            'discord': {'score': 65, 'messages': 2800},
            'community': {'score': 68, 'traders': 450}
        },
        'trendingTopics': [
            {
                'hashtag': 'TOTY',
                'mentions': 5000,
                'trend': 'up',
                'sentiment': 'positive'
            }
        ],
        'topPlayers': [
            {
                'name': 'Kylian Mbappé',
                'mentions': 800,
                'changePercent': 7.5,
                'sentimentScore': 80
            }
        ],
        'aiInsight': 'Real-time sentiment analysis coming soon. This is placeholder data.'
    })

# Register blueprint in your app.py
# from app.routes import mock_endpoints
# app.register_blueprint(mock_endpoints.bp)
```

This will make all pages functional immediately while you build the real implementations!

---

## 📞 Questions?

If you need clarification on any endpoint or implementation detail:

1. Check `BACKEND_UPDATE_INSTRUCTIONS.md` first (most comprehensive)
2. Review `BACKEND_AI_COPILOT.md` for AI implementation patterns
3. Check `BACKEND_ENV_TEMPLATE.md` for configuration
4. Look at `BACKEND_STRIPE_WEBHOOKS.md` for payment handling

All files are in the repository root directory.

---

## ✅ Testing Checklist

Once implemented, test:

- [ ] AI Copilot responds to questions
- [ ] Portfolio Optimizer returns score and recommendations
- [ ] Market Sentiment shows data for all timeframes
- [ ] Bulk Trades creates multiple trade records
- [ ] Premium features require correct tier (Pro/Elite)
- [ ] Rate limiting works per tier
- [ ] CORS allows frontend domain
- [ ] Authentication cookies work

---

## 🎉 Summary

**Frontend Status:** ✅ 100% Complete
**Backend Status:** 🔴 4 Endpoints Missing
**Documentation:** ✅ Complete (52KB of guides)
**Next Step:** Implement the 4 missing endpoints above

The frontend is beautiful and ready. Once these endpoints are live, everything will work perfectly! 🚀
