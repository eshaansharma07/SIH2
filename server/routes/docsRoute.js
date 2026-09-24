import express from 'express';

const router = express.Router();

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "SaakhSetu API Specification",
    version: "1.0.0",
    description: "Sovereign Rural Micro-Enterprise Ledger, DPI Scheme Radar & Alternative Cash-Flow Underwriting Engine API Documentation (Capstone Project)."
  },
  servers: [
    { url: "https://saakhsetu.vercel.app/api", description: "Production Server (Vercel)" },
    { url: "http://localhost:5001/api", description: "Local Development Server" }
  ],
  paths: {
    "/health": {
      get: {
        summary: "Platform Health & Database Status",
        responses: {
          "200": { description: "API and DB connections operational" }
        }
      }
    },
    "/shop/demo-login": {
      post: {
        summary: "One-Click Evaluator Demo Authentication",
        description: "Logs in as Ramesh's Kirana Store with pre-seeded 120-day rural transaction lifecycle.",
        responses: {
          "200": { description: "Returns signed JWT and shop profile" }
        }
      }
    },
    "/shop/send-otp": {
      post: {
        summary: "Send 6-Digit SMS OTP for Login or Registration",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  phone: { type: "string", example: "9839124789" },
                  type: { type: "string", enum: ["login", "register"], example: "login" }
                },
                required: ["phone"]
              }
            }
          }
        },
        responses: {
          "200": { description: "OTP dispatched via cellular network or sandbox code generated" }
        }
      }
    },
    "/transactions": {
      get: {
        summary: "List Shop Ledger Transactions (Paginated)",
        parameters: [
          { name: "shopId", in: "query", required: true, schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } }
        ],
        responses: {
          "200": { description: "Array of transaction objects" }
        }
      },
      post: {
        summary: "Record Daily Bahi-Khata Transaction",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  shop_id: { type: "string", example: "ramesh-kirana" },
                  amount: { type: "number", example: 850 },
                  type: { type: "string", enum: ["income", "expense", "udhaar_given", "udhaar_repaid"] },
                  payment_mode: { type: "string", enum: ["cash", "upi", "khata"] },
                  category: { type: "string", example: "Grocery" }
                },
                required: ["shop_id", "amount", "type"]
              }
            }
          }
        },
        responses: {
          "201": { description: "Transaction persisted and balance updated" }
        }
      }
    },
    "/credit-score": {
      get: {
        summary: "Calculate 4-Pillar Alternative Credit Score (300–850)",
        parameters: [
          { name: "shopId", in: "query", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Score, risk tier, breakdown of 4 pillars, and Nayak Committee limit" }
        }
      }
    },
    "/schemes": {
      get: {
        summary: "List All 14 Verified Statutory Government Schemes",
        responses: {
          "200": { description: "Array of MUDRA, SVANidhi, PMEGP, and state priority schemes" }
        }
      }
    },
    "/accounting/dashboard": {
      get: {
        summary: "Kirana Accounting Dashboard & 4-Bucket Aging",
        parameters: [
          { name: "shopId", in: "query", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Inventory valuation, payables, receivables, and GSTR tax summary" }
        }
      }
    },
    "/admin/queue/stats": {
      get: {
        summary: "Asynchronous Message Queue Telemetry & DLQ Status",
        description: "Reports pending queue length, delivered messages, retried counts, and Dead Letter Queue length.",
        responses: {
          "200": { description: "Queue statistics and metrics" }
        }
      }
    }
  }
};

// Serve JSON spec
router.get('/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

// Serve Interactive Swagger UI HTML
router.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SaakhSetu API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230F3E2E'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>" />
  <style>
    body { margin: 0; background: #FAF7F2; }
    .topbar { display: none; }
    .swagger-ui .info .title { font-family: serif; color: #0F3E2E; font-weight: 900; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        spec: ${JSON.stringify(openApiSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

export default router;
