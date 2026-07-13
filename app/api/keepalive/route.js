import { createClient } from '@supabase/supabase-js';

// Este endpoint no hace nada visible para el usuario.
// Su único propósito es tocar la base de datos todos los días
// para que Supabase nunca la considere "inactiva" y la pause.
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { count, error } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }
    return Response.json({
      ok: true,
      mensaje: 'Chiller System - keepalive OK',
      productos: count,
      fecha: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
