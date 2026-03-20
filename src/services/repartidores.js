import { supabase } from '../lib/supabase.js';

/**
 * Devuelve todos los repartidores activos ordenados por nombre.
 */
export async function getRepartidores() {
  const { data, error } = await supabase
    .from('repartidores')
    .select('*')
    .eq('activo', true)
    .order('nombre');
  if (error) throw error;
  return data;
}

/**
 * Devuelve un repartidor por su id (activo o no).
 */
export async function getRepartidorById(id) {
  const { data, error } = await supabase
    .from('repartidores')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Crea un nuevo repartidor.
 * @param {{ nombre: string, telefono?: string, vehiculo?: string, zona?: string }} data
 */
export async function createRepartidor(data) {
  const { data: created, error } = await supabase
    .from('repartidores')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return created;
}

/**
 * Actualiza los campos de un repartidor existente.
 * @param {string} id
 * @param {Partial<{ nombre: string, telefono: string, vehiculo: string, zona: string, activo: boolean }>} data
 */
export async function updateRepartidor(id, data) {
  const { data: updated, error } = await supabase
    .from('repartidores')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return updated;
}

/**
 * Soft delete: marca el repartidor como inactivo en lugar de eliminarlo.
 * @param {string} id
 */
export async function deleteRepartidor(id) {
  const { data, error } = await supabase
    .from('repartidores')
    .update({ activo: false })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Devuelve todos los repartidores activos con el conteo de pedidos
 * asignados hoy (por fecha de created_at o campo fecha si existe).
 */
export async function getRepartidoresConPedidosHoy() {
  const hoy = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

  const { data, error } = await supabase
    .from('repartidores')
    .select(`
      *,
      pedidos!pedidos_repartidor_id_fkey(
        id,
        created_at,
        fecha
      )
    `)
    .eq('activo', true)
    .order('nombre');
  if (error) throw error;

  return data.map(r => {
    const pedidosHoy = (r.pedidos ?? []).filter(p => {
      const fechaPedido = p.fecha ?? p.created_at?.slice(0, 10);
      return fechaPedido === hoy;
    });
    const { pedidos: _, ...repartidor } = r;
    return { ...repartidor, pedidos_hoy: pedidosHoy.length };
  });
}
