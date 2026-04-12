exports.calculatePrice = (product, quantity) => {
  if (quantity < product.moq) {
    throw new Error(`Minimum order is ${product.moq}`);
  }

  let applicablePrice = product.basePrice;

  if (product.pricingTiers && product.pricingTiers.length) {
    const sorted = product.pricingTiers.sort((a, b) => b.minQty - a.minQty);

    for (let tier of sorted) {
      if (quantity >= tier.minQty) {
        applicablePrice = tier.price;
        break;
      }
    }
  }

  return applicablePrice * quantity;
};