import { Resend } from "resend";
import { ScanResult } from "./scanner";

export async function sendReport(to: string, result: ScanResult) {
  const resend = new Resend(process.env.RESEND_API_KEY!);

  const scoreEmoji = result.score >= 80 ? "🟢" : result.score >= 60 ? "🟡" : "🔴";
  const metricsHtml = result.metrics
    .map(
      (m) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #1f2937;color:#d1d5db">${m.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #1f2937;font-weight:700;color:${m.score >= 80 ? "#34d399" : m.score >= 60 ? "#fbbf24" : "#f87171"}">${m.score}/100</td>
      <td style="padding:10px 12px;border-bottom:1px solid #1f2937;color:#9ca3af;font-size:13px">${m.detail}</td>
    </tr>`
    )
    .join("");

  const suggestionsHtml = result.suggestions
    .map((s) => `<li style="margin-bottom:8px;color:#d1d5db">${s}</li>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px">
      <h1 style="color:#fff;font-size:32px;margin:0;letter-spacing:-1px">
        CSS<span style="color:#818cf8">can</span>
      </h1>
      <p style="color:#6b7280;margin:8px 0 0">Rapport d'audit visuel</p>
    </div>

    <!-- Score -->
    <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px">
      <p style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px">Score global</p>
      <p style="font-size:64px;font-weight:800;margin:0;color:${result.score >= 80 ? "#34d399" : result.score >= 60 ? "#fbbf24" : "#f87171"}">${scoreEmoji} ${result.score}<span style="font-size:24px;color:#4b5563">/100</span></p>
      <p style="color:#6b7280;margin:12px 0 0;font-size:14px">${result.url}</p>
    </div>

    <!-- Métriques -->
    <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;overflow:hidden;margin-bottom:24px">
      <div style="padding:20px 24px;border-bottom:1px solid #1f2937">
        <h2 style="color:#fff;margin:0;font-size:16px">📊 Métriques détaillées</h2>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#0d1117">
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:12px;font-weight:500">Catégorie</th>
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:12px;font-weight:500">Score</th>
            <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:12px;font-weight:500">Détail</th>
          </tr>
        </thead>
        <tbody>${metricsHtml}</tbody>
      </table>
    </div>

    <!-- Suggestions -->
    <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:24px;margin-bottom:32px">
      <h2 style="color:#fff;margin:0 0 16px;font-size:16px">💡 Recommandations</h2>
      <ul style="margin:0;padding-left:20px">${suggestionsHtml}</ul>
    </div>

    <!-- Footer -->
    <div style="text-align:center">
      <p style="color:#374151;font-size:12px">
        Rapport généré le ${new Date(result.scannedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · CSScan
      </p>
    </div>

  </div>
</body>
</html>`;

  return resend.emails.send({
    from: "CSScan <rapport@csscan.io>",
    to,
    subject: `${scoreEmoji} Votre rapport CSScan — Score ${result.score}/100`,
    html,
  });
}
