require('dotenv').config();

const sequelize = require('./src/config/database');
const Product = require('./src/models/Product');

const existingImages = [
  '1775892827606.jpg',
  '1775892918986.jpg',
  '1775893278248.jpg',
  '1775898202721.jpg',
  '1776600861510-8dzijuf5l.jpg',
  '1776600861512-6tr9kocqt.jpg',
  '1776600861512-7e5zigd2a.jpg',
  '1776601155887-kf06kv6nj.jpg',
  '1776601155888-50m1omt8m.jpg',
  '1776601155888-ysqwmpwsy.jpg',
  '1776688063953-pj2dzt4t2.jpg',
  '1776688063961-dmgtznr2x.jpg',
  '1776688063961-rji99qs70.jpg',
  '1776688063961-xptpswv5u.jpg',
  '1776690910026-87xt4h31y.jpg',
  '1776690910033-08joyq73w.jpg',
  '1776690910034-0pbu8fcwl.jpg',
  '1776690910034-15vkgaxj1.jpg',
  '1776690910034-pf11gvvem.jpg',
  '1776693081751-31sfthtmc.jpg'
];

const productTemplates = [
  { name: 'Stainless Steel Rod', category: 'Metals', moq: 10, stock: 120, basePrice: 75.5 },
  { name: 'Copper Wire Coil', category: 'Cables', moq: 50, stock: 220, basePrice: 120.0 },
  { name: 'Aluminium Sheet', category: 'Sheet Metal', moq: 20, stock: 180, basePrice: 95.0 },
  { name: 'Industrial PVC Pipe', category: 'Pipes', moq: 30, stock: 260, basePrice: 42.0 },
  { name: 'Hydraulic Valve', category: 'Hydraulics', moq: 5, stock: 95, basePrice: 190.0 },
  { name: 'Ball Bearing Set', category: 'Bearings', moq: 15, stock: 145, basePrice: 67.0 },
  { name: 'Electric Motor', category: 'Motors', moq: 4, stock: 60, basePrice: 550.0 },
  { name: 'LED Floodlight', category: 'Lighting', moq: 25, stock: 230, basePrice: 82.0 },
  { name: 'Solar Panel 250W', category: 'Energy', moq: 8, stock: 75, basePrice: 925.0 },
  { name: 'Safety Helmet', category: 'Safety Gear', moq: 40, stock: 300, basePrice: 22.0 },
  { name: 'Welding Machine', category: 'Welding', moq: 2, stock: 34, basePrice: 1380.0 },
  { name: 'Forklift Tire', category: 'Tires', moq: 6, stock: 110, basePrice: 210.0 },
  { name: 'Packaging Box', category: 'Packaging', moq: 100, stock: 1200, basePrice: 8.5 },
  { name: 'Pallet Rack Beam', category: 'Storage', moq: 12, stock: 86, basePrice: 145.0 },
  { name: 'Crane Hook', category: 'Rigging', moq: 3, stock: 46, basePrice: 345.0 },
  { name: 'Control Panel', category: 'Automation', moq: 1, stock: 28, basePrice: 1280.0 },
  { name: 'Compressor Filter', category: 'Air Systems', moq: 25, stock: 210, basePrice: 32.0 },
  { name: 'Lubricant Oil 20L', category: 'Lubricants', moq: 10, stock: 150, basePrice: 75.0 },
  { name: 'Heat Exchanger', category: 'HVAC', moq: 1, stock: 16, basePrice: 2350.0 },
  { name: 'Chemical Drum', category: 'Chemicals', moq: 5, stock: 55, basePrice: 245.0 },
  { name: 'Drill Bit Pack', category: 'Tools', moq: 20, stock: 290, basePrice: 48.0 },
  { name: 'Fastener Pack', category: 'Fasteners', moq: 50, stock: 900, basePrice: 18.0 },
  { name: 'Insulation Board', category: 'Insulation', moq: 15, stock: 140, basePrice: 68.0 },
  { name: 'Water Pump', category: 'Pumps', moq: 3, stock: 52, basePrice: 225.0 },
  { name: 'Steel Plate', category: 'Plate', moq: 12, stock: 94, basePrice: 135.0 },
  { name: 'Gas Cylinder', category: 'Gases', moq: 4, stock: 33, basePrice: 310.0 },
  { name: 'Power Adapter', category: 'Electronics', moq: 10, stock: 150, basePrice: 22.0 },
  { name: 'Pressure Gauge', category: 'Instrumentation', moq: 8, stock: 72, basePrice: 54.0 },
  { name: 'Motor Starter', category: 'Electrical', moq: 3, stock: 40, basePrice: 285.0 },
  { name: 'Chain Hoist', category: 'Lifting', moq: 2, stock: 38, basePrice: 410.0 },
  { name: 'Engine Oil 5L', category: 'Automotive', moq: 12, stock: 200, basePrice: 38.5 },
  { name: 'Crane Cable', category: 'Cables', moq: 6, stock: 58, basePrice: 155.0 },
  { name: 'Round Steel Bar', category: 'Metals', moq: 10, stock: 130, basePrice: 98.0 },
  { name: 'Flat Steel Bar', category: 'Metals', moq: 10, stock: 95, basePrice: 88.0 },
  { name: 'Gear Rack', category: 'Transmission', moq: 5, stock: 52, basePrice: 160.0 },
  { name: 'Industrial Fan', category: 'Ventilation', moq: 2, stock: 30, basePrice: 520.0 },
  { name: 'Welding Rod', category: 'Welding', moq: 20, stock: 240, basePrice: 29.0 },
  { name: 'Sanitary Valve', category: 'Plumbing', moq: 8, stock: 74, basePrice: 132.0 },
  { name: 'Fiber Optic Cable', category: 'Communications', moq: 20, stock: 120, basePrice: 210.0 },
  { name: 'Heat Seal Machine', category: 'Packaging', moq: 1, stock: 14, basePrice: 1880.0 },
  { name: 'Dust Collector', category: 'Air Systems', moq: 1, stock: 18, basePrice: 2820.0 },
  { name: 'Inspection Camera', category: 'Inspection', moq: 1, stock: 26, basePrice: 450.0 },
  { name: 'Floor Scale', category: 'Measurement', moq: 1, stock: 20, basePrice: 930.0 },
  { name: 'Safety Vest', category: 'Safety Gear', moq: 40, stock: 320, basePrice: 12.5 },
  { name: 'Cable Tray', category: 'Electrical', moq: 20, stock: 190, basePrice: 75.0 },
  { name: 'Process Controller', category: 'Automation', moq: 1, stock: 10, basePrice: 1120.0 },
  { name: 'Wrench Set', category: 'Tools', moq: 10, stock: 134, basePrice: 65.0 },
  { name: 'Cable Connector Kit', category: 'Electronics', moq: 25, stock: 240, basePrice: 21.0 },
  { name: 'Vacuum Pump', category: 'Pumps', moq: 1, stock: 15, basePrice: 1240.0 },
  { name: 'Heat Resistant Tape', category: 'Insulation', moq: 30, stock: 310, basePrice: 14.0 },
  { name: 'Smart Sensor', category: 'IoT', moq: 10, stock: 60, basePrice: 175.0 }
];

const getImageSet = (index) => {
  const start = index % existingImages.length;
  const size = 1 + (index % 3);
  const images = [];

  for (let i = 0; i < size; i += 1) {
    images.push(existingImages[(start + i) % existingImages.length]);
  }

  return images;
};

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const existingCount = await Product.count();
    const targetCount = 50;
    const toCreate = Math.max(0, targetCount - existingCount);

    if (toCreate === 0) {
      console.log(`Already have ${existingCount} products. No seeding needed.`);
      process.exit(0);
    }

    const products = [];
    for (let i = 0; i < toCreate; i += 1) {
      const template = productTemplates[i % productTemplates.length];
      const suffix = existingCount + i + 1;
      products.push({
        name: `${template.name} ${suffix}`,
        description: `High-quality ${template.category.toLowerCase()} for industrial applications.`,
        category: template.category,
        moq: template.moq,
        stock: template.stock,
        basePrice: template.basePrice,
        margin: 0,
        finalPrice: template.basePrice,
        pricingTiers: null,
        images: getImageSet(i),
        vendorId: null
      });
    }

    await Product.bulkCreate(products);
    console.log(`Inserted ${toCreate} new products. Total product count is now at least ${targetCount}.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
