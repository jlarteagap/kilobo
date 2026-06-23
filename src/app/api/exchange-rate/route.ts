// app/api/exchange-rate/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://bo.dolarapi.com/v1/dolares/binance', {
      next: { revalidate: 300 }, // 5 min CDN cache
    })

    if (!res.ok) {
      throw new Error(`dolarapi responded with ${res.status}`)
    }

    const data = await res.json()

    return NextResponse.json({
      USD: data.venta,  // precio de venta como referencia
      updatedAt: data.fechaActualizacion ?? new Date().toISOString(),
    })
  } catch {
    // Fallback: devolver rate hardcodeado si la API falla
    return NextResponse.json({
      USD: 6.96,
      updatedAt: new Date().toISOString(),
    })
  }
}
