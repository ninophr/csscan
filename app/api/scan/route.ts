import { NextRequest, NextResponse } from "next/server";

interface Metric {
  name: string;
  score: number;
  detail: string;
}

function analyzeHtml(html: string): { score: number; metrics: Metric[]; suggestions: string[] } {
  const metrics: Metric[] = [];
  const suggestions: string[] = [];

  // 1. Typographie
  const hasFontFamily = html.includes("font-family") || html.includes("font-face");
  const hasHeadings = /<h[1-3]/i.test(html);
  const typoScore = (hasFontFamily ? 50 : 20) + (hasHeadings ? 50 : 30);
  metrics.push({
    name: "Typographie",
    score: Math.min(typoScore, 100),
    detail: hasFontFamily ? "Police personnalisée détectée" : "Aucune police personnalisée",
  });
  if (!hasFontFamily) suggestions.push("Définir une police personnalisée via @font-face ou Google Fonts");
  if (!hasHeadings) suggestions.push("Structurer le contenu avec des titres H1/H2/H3");

  // 2. Couleurs & Contraste
  const colorMatches = html.match(/#[0-9a-fA-F]{3,6}|rgb\(/g) || [];
  const colorCount = colorMatches.length;
  const colorScore = colorCount > 10 ? 60 : colorCount > 5 ? 80 : colorCount > 2 ? 90 : 50;
  metrics.push({
    name: "Couleurs",
    score: colorScore,
    detail: `${colorCount} occurrences de couleur détectées`,
  });
  if (colorCount > 15) suggestions.push("Réduire la palette de couleurs pour plus de cohérence visuelle");
  if (colorCount < 3) suggestions.push("Définir une palette de couleurs claire (primaire, secondaire, neutre)");

  // 3. Espacement & Layout
  const hasFlexGrid = /display\s*:\s*(flex|grid)/i.test(html) || html.includes("flex") || html.includes("grid");
  const hasMarginPadding = /margin|padding/i.test(html);
  const layoutScore = (hasFlexGrid ? 60 : 30) + (hasMarginPadding ? 40 : 20);
  metrics.push({
    name: "Layout & Espacement",
    score: Math.min(layoutScore, 100),
    detail: hasFlexGrid ? "Flexbox/Grid utilisé" : "Pas de layout moderne détecté",
  });
  if (!hasFlexGrid) suggestions.push("Utiliser Flexbox ou CSS Grid pour un layout moderne et responsive");

  // 4. Responsive
  const hasMediaQuery = /@media/i.test(html) || html.includes("viewport");
  const hasMetaViewport = html.includes("viewport");
  const responsiveScore = (hasMediaQuery ? 60 : 20) + (hasMetaViewport ? 40 : 10);
  metrics.push({
    name: "Responsive",
    score: Math.min(responsiveScore, 100),
    detail: hasMediaQuery ? "Media queries détectées" : "Aucune media query trouvée",
  });
  if (!hasMediaQuery) suggestions.push("Ajouter des media queries pour le responsive mobile");
  if (!hasMetaViewport) suggestions.push("Ajouter la balise meta viewport");

  const score = Math.round(metrics.reduce((acc, m) => acc + m.score, 0) / metrics.length);
  return { score, metrics, suggestions };
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });

    let targetUrl = url;
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CSScan/1.0)",
      },
    });
    clearTimeout(timeout);

    const html = await response.text();
    const result = analyzeHtml(html);

    return NextResponse.json(result);
  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json({ error: "Timeout — le site met trop de temps à répondre" }, { status: 408 });
    }
    return NextResponse.json({ error: "Impossible d'accéder au site : " + err.message }, { status: 500 });
  }
}
