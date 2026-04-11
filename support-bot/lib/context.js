const config = require('../config');

async function fetchJson(url) {
  const fetch = (await import('node-fetch')).default;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchJsonWithAuth(url, userId) {
  const fetch = (await import('node-fetch')).default;
  try {
    const res = await fetch(url, {
      headers: {
        'X-Internal-Service-Key': config.internalServiceKey,
        'X-Service-User-Id': userId,
      },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function lookupOrder(orderId, userId) {
  const order = await fetchJsonWithAuth(
    `${config.orderServiceUrl}/orders/${orderId}`,
    userId
  );
  if (!order) return { error: 'Order not found' };
  return {
    id: order.id,
    status: order.status,
    total: order.total,
    items: order.items,
    date: order.date || order.createdAt,
    trackingNumber: order.trackingNumber || null,
  };
}

async function searchUserOrders(userId, status) {
  let url = `${config.orderServiceUrl}/orders?limit=5`;
  if (status) url += `&status=${status}`;
  const orders = await fetchJsonWithAuth(url, userId);
  if (!orders || !Array.isArray(orders)) return { orders: [], message: 'No orders found' };
  return {
    orders: orders.slice(0, 5).map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      date: o.date || o.createdAt,
      itemCount: o.items?.length || 0,
      firstItem: o.items?.[0]?.productName || 'Unknown item',
    })),
  };
}

async function lookupProduct(productId) {
  const product = await fetchJson(`${config.productServiceUrl}/products/${productId}`);
  if (!product) return { error: 'Product not found' };
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    inStock: product.inStock,
    category: product.category,
    description: product.description,
    specifications: product.specifications || {},
    sellerName: product.sellerName || null,
  };
}

async function fetchContext(conversationId, userId, redis) {
  const context = { category: null, product: null };
  try {
    const meta = await redis.hgetall(`support:meta:${conversationId}`);
    if (meta && Object.keys(meta).length > 0) {
      context.category = meta.category || null;
      if (meta.productId) {
        context.product = {
          id: meta.productId,
          name: meta.productName || 'Unknown',
          price: parseFloat(meta.productPrice) || 0,
        };
      }
    }
  } catch (err) {
    console.error('Failed to fetch context:', err.message);
  }
  return context;
}

module.exports = { lookupOrder, searchUserOrders, lookupProduct, fetchContext };
