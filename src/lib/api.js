import { supabase } from './supabase.js';

// ─── Productos ────────────────────────────────────────────────────────────────

export async function getProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre');
  if (error) throw error;
  return data;
}

export async function addProducto(data) {
  const { data: created, error } = await supabase
    .from('productos')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function updateProducto(id, data) {
  const { data: updated, error } = await supabase
    .from('productos')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return updated;
}

export async function deleteProducto(id) {
  const { error } = await supabase.from('productos').delete().eq('id', id);
  if (error) throw error;
}

// ─── Clientes ────────────────────────────────────────────────────────────────

export async function getClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre');
  if (error) throw error;
  return data;
}

export async function addCliente(data) {
  const { data: created, error } = await supabase
    .from('clientes')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function deleteCliente(id) {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw error;
}

// ─── Pedidos ─────────────────────────────────────────────────────────────────

export async function getPedidos() {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, clientes(nombre), pedido_items(cantidad, precio_unitario)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPedidosByCliente(clienteId) {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, clientes(nombre), pedido_items(cantidad, precio_unitario)')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addPedido(clienteData, itemsArray) {
  // 1. Crear el pedido
  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos')
    .insert(clienteData)
    .select()
    .single();
  if (pedidoError) throw pedidoError;

  // 2. Insertar los items
  const itemsConPedido = itemsArray.map(item => ({ ...item, pedido_id: pedido.id }));
  const { data: items, error: itemsError } = await supabase
    .from('pedido_items')
    .insert(itemsConPedido)
    .select();
  if (itemsError) throw itemsError;

  // 3. Descontar stock (UPDATE atómico vía RPC, sin race condition)
  for (const item of itemsArray) {
    const { error: stockError } = await supabase.rpc('decrement_stock', {
      p_producto_id: item.producto_id,
      p_cantidad:    item.cantidad,
    });
    if (stockError) throw stockError;
  }

  return { pedido, items };
}

export async function updateEstadoPedido(id, estado) {
  const { data, error } = await supabase
    .from('pedidos')
    .update({ estado })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePedido(id, pedidoData, itemsArray) {
  const { error: pedidoError } = await supabase.from('pedidos').update(pedidoData).eq('id', id);
  if (pedidoError) throw pedidoError;
  await supabase.from('pedido_items').delete().eq('pedido_id', id);
  const { error: itemsError } = await supabase.from('pedido_items')
    .insert(itemsArray.map(item => ({ ...item, pedido_id: id })));
  if (itemsError) throw itemsError;
}

export async function deletePedido(id) {
  await supabase.from('pedido_items').delete().eq('pedido_id', id);
  const { error } = await supabase.from('pedidos').delete().eq('id', id);
  if (error) throw error;
}

// ─── Pedido items ─────────────────────────────────────────────────────────────

export async function getPedidoItems(pedidoId) {
  const { data, error } = await supabase
    .from('pedido_items')
    .select('*, productos(nombre, categoria)')
    .eq('pedido_id', pedidoId);
  if (error) throw error;
  return data;
}

// ─── Repartidores ─────────────────────────────────────────────────────────────

export async function getRepartidores() {
  const { data, error } = await supabase
    .from('repartidores')
    .select('*')
    .order('nombre');
  if (error) throw error;
  return data;
}

export async function addRepartidor(data) {
  const { data: created, error } = await supabase
    .from('repartidores')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return created;
}

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

export async function deleteRepartidor(id) {
  const { error } = await supabase.from('repartidores').delete().eq('id', id);
  if (error) throw error;
}

export async function asignarRepartidor(pedidoId, repartidorId) {
  const { data, error } = await supabase
    .from('pedidos')
    .update({ repartidor_id: repartidorId, estado_entrega: 'en_ruta' })
    .eq('id', pedidoId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEstadoEntrega(pedidoId, estado_entrega) {
  const { data, error } = await supabase
    .from('pedidos')
    .update({ estado_entrega })
    .eq('id', pedidoId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Stock ────────────────────────────────────────────────────────────────────

export async function getStockBajo() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .lt('stock', 10)
    .order('stock');
  if (error) throw error;
  return data;
}
