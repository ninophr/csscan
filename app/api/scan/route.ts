import { NextRequest, NextResponse } from "next/server";
import { scanUrl } from "@/lib/scanner";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });

    const result = await scanUrl(url);
    return NextResponse.json(result);
  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json({ error: "Timeout — le site met trop de temps à répondre" }, { status: 408 });
    }
    return NextResponse.json({ error: "Impossible d'accéder au site : " + err.message }, { status: 500 });
  }
}
