const roundCurrency = (value) => Number(Number(value || 0).toFixed(2));

const getMarginPercent = (product) => {
  const margin = Number(product?.margin || 0);
  return Number.isFinite(margin) ? margin : 0;
};

const getApplicableBasePrice = (product, quantity) => {
  const parsedQuantity = Number(quantity);
  const moq = Number(product?.moq || 1);

  if (parsedQuantity < moq) {
    throw new Error(`Minimum order is ${product.moq}`);
  }

  let applicablePrice = Number(product?.basePrice || 0);

  if (product?.pricingTiers && product.pricingTiers.length) {
    const sorted = [...product.pricingTiers].sort((a, b) => b.minQty - a.minQty);

    for (const tier of sorted) {
      if (parsedQuantity >= tier.minQty) {
        applicablePrice = Number(tier.price || applicablePrice);
        break;
      }
    }
  }

  return applicablePrice;
};

const getUnitPrice = (product, quantity) => {
  const basePrice = getApplicableBasePrice(product, quantity);
  const marginPercent = getMarginPercent(product);

  return roundCurrency(basePrice * (1 + marginPercent / 100));
};

const getDisplayPrice = (product) => {
  const defaultQuantity = Math.max(Number(product?.moq || 1), 1);
  return getUnitPrice(product, defaultQuantity);
};

const calculatePrice = (product, quantity) => {
  const parsedQuantity = Number(quantity);
  return roundCurrency(getUnitPrice(product, parsedQuantity) * parsedQuantity);
};

exports.calculatePrice = calculatePrice;
exports.getDisplayPrice = getDisplayPrice;
exports.getUnitPrice = getUnitPrice;
