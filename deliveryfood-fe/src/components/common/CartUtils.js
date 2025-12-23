export const formatCurrency = (v) => {
  const n = Number(v || 0);
  try {
    return n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  } catch {
    return `${n} đ`;
  }
};

export const getItemId = (it) => it?.id || it?._id;
export const getItemName = (it, idx) =>
  it?.menuTitle || it?.menuItem?.title || it?.menuItem?.name || it?.name || `Món #${idx + 1}`;

export const getItemImage = (it) =>
  it?.menuImage || it?.menuItem?.image || it?.menuItem?.thumbnail || it?.image || "https://placehold.co/64x64?text=🍽️";

export const getUnitPrice = (it) => {
  const base =
    it?.basePrice ??
    it?.menuItem?.basePrice ??
    it?.menuItem?.price ??
    it?.menu?.basePrice ??
    it?.menu?.unitPrice ??
    it?.price ??
    0;
  const opts = Array.isArray(it?.selectedOptions) ? it.selectedOptions : [];
  const delta = opts.reduce((s, op) => s + Number(op?.priceDelta ?? op?.price_delta ?? 0), 0);
  return Number(base) + delta;
};

export const imgSrc = (img) => (typeof img === "string" ? img : img?.url || img?.secure_url || null);

export const restaurantIdOf = (it) => {
  if (it?.restaurantId) return String(it.restaurantId);
  const r =
    (it?.menuItem?.menu?.restaurant && typeof it.menuItem.menu.restaurant === "object" && it.menuItem.menu.restaurant) ||
    (it?.menuItem?.restaurant && typeof it.menuItem.restaurant === "object" && it.menuItem.restaurant) ||
    (it?.menu?.restaurant && typeof it.menu.restaurant === "object" && it.menu.restaurant) ||
    null;
  return (r?._id || r?.id || "unknown").toString();
};

export const restaurantNameOf = (it) => {
  if (it?.restaurantName) return it.restaurantName;
  const r =
    (it?.menuItem?.menu?.restaurant && typeof it.menuItem.menu.restaurant === "object" && it.menuItem.menu.restaurant) ||
    (it?.menuItem?.restaurant && typeof it.menuItem.restaurant === "object" && it.menuItem.restaurant) ||
    (it?.menu?.restaurant && typeof it.menu.restaurant === "object" && it.menu.restaurant) ||
    null;
  return r?.name || it?.restaurantName || "Nhà hàng";
};

export const restaurantInfoOf = (it) => {
  if (it?.restaurantId || it?.restaurantName || it?.restaurantImage) {
    return {
      id: String(it.restaurantId || "unknown"),
      name: it.restaurantName || "Nhà hàng",
      image: it.restaurantImage || null,
      address: it.restaurantAddress || "",
      isOpen: !!it.restaurantIsOpen,
    };
  }
  const r =
    (it?.menuItem?.menu?.restaurant && typeof it.menuItem.menu.restaurant === "object" && it.menuItem.menu.restaurant) ||
    (it?.menuItem?.restaurant && typeof it.menuItem.restaurant === "object" && it.menuItem.restaurant) ||
    (it?.menu?.restaurant && typeof it.menu.restaurant === "object" && it.menu.restaurant) ||
    null;
  const id = restaurantIdOf(it);
  const name = restaurantNameOf(it);
  const image = (r && (r.image || r.logo || r.photos?.[0])) || it?.restaurantImage || null;
  const address = (r && r.address) || it?.restaurantAddress || "";
  const isOpen = !!(r && r.isOpen);
  return { id, name, image, address, isOpen };
};

export const groupSubtotal = (group) =>
  group.items.reduce((s, it) => s + getUnitPrice(it) * Number(it.quantity || 0), 0);