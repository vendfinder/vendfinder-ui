import { Product } from '@/types';

export const products: Product[] = [
  // Sneakers
  {
    id: '1',
    slug: 'air-jordan-4-retro-bred',
    name: 'Air Jordan 4 Retro Bred',
    description:
      'The iconic AJ4 in the classic Bred colorway. Premium leather upper with visible Air unit.',
    longDescription:
      "The Air Jordan 4 Retro 'Bred' brings back one of the most legendary colorways in sneaker history. Featuring a black nubuck upper with cement grey accents and fire red highlights, this shoe stays true to the 1989 original. The visible Air-Sole unit in the heel provides responsive cushioning, while the mesh inserts offer breathability for all-day wear.",
    price: 215,
    compareAtPrice: 250,
    images: ['/images/products/aj4-bred-1.jpg'],
    category: 'sneakers',
    tags: ['jordan', 'retro', 'bred', 'featured'],
    rating: 4.8,
    reviewCount: 124,
    inStock: true,
    stockCount: 12,
    sku: 'SNK-AJ4-BRD',
    features: [
      'Premium nubuck leather upper',
      'Visible Air-Sole unit',
      'Mesh side panels',
      'Rubber outsole with herringbone pattern',
    ],
    specifications: {
      Brand: 'Nike',
      Style: 'Air Jordan 4 Retro',
      Color: 'Black/Cement Grey/Fire Red',
      Release: '2024',
    },
    sizes: [
      '7',
      '7.5',
      '8',
      '8.5',
      '9',
      '9.5',
      '10',
      '10.5',
      '11',
      '11.5',
      '12',
      '13',
    ],
    createdAt: '2024-09-15',
  },
  {
    id: '2',
    slug: 'nike-dunk-low-panda',
    name: 'Nike Dunk Low Panda',
    description:
      'Clean black and white colorway that goes with everything. A modern classic.',
    longDescription:
      "The Nike Dunk Low 'Panda' features a crisp black and white leather upper that has become one of the most popular sneakers of the decade. Originally designed as a basketball shoe in 1985, the Dunk has evolved into a streetwear staple. The padded collar and rubber cupsole provide comfort for daily wear.",
    price: 115,
    images: ['/images/products/dunk-panda-1.jpg'],
    category: 'sneakers',
    tags: ['nike', 'dunk', 'panda', 'featured'],
    rating: 4.6,
    reviewCount: 89,
    inStock: true,
    stockCount: 25,
    sku: 'SNK-DNK-PND',
    features: [
      'Leather upper',
      'Padded collar',
      'Rubber cupsole',
      'Perforated toe box',
    ],
    specifications: {
      Brand: 'Nike',
      Style: 'Dunk Low',
      Color: 'Black/White',
      Release: '2024',
    },
    sizes: [
      '6',
      '6.5',
      '7',
      '7.5',
      '8',
      '8.5',
      '9',
      '9.5',
      '10',
      '10.5',
      '11',
      '12',
    ],
    createdAt: '2024-10-01',
  },
  {
    id: '3',
    slug: 'new-balance-550-white-green',
    name: 'New Balance 550 White Green',
    description:
      'Retro basketball silhouette with a clean white and green colorway.',
    longDescription:
      'The New Balance 550 revives a classic 1989 basketball design with modern styling. This White/Green colorway features a premium leather upper with perforated detailing, a flat rubber outsole, and the signature N logo in forest green. A versatile sneaker that bridges the gap between sport and style.',
    price: 130,
    images: ['/images/products/nb550-wg-1.jpg'],
    category: 'sneakers',
    tags: ['new-balance', 'retro', 'basketball'],
    rating: 4.5,
    reviewCount: 56,
    inStock: true,
    stockCount: 18,
    sku: 'SNK-NB550-WG',
    features: [
      'Premium leather upper',
      'Flat rubber outsole',
      'Perforated side panels',
      'Padded tongue and collar',
    ],
    specifications: {
      Brand: 'New Balance',
      Style: '550',
      Color: 'White/Green',
      Release: '2024',
    },
    sizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '12'],
    createdAt: '2024-08-20',
  },
  {
    id: '4',
    slug: 'adidas-yeezy-slide-onyx',
    name: 'Adidas Yeezy Slide Onyx',
    description:
      'Minimalist EVA foam slide in sleek Onyx black. Ultimate comfort.',
    longDescription:
      'The Adidas Yeezy Slide in Onyx delivers a minimalist aesthetic with maximum comfort. Crafted from lightweight injected EVA foam, these slides feature a soft footbed and a serrated outsole for traction. The monochrome black colorway makes them a versatile choice for casual wear.',
    price: 70,
    compareAtPrice: 90,
    images: ['/images/products/yeezy-slide-1.jpg'],
    category: 'sneakers',
    tags: ['adidas', 'yeezy', 'slides'],
    rating: 4.3,
    reviewCount: 201,
    inStock: true,
    stockCount: 40,
    sku: 'SNK-YZY-SLD',
    features: [
      'Injected EVA foam construction',
      'Soft footbed',
      'Serrated outsole',
      'Lightweight design',
    ],
    specifications: {
      Brand: 'Adidas',
      Style: 'Yeezy Slide',
      Color: 'Onyx',
      Release: '2024',
    },
    sizes: ['6', '7', '8', '9', '10', '11', '12', '13'],
    createdAt: '2024-07-10',
  },
  {
    id: '5',
    slug: 'nike-air-max-90-infrared',
    name: 'Nike Air Max 90 Infrared',
    description:
      'The OG Air Max 90 in the iconic Infrared colorway. Timeless design.',
    longDescription:
      'The Nike Air Max 90 Infrared is one of the most important sneakers ever created. This reissue stays faithful to the 1990 original with its layered upper of mesh, leather, and synthetic materials. The visible Max Air unit in the heel revolutionized sneaker design, and the Infrared accents remain one of the most recognizable color schemes in footwear.',
    price: 140,
    images: ['/images/products/am90-infrared-1.jpg'],
    category: 'sneakers',
    tags: ['nike', 'air-max', 'retro'],
    rating: 4.7,
    reviewCount: 178,
    inStock: true,
    stockCount: 8,
    sku: 'SNK-AM90-INF',
    features: [
      'Mixed material upper',
      'Visible Max Air unit',
      'Rubber waffle outsole',
      'Padded collar',
    ],
    specifications: {
      Brand: 'Nike',
      Style: 'Air Max 90',
      Color: 'White/Black/Infrared',
      Release: '2024',
    },
    sizes: [
      '7',
      '7.5',
      '8',
      '8.5',
      '9',
      '9.5',
      '10',
      '10.5',
      '11',
      '11.5',
      '12',
      '13',
    ],
    createdAt: '2024-11-05',
  },
  // Electronics
  {
    id: '6',
    slug: 'sony-wh1000xm5-headphones',
    name: 'Sony WH-1000XM5 Headphones',
    description:
      'Industry-leading noise cancelling wireless headphones with exceptional sound.',
    longDescription:
      'The Sony WH-1000XM5 sets the standard for premium noise-cancelling headphones. With eight microphones and two processors for unparalleled noise cancellation, 30-hour battery life, and exceptional audio quality with LDAC support, these headphones deliver an immersive listening experience. The lightweight design and soft-fit leather earpads ensure all-day comfort.',
    price: 348,
    compareAtPrice: 400,
    images: ['/images/products/sony-xm5-1.jpg'],
    category: 'electronics',
    tags: ['sony', 'headphones', 'audio', 'featured'],
    rating: 4.9,
    reviewCount: 312,
    inStock: true,
    stockCount: 15,
    sku: 'ELC-SNY-XM5',
    features: [
      'Industry-leading noise cancellation',
      '30-hour battery life',
      'LDAC Hi-Res Audio',
      'Multipoint connection',
    ],
    specifications: {
      Brand: 'Sony',
      Type: 'Over-ear wireless',
      Driver: '30mm',
      Weight: '250g',
    },
    createdAt: '2024-06-15',
  },
  {
    id: '7',
    slug: 'apple-airpods-pro-2',
    name: 'Apple AirPods Pro 2',
    description:
      'Active noise cancellation, spatial audio, and USB-C charging case.',
    longDescription:
      'AirPods Pro 2 deliver up to 2x more active noise cancellation than the previous generation. With Adaptive Transparency, personalized Spatial Audio, and a custom-built driver for incredible sound quality, these earbuds are perfect for music, calls, and everything in between. The MagSafe charging case provides up to 6 hours of listening time with a single charge.',
    price: 199,
    images: ['/images/products/airpods-pro-1.jpg'],
    category: 'electronics',
    tags: ['apple', 'airpods', 'audio'],
    rating: 4.7,
    reviewCount: 498,
    inStock: true,
    stockCount: 30,
    sku: 'ELC-APL-APP2',
    features: [
      'Active Noise Cancellation',
      'Adaptive Transparency',
      'Personalized Spatial Audio',
      'USB-C MagSafe case',
    ],
    specifications: {
      Brand: 'Apple',
      Type: 'In-ear wireless',
      Chip: 'H2',
      'Battery Life': '6 hours',
    },
    createdAt: '2024-09-20',
  },
  {
    id: '8',
    slug: 'samsung-galaxy-tab-s9',
    name: 'Samsung Galaxy Tab S9',
    description:
      'Premium Android tablet with AMOLED display and S Pen included.',
    longDescription:
      "The Samsung Galaxy Tab S9 features a stunning 11-inch Dynamic AMOLED 2X display with 120Hz refresh rate, the powerful Snapdragon 8 Gen 2 processor, and comes with the S Pen included. Water-resistant with an IP68 rating, this tablet is built for productivity, creativity, and entertainment. With 128GB storage and expandable microSD support, you'll never run out of space.",
    price: 649,
    compareAtPrice: 800,
    images: ['/images/products/tab-s9-1.jpg'],
    category: 'electronics',
    tags: ['samsung', 'tablet', 'featured'],
    rating: 4.6,
    reviewCount: 167,
    inStock: true,
    stockCount: 7,
    sku: 'ELC-SAM-TS9',
    features: [
      '11" Dynamic AMOLED 2X display',
      'S Pen included',
      'IP68 water resistant',
      'Snapdragon 8 Gen 2',
    ],
    specifications: {
      Brand: 'Samsung',
      Display: '11" AMOLED',
      Processor: 'Snapdragon 8 Gen 2',
      Storage: '128GB',
    },
    createdAt: '2024-10-10',
  },
  {
    id: '9',
    slug: 'jbl-charge-5-speaker',
    name: 'JBL Charge 5 Speaker',
    description:
      'Portable Bluetooth speaker with powerful bass and 20-hour battery.',
    longDescription:
      "The JBL Charge 5 delivers bold JBL Original Pro Sound with its optimized long-excursion driver and dual JBL bass radiators. IP67 waterproof and dustproof, it's built for any adventure. With 20 hours of playtime and a built-in powerbank to charge your devices, the Charge 5 is the ultimate portable speaker.",
    price: 140,
    images: ['/images/products/jbl-charge5-1.jpg'],
    category: 'electronics',
    tags: ['jbl', 'speaker', 'bluetooth'],
    rating: 4.5,
    reviewCount: 234,
    inStock: true,
    stockCount: 22,
    sku: 'ELC-JBL-CH5',
    features: [
      'JBL Original Pro Sound',
      'IP67 waterproof',
      '20-hour battery',
      'Built-in powerbank',
    ],
    specifications: {
      Brand: 'JBL',
      Type: 'Portable speaker',
      Connectivity: 'Bluetooth 5.1',
      Weight: '960g',
    },
    createdAt: '2024-08-01',
  },
  {
    id: '10',
    slug: 'meta-quest-3-vr-headset',
    name: 'Meta Quest 3 VR Headset',
    description:
      'Mixed reality headset with breakthrough graphics and immersive experiences.',
    longDescription:
      'Meta Quest 3 is the most powerful Quest yet, featuring the Snapdragon XR2 Gen 2 processor and a stunning 4K+ Infinite Display. With full-color passthrough and advanced mixed reality capabilities, you can seamlessly blend virtual content with your real environment. Access thousands of VR games, apps, and experiences with no PC required.',
    price: 499,
    images: ['/images/products/quest3-1.jpg'],
    category: 'electronics',
    tags: ['meta', 'vr', 'gaming'],
    rating: 4.4,
    reviewCount: 145,
    inStock: true,
    stockCount: 10,
    sku: 'ELC-MTA-QS3',
    features: [
      'Snapdragon XR2 Gen 2',
      '4K+ Infinite Display',
      'Full-color mixed reality',
      'No PC required',
    ],
    specifications: {
      Brand: 'Meta',
      Type: 'VR Headset',
      Processor: 'Snapdragon XR2 Gen 2',
      Storage: '128GB',
    },
    createdAt: '2024-11-01',
  },
  // Apparel
  {
    id: '11',
    slug: 'essentials-fear-of-god-hoodie',
    name: 'Essentials Fear of God Hoodie',
    description:
      'Oversized fleece hoodie with signature Essentials branding. Ultra cozy.',
    longDescription:
      "The Essentials Fear of God Hoodie embodies the brand's minimalist luxury aesthetic. Made from heavyweight fleece cotton with a relaxed, oversized fit, it features the signature rubber Essentials logo on the chest. The ribbed cuffs and hem, kangaroo pocket, and lined hood make it a premium wardrobe staple for any season.",
    price: 90,
    images: ['/images/products/fog-hoodie-1.jpg'],
    category: 'apparel',
    tags: ['essentials', 'hoodie', 'fog', 'featured'],
    rating: 4.7,
    reviewCount: 89,
    inStock: true,
    stockCount: 15,
    sku: 'STW-FOG-HDY',
    features: [
      'Heavyweight fleece cotton',
      'Oversized relaxed fit',
      'Rubber logo detail',
      'Kangaroo pocket',
    ],
    specifications: {
      Brand: 'Fear of God Essentials',
      Material: '100% Cotton',
      Fit: 'Oversized',
      Care: 'Machine wash cold',
    },
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    createdAt: '2024-09-01',
  },
  {
    id: '12',
    slug: 'nike-tech-fleece-joggers',
    name: 'Nike Tech Fleece Joggers',
    description:
      "Slim-fit joggers in Nike's signature Tech Fleece fabric. Warm without bulk.",
    longDescription:
      'Nike Tech Fleece Joggers deliver warmth without the weight. The innovative Tech Fleece fabric uses a foam layer sandwiched between two layers of jersey for lightweight insulation. The tapered leg, zippered pockets, and ribbed cuffs create a clean, modern silhouette that transitions seamlessly from the gym to the street.',
    price: 110,
    images: ['/images/products/nike-tech-1.jpg'],
    category: 'apparel',
    tags: ['nike', 'joggers', 'tech-fleece'],
    rating: 4.6,
    reviewCount: 203,
    inStock: true,
    stockCount: 20,
    sku: 'STW-NKE-TFJ',
    features: [
      'Nike Tech Fleece fabric',
      'Zippered pockets',
      'Tapered slim fit',
      'Ribbed cuffs',
    ],
    specifications: {
      Brand: 'Nike',
      Material: 'Tech Fleece',
      Fit: 'Slim tapered',
      Care: 'Machine wash',
    },
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    createdAt: '2024-10-15',
  },
  {
    id: '13',
    slug: 'supreme-box-logo-tee',
    name: 'Supreme Box Logo Tee',
    description:
      'The iconic Supreme box logo on premium cotton. A streetwear grail.',
    longDescription:
      "The Supreme Box Logo Tee is one of the most recognizable pieces in streetwear culture. This season's release features the classic box logo printed on a heavyweight 100% cotton tee. The relaxed fit and reinforced collar ensure durability and comfort. A must-have for any streetwear collection.",
    price: 68,
    images: ['/images/products/supreme-bogo-1.jpg'],
    category: 'apparel',
    tags: ['supreme', 'tee', 'box-logo'],
    rating: 4.4,
    reviewCount: 67,
    inStock: true,
    stockCount: 5,
    sku: 'STW-SPR-BOG',
    features: [
      'Heavyweight cotton',
      'Box logo print',
      'Reinforced collar',
      'Relaxed fit',
    ],
    specifications: {
      Brand: 'Supreme',
      Material: '100% Cotton',
      Fit: 'Relaxed',
      Care: 'Machine wash cold',
    },
    sizes: ['S', 'M', 'L', 'XL'],
    createdAt: '2024-07-20',
  },
  {
    id: '14',
    slug: 'stussy-8-ball-hoodie',
    name: 'Stussy 8 Ball Hoodie',
    description: 'Classic Stussy graphic hoodie with the iconic 8-ball design.',
    longDescription:
      "The Stussy 8 Ball Hoodie is a streetwear classic that has endured for decades. This midweight fleece pullover features the iconic 8-ball graphic on the back and a small Stussy logo on the chest. With a standard fit, kangaroo pocket, and ribbed trims, it's a timeless piece that belongs in every collection.",
    price: 85,
    compareAtPrice: 100,
    images: ['/images/products/stussy-8ball-1.jpg'],
    category: 'apparel',
    tags: ['stussy', 'hoodie', 'graphic'],
    rating: 4.5,
    reviewCount: 112,
    inStock: true,
    stockCount: 14,
    sku: 'STW-STY-8BL',
    features: [
      'Midweight fleece',
      'Iconic 8-ball graphic',
      'Kangaroo pocket',
      'Ribbed cuffs and hem',
    ],
    specifications: {
      Brand: 'Stussy',
      Material: '80% Cotton / 20% Polyester',
      Fit: 'Standard',
      Care: 'Machine wash',
    },
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    createdAt: '2024-08-15',
  },
  {
    id: '15',
    slug: 'carhartt-wip-detroit-jacket',
    name: 'Carhartt WIP Detroit Jacket',
    description:
      'Rugged organic cotton canvas jacket with blanket-lined interior.',
    longDescription:
      'The Carhartt WIP Detroit Jacket is a workwear icon reimagined for modern streetwear. Crafted from organic cotton canvas with a blanket-lined interior for warmth, it features a corduroy collar, adjustable hem, and double chest pockets. The relaxed fit allows for layering while maintaining a structured silhouette.',
    price: 225,
    images: ['/images/products/carhartt-detroit-1.jpg'],
    category: 'apparel',
    tags: ['carhartt', 'jacket', 'workwear'],
    rating: 4.8,
    reviewCount: 76,
    inStock: true,
    stockCount: 6,
    sku: 'STW-CRT-DET',
    features: [
      'Organic cotton canvas',
      'Blanket-lined interior',
      'Corduroy collar',
      'Double chest pockets',
    ],
    specifications: {
      Brand: 'Carhartt WIP',
      Material: 'Organic cotton canvas',
      Fit: 'Relaxed',
      Care: 'Machine wash cold',
    },
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    createdAt: '2024-10-20',
  },
  // Home & Living
  {
    id: '16',
    slug: 'ember-temperature-mug',
    name: 'Ember Temperature Control Mug',
    description:
      'Smart mug that keeps your drink at the perfect temperature for hours.',
    longDescription:
      'The Ember Mug 2 uses innovative temperature control technology to keep your hot beverage at your preferred drinking temperature for up to 1.5 hours on a single charge, or all day on the included charging coaster. Control everything from the Ember app — set your ideal temperature, receive notifications, and create presets.',
    price: 130,
    images: ['/images/products/ember-mug-1.jpg'],
    category: 'home-living',
    tags: ['ember', 'mug', 'smart-home'],
    rating: 4.3,
    reviewCount: 89,
    inStock: true,
    stockCount: 20,
    sku: 'HML-EMB-MG2',
    features: [
      'Temperature control technology',
      '1.5-hour battery life',
      'App controlled',
      'Charging coaster included',
    ],
    specifications: {
      Brand: 'Ember',
      Capacity: '10 oz',
      Material: 'Stainless steel',
      Connectivity: 'Bluetooth',
    },
    createdAt: '2024-06-01',
  },
  {
    id: '17',
    slug: 'philips-hue-starter-kit',
    name: 'Philips Hue Starter Kit',
    description:
      'Smart LED light bulbs with bridge. 16 million colors at your fingertips.',
    longDescription:
      'Transform your home lighting with the Philips Hue Starter Kit. Includes three A19 smart LED bulbs and the Hue Bridge for whole-home control. Choose from 16 million colors and shades of white to set the perfect mood. Works with Alexa, Google Home, and Apple HomeKit for seamless voice control.',
    price: 135,
    compareAtPrice: 170,
    images: ['/images/products/hue-kit-1.jpg'],
    category: 'home-living',
    tags: ['philips', 'smart-home', 'lighting', 'featured'],
    rating: 4.6,
    reviewCount: 256,
    inStock: true,
    stockCount: 12,
    sku: 'HML-PHI-HUE',
    features: [
      '16 million colors',
      'Voice assistant compatible',
      'Schedule automations',
      'Hue Bridge included',
    ],
    specifications: {
      Brand: 'Philips Hue',
      Type: 'LED Smart Bulbs',
      Count: '3 bulbs + bridge',
      Connectivity: 'Zigbee + Bluetooth',
    },
    createdAt: '2024-07-15',
  },
  {
    id: '18',
    slug: 'dyson-v15-detect-vacuum',
    name: 'Dyson V15 Detect Vacuum',
    description:
      'Cordless vacuum with laser dust detection and powerful suction.',
    longDescription:
      "The Dyson V15 Detect reveals dust you can't normally see with a precisely-angled laser on the Fluffy Optic cleaner head. An acoustic piezo sensor counts and sizes particles, automatically increasing suction power when needed. With up to 60 minutes of fade-free suction and advanced filtration, it's the most intelligent cordless vacuum yet.",
    price: 599,
    images: ['/images/products/dyson-v15-1.jpg'],
    category: 'home-living',
    tags: ['dyson', 'vacuum', 'cleaning'],
    rating: 4.7,
    reviewCount: 189,
    inStock: true,
    stockCount: 5,
    sku: 'HML-DYS-V15',
    features: [
      'Laser dust detection',
      'Piezo sensor auto-adjust',
      '60-min battery life',
      'HEPA filtration',
    ],
    specifications: {
      Brand: 'Dyson',
      Type: 'Cordless vacuum',
      'Run Time': 'Up to 60 min',
      Weight: '6.8 lbs',
    },
    createdAt: '2024-09-10',
  },
  {
    id: '19',
    slug: 'le-creuset-dutch-oven',
    name: 'Le Creuset Dutch Oven 5.5 Qt',
    description:
      'Iconic enameled cast iron Dutch oven. A kitchen essential for generations.',
    longDescription:
      "The Le Creuset Signature Round Dutch Oven is the brand's iconic piece, crafted from enameled cast iron for superior heat distribution and retention. The 5.5-quart capacity is perfect for feeding a family. The colorful exterior enamel resists chipping and cracking, while the sand-colored interior makes it easy to monitor food. Oven-safe up to 500°F.",
    price: 380,
    images: ['/images/products/lecreuset-do-1.jpg'],
    category: 'home-living',
    tags: ['le-creuset', 'cookware', 'kitchen'],
    rating: 4.9,
    reviewCount: 342,
    inStock: true,
    stockCount: 8,
    sku: 'HML-LCR-DO5',
    features: [
      'Enameled cast iron',
      'Superior heat distribution',
      'Oven safe to 500°F',
      'Lifetime warranty',
    ],
    specifications: {
      Brand: 'Le Creuset',
      Capacity: '5.5 Qt',
      Material: 'Enameled cast iron',
      Color: 'Flame Orange',
    },
    createdAt: '2024-05-20',
  },
  {
    id: '20',
    slug: 'sonos-one-speaker',
    name: 'Sonos One Smart Speaker',
    description:
      'Compact smart speaker with rich sound and built-in voice control.',
    longDescription:
      'Sonos One delivers impressively rich, room-filling sound in a compact design. With built-in Alexa and Google Assistant, you can play music, check the news, and control your smart home — all with your voice. Connect multiple Sonos speakers for whole-home audio. AirPlay 2 compatible for seamless streaming from Apple devices.',
    price: 199,
    images: ['/images/products/sonos-one-1.jpg'],
    category: 'home-living',
    tags: ['sonos', 'speaker', 'smart-home'],
    rating: 4.6,
    reviewCount: 198,
    inStock: true,
    stockCount: 16,
    sku: 'HML-SNS-ONE',
    features: [
      'Rich room-filling sound',
      'Built-in voice assistants',
      'AirPlay 2 compatible',
      'Multi-room capable',
    ],
    specifications: {
      Brand: 'Sonos',
      Type: 'Smart speaker',
      Connectivity: 'Wi-Fi, AirPlay 2',
      Weight: '4.4 lbs',
    },
    createdAt: '2024-08-05',
  },
  // Accessories
  {
    id: '21',
    slug: 'casio-g-shock-ga2100',
    name: 'Casio G-Shock GA-2100',
    description: 'Ultra-slim G-Shock with octagonal bezel. The CasiOak.',
    longDescription:
      "The Casio G-Shock GA-2100 — nicknamed 'CasiOak' for its resemblance to the iconic AP Royal Oak — features an ultra-slim carbon core guard structure. The octagonal bezel, double LED light, and shock-resistant design make it both stylish and rugged. Water-resistant to 200 meters with a 3-year battery life.",
    price: 99,
    images: ['/images/products/gshock-2100-1.jpg'],
    category: 'accessories',
    tags: ['casio', 'watch', 'g-shock', 'featured'],
    rating: 4.7,
    reviewCount: 267,
    inStock: true,
    stockCount: 25,
    sku: 'ACC-CSO-2100',
    features: [
      'Carbon core guard',
      'Shock resistant',
      '200m water resistant',
      '3-year battery',
    ],
    specifications: {
      Brand: 'Casio',
      Type: 'G-Shock GA-2100',
      Movement: 'Quartz',
      'Water Resistance': '200m',
    },
    createdAt: '2024-07-01',
  },
  {
    id: '22',
    slug: 'ray-ban-wayfarer-classic',
    name: 'Ray-Ban Wayfarer Classic',
    description:
      "The world's most iconic sunglasses. Timeless style since 1952.",
    longDescription:
      'The Ray-Ban Original Wayfarer is the most recognizable style in the history of sunglasses. Since 1952, the Wayfarer has been worn by cultural icons and remains a symbol of effortless cool. These feature the original Wayfarer shape with high-quality crystal green G-15 lenses that provide excellent clarity and UV protection.',
    price: 163,
    images: ['/images/products/rayban-way-1.jpg'],
    category: 'accessories',
    tags: ['ray-ban', 'sunglasses', 'wayfarer'],
    rating: 4.8,
    reviewCount: 456,
    inStock: true,
    stockCount: 30,
    sku: 'ACC-RBN-WAY',
    features: [
      'Crystal green G-15 lenses',
      '100% UV protection',
      'Acetate frame',
      'Metal hinges',
    ],
    specifications: {
      Brand: 'Ray-Ban',
      Model: 'RB2140 Wayfarer',
      Lens: 'Crystal Green G-15',
      Material: 'Acetate',
    },
    createdAt: '2024-06-20',
  },
  {
    id: '23',
    slug: 'herschel-retreat-backpack',
    name: 'Herschel Retreat Backpack',
    description:
      'Classic backpack with laptop sleeve and signature striped lining.',
    longDescription:
      "The Herschel Retreat Backpack is a refined version of the brand's classic mountaineering-inspired design. Featuring a durable EcoSystem fabric exterior, fleece-lined 15\" laptop sleeve, and the signature striped fabric liner, it's built for daily use. Magnetic strap closures and a drawstring top opening provide secure storage for all your essentials.",
    price: 80,
    images: ['/images/products/herschel-retreat-1.jpg'],
    category: 'accessories',
    tags: ['herschel', 'backpack', 'bag'],
    rating: 4.5,
    reviewCount: 134,
    inStock: true,
    stockCount: 18,
    sku: 'ACC-HRS-RET',
    features: [
      '15" laptop sleeve',
      'EcoSystem recycled fabric',
      'Magnetic strap closures',
      'Striped fabric liner',
    ],
    specifications: {
      Brand: 'Herschel',
      Type: 'Backpack',
      Volume: '19.5L',
      Material: 'EcoSystem fabric',
    },
    createdAt: '2024-09-05',
  },
  {
    id: '24',
    slug: 'apple-watch-se-2024',
    name: 'Apple Watch SE (2024)',
    description: 'Essential Apple Watch features at an accessible price point.',
    longDescription:
      "The Apple Watch SE (2024) brings essential Apple Watch features at an accessible price. Track your daily activity, workout with precision, and stay connected with calls and messages right from your wrist. With crash detection, fall detection, and Emergency SOS, it's also a powerful safety device. The swim-proof design and all-day battery life make it perfect for everyday use.",
    price: 249,
    images: ['/images/products/watch-se-1.jpg'],
    category: 'accessories',
    tags: ['apple', 'watch', 'wearable'],
    rating: 4.6,
    reviewCount: 321,
    inStock: true,
    stockCount: 14,
    sku: 'ACC-APL-WSE',
    features: [
      'Activity tracking',
      'Crash & fall detection',
      'Swim proof (50m)',
      'All-day battery life',
    ],
    specifications: {
      Brand: 'Apple',
      Type: 'Smartwatch',
      Display: 'OLED Retina',
      'Water Resistance': '50m',
    },
    createdAt: '2024-10-25',
  },
  {
    id: '25',
    slug: 'north-face-borealis-backpack',
    name: 'The North Face Borealis Backpack',
    description:
      'Versatile daypack with FlexVent suspension and laptop compartment.',
    longDescription:
      "The North Face Borealis is a versatile, durable daypack with a comfortable FlexVent suspension system. The updated design features a dedicated laptop compartment, a secondary compartment with an internal organization sleeve, and a front bungee system for extra storage. Made from 100% recycled nylon, it's built to last while reducing environmental impact.",
    price: 99,
    compareAtPrice: 110,
    images: ['/images/products/tnf-borealis-1.jpg'],
    category: 'accessories',
    tags: ['north-face', 'backpack', 'bag'],
    rating: 4.7,
    reviewCount: 287,
    inStock: true,
    stockCount: 22,
    sku: 'ACC-TNF-BOR',
    features: [
      'FlexVent suspension system',
      'Laptop compartment',
      '100% recycled nylon',
      'Front bungee system',
    ],
    specifications: {
      Brand: 'The North Face',
      Type: 'Daypack',
      Volume: '28L',
      Material: 'Recycled nylon',
    },
    createdAt: '2024-08-30',
  },
  // Collectibles
  {
    id: '26',
    slug: 'bearbrick-1000-kaws',
    name: 'BE@RBRICK KAWS 1000%',
    description:
      'Limited edition KAWS x Medicom collaboration figure. Art meets collectible.',
    longDescription:
      "The BE@RBRICK KAWS 1000% represents the pinnacle of designer toy collecting. This massive 70cm figure features KAWS' signature XX eyes and crossed-out motif on the iconic bear form. A collaboration between KAWS and Medicom Toy, this limited edition piece is both a work of art and a highly sought-after collectible.",
    price: 1200,
    images: ['/images/products/bearbrick-kaws-1.jpg'],
    category: 'collectibles',
    tags: ['bearbrick', 'kaws', 'figure', 'limited'],
    rating: 4.9,
    reviewCount: 23,
    inStock: true,
    stockCount: 2,
    sku: 'COL-BBR-KWS',
    features: [
      '1000% size (70cm)',
      'KAWS collaboration',
      'Limited edition',
      'Premium vinyl construction',
    ],
    specifications: {
      Brand: 'Medicom Toy x KAWS',
      Height: '70cm (27.6")',
      Material: 'Vinyl',
      Edition: 'Limited',
    },
    createdAt: '2024-11-10',
  },
  {
    id: '27',
    slug: 'pokemon-charizard-psa-10',
    name: 'Pokemon Charizard PSA 10',
    description:
      'Gem Mint PSA 10 graded Base Set Charizard. The holy grail of Pokemon cards.',
    longDescription:
      'This PSA 10 Gem Mint Charizard from the Pokemon Base Set is one of the most coveted trading cards in the hobby. Graded by Professional Sports Authenticator at the highest possible grade, this card features perfect centering, sharp corners, and flawless surfaces. A true investment piece and the crown jewel of any Pokemon collection.',
    price: 850,
    images: ['/images/products/charizard-psa10-1.jpg'],
    category: 'collectibles',
    tags: ['pokemon', 'cards', 'graded', 'featured'],
    rating: 5.0,
    reviewCount: 12,
    inStock: true,
    stockCount: 1,
    sku: 'COL-PKM-CHR',
    features: [
      'PSA 10 Gem Mint grade',
      'Base Set holographic',
      'Authenticated & encased',
      'Investment grade',
    ],
    specifications: {
      Set: 'Base Set',
      Card: '#4/102 Charizard',
      Grade: 'PSA 10 Gem Mint',
      Year: '1999',
    },
    createdAt: '2024-10-05',
  },
  {
    id: '28',
    slug: 'lego-star-wars-millennium-falcon',
    name: 'LEGO Star Wars Millennium Falcon',
    description:
      'Ultimate Collector Series Millennium Falcon. 7,541 pieces of pure joy.',
    longDescription:
      'The LEGO Star Wars Ultimate Collector Series Millennium Falcon is one of the largest and most detailed LEGO sets ever created. At 7,541 pieces, this 1:1 scale replica features incredible interior detail including the cockpit, main hold with game table, rear compartment, and top/bottom gunner stations. Includes 4 classic crew minifigures plus 3 Episode VII characters.',
    price: 849,
    images: ['/images/products/lego-falcon-1.jpg'],
    category: 'collectibles',
    tags: ['lego', 'star-wars', 'ucs'],
    rating: 4.9,
    reviewCount: 67,
    inStock: true,
    stockCount: 3,
    sku: 'COL-LGO-MF',
    features: [
      '7,541 pieces',
      '1:1 scale replica',
      'Detailed interior',
      '7 minifigures included',
    ],
    specifications: {
      Brand: 'LEGO',
      Theme: 'Star Wars UCS',
      Pieces: '7,541',
      Dimensions: '33" x 22" x 8"',
    },
    createdAt: '2024-06-10',
  },
  {
    id: '29',
    slug: 'funko-pop-spider-man-exclusive',
    name: 'Funko Pop! Spider-Man Exclusive',
    description:
      'Limited chase variant with metallic finish. A must for Marvel collectors.',
    longDescription:
      'This exclusive Funko Pop! Spider-Man features a stunning metallic finish that sets it apart from the standard release. The chase variant includes the character in the classic red and blue suit with web-slinging action pose. Standing approximately 3.75 inches tall, this vinyl figure comes in a window display box and is perfect for any Marvel collection.',
    price: 45,
    compareAtPrice: 55,
    images: ['/images/products/funko-spiderman-1.jpg'],
    category: 'collectibles',
    tags: ['funko', 'pop', 'marvel', 'exclusive'],
    rating: 4.6,
    reviewCount: 98,
    inStock: true,
    stockCount: 9,
    sku: 'COL-FNK-SPD',
    features: [
      'Metallic chase variant',
      'Exclusive release',
      'Window display box',
      '3.75" vinyl figure',
    ],
    specifications: {
      Brand: 'Funko',
      Line: 'Pop! Marvel',
      Height: '3.75"',
      Material: 'Vinyl',
    },
    createdAt: '2024-09-25',
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.tags.includes('featured'));
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function getSaleProducts(): Product[] {
  return products.filter((p) => p.compareAtPrice);
}

export function getNewArrivals(): Product[] {
  return [...products]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 8);
}

export function getTopRated(): Product[] {
  return [...products]
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, 6);
}

export function getTrendingProducts(): Product[] {
  return [...products]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 10);
}
