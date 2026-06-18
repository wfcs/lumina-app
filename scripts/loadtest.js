// Teste de carga do Lumina (k6) — https://k6.io
//
// Como rodar (após o deploy):
//   1. Instale o k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
//   2. BASE_URL=https://lumina-app-chi-olive.vercel.app k6 run scripts/loadtest.js
//
// O que mede: o caminho NÃO autenticado de "/" → middleware → Supabase getUser
// → redirect para /login. Esse é o custo por requisição que TODO usuário paga,
// então é um bom sinal de capacidade do middleware + Supabase Auth + Edge.
//
// Para carga autenticada (sessão real), precisamos gerar usuários de teste e
// injetar cookies/JWT — peça que eu monto a variação autenticada.

import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  scenarios: {
    rampa: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 },  // sobe para 20 usuários simultâneos
        { duration: "1m", target: 20 },   // sustenta
        { duration: "30s", target: 50 },  // pico de 50
        { duration: "30s", target: 0 },   // desce
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],            // <2% de erros
    http_req_duration: ["p(95)<1500"],          // 95% abaixo de 1,5s
  },
};

export default function () {
  // "/" dispara o middleware (auth check no Supabase) + redirect — caminho comum
  const root = http.get(`${BASE}/`, { redirects: 0 });
  check(root, { "/ responde (200/307)": (r) => r.status === 200 || r.status === 307 });

  const login = http.get(`${BASE}/login`);
  check(login, { "/login carrega": (r) => r.status === 200 });

  sleep(Math.random() * 2 + 1); // think time 1-3s
}
