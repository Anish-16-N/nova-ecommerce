'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { Pool } = require('pg');

// ─── Real PostgreSQL Pool Configuration ───────────────────────────────────────
const poolConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'nova_db',
  user: process.env.DB_USER || 'nova_admin',
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000, // fast failover to mock if postgres not running
};

let pool = null;
try {
  pool = new Pool(poolConfig);
  pool.on('error', (err) => {
    // Suppress unhandled idle errors
  });
} catch (e) {
  pool = null;
}

let isUsingMock = false;
let mockDbReady = false;

// ─── Synthetic In-Memory Database ─────────────────────────────────────────────
// Prepopulated from seed.sql and schema so everything runs flawlessly without Docker
const mockStore = {
  categories: [
    { id: 1, name: 'Electronics', slug: 'electronics', description: 'Smartphones, laptops, audio, cameras & gadgets.', icon: 'cpu', image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800', is_active: true, display_order: 1 },
    { id: 2, name: 'Fashion', slug: 'fashion', description: 'Clothing, footwear & apparel from top brands.', icon: 'shirt', image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800', is_active: true, display_order: 2 },
    { id: 3, name: 'Home & Living', slug: 'home-living', description: 'Furniture, decor, kitchen essentials and more.', icon: 'home', image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800', is_active: true, display_order: 3 },
    { id: 4, name: 'Beauty', slug: 'beauty', description: 'Skincare, makeup, haircare & personal care.', icon: 'sparkles', image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', is_active: true, display_order: 4 },
    { id: 5, name: 'Accessories', slug: 'accessories', description: 'Watches, bags, sunglasses & jewellery.', icon: 'watch', image_url: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800', is_active: true, display_order: 5 },
    { id: 6, name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Sports gear, fitness equipment, activewear.', icon: 'dumbbell', image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', is_active: true, display_order: 6 }
  ],
  products: [
    { id: 1, name: 'Apple iPhone 15 Pro', slug: 'apple-iphone-15-pro', description: 'iPhone 15 Pro features aerospace-grade titanium design and A17 Pro chip.', price: 124999, compare_price: 134999, discount_percentage: 7.41, rating: 4.8, total_reviews: 342, stock_quantity: 45, image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800', brand: 'Apple', sku: 'APL-IP15P-256', category_id: 1, is_active: true, is_featured: true, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 2, name: 'Samsung Galaxy S24 Ultra', slug: 'samsung-galaxy-s24-ultra', description: 'Ultimate AI smartphone with built-in S Pen and 200MP camera.', price: 134999, compare_price: 149999, discount_percentage: 10.0, rating: 4.7, total_reviews: 289, stock_quantity: 32, image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800', brand: 'Samsung', sku: 'SAM-S24U-256', category_id: 1, is_active: true, is_featured: true, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 3, name: 'Sony WH-1000XM5 Headphones', slug: 'sony-wh-1000xm5', description: 'Industry-leading noise cancelling wireless headphones.', price: 29990, compare_price: 34990, discount_percentage: 14.29, rating: 4.9, total_reviews: 567, stock_quantity: 78, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', brand: 'Sony', sku: 'SNY-WH1000XM5', category_id: 1, is_active: true, is_featured: false, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 4, name: 'Apple MacBook Air M3', slug: 'apple-macbook-air-m3', description: 'Supercharged by M3, impossibly thin MacBook Air with 18-hour battery.', price: 114900, compare_price: 129900, discount_percentage: 11.55, rating: 4.8, total_reviews: 198, stock_quantity: 22, image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', brand: 'Apple', sku: 'APL-MBA-M3-512', category_id: 1, is_active: true, is_featured: true, is_best_seller: false, is_new_arrival: true, created_at: new Date() },
    { id: 5, name: 'OnePlus 12 5G', slug: 'oneplus-12-5g', description: 'Flagship performance with Hasselblad camera and 100W fast charging.', price: 64999, compare_price: 72999, discount_percentage: 10.96, rating: 4.6, total_reviews: 145, stock_quantity: 56, image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800', brand: 'OnePlus', sku: 'OP-12-256', category_id: 1, is_active: true, is_featured: false, is_best_seller: false, is_new_arrival: true, created_at: new Date() },
    { id: 6, name: 'JBL Charge 5 Bluetooth Speaker', slug: 'jbl-charge-5-speaker', description: 'Portable wireless speaker with 20 hours playtime and IP67 waterproof.', price: 13999, compare_price: 16999, discount_percentage: 17.65, rating: 4.5, total_reviews: 234, stock_quantity: 120, image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800', brand: 'JBL', sku: 'JBL-CHG5-BLK', category_id: 1, is_active: true, is_featured: false, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 7, name: 'Levi\'s 511 Slim Jeans', slug: 'levis-511-slim-jeans', description: 'Classic slim fit jeans in authentic stretch denim.', price: 3499, compare_price: 4499, discount_percentage: 22.27, rating: 4.4, total_reviews: 892, stock_quantity: 150, image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', brand: 'Levi\'s', sku: 'LVS-511-32', category_id: 2, is_active: true, is_featured: false, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 8, name: 'Nike Air Max 270', slug: 'nike-air-max-270', description: 'Iconic lifestyle sneaker with 270° Air unit for all-day comfort.', price: 12995, compare_price: 15995, discount_percentage: 18.75, rating: 4.6, total_reviews: 445, stock_quantity: 88, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', brand: 'Nike', sku: 'NK-AM270-WHT-10', category_id: 2, is_active: true, is_featured: true, is_best_seller: false, is_new_arrival: false, created_at: new Date() },
    { id: 9, name: 'H&M Oversized Hoodie', slug: 'hm-oversized-hoodie', description: 'Relaxed-fit cotton-blend hoodie in comfortable colors.', price: 1999, compare_price: 2499, discount_percentage: 20.01, rating: 4.2, total_reviews: 678, stock_quantity: 300, image_url: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800', brand: 'H&M', sku: 'HM-HDD-OVS-M', category_id: 2, is_active: true, is_featured: false, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 10, name: 'Adidas Ultraboost 23', slug: 'adidas-ultraboost-23', description: 'Premium running shoes with BOOST midsole for maximum energy return.', price: 14999, compare_price: 18999, discount_percentage: 21.05, rating: 4.7, total_reviews: 321, stock_quantity: 65, image_url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800', brand: 'Adidas', sku: 'ADI-UB23-BLK-9', category_id: 2, is_active: true, is_featured: true, is_best_seller: false, is_new_arrival: false, created_at: new Date() },
    { id: 11, name: 'Philips Air Fryer HD9252', slug: 'philips-air-fryer-hd9252', description: 'Rapid Air technology cooks crispy food with up to 90% less fat.', price: 8999, compare_price: 11999, discount_percentage: 25.01, rating: 4.5, total_reviews: 567, stock_quantity: 89, image_url: 'https://images.unsplash.com/photo-1648661048716-7dce27dd88a5?w=800', brand: 'Philips', sku: 'PHL-AF-HD9252', category_id: 3, is_active: true, is_featured: false, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 12, name: 'Dyson V15 Detect Vacuum', slug: 'dyson-v15-detect-vacuum', description: 'Laser-guided cordless vacuum that scientifically proves deep clean.', price: 52900, compare_price: 59900, discount_percentage: 11.69, rating: 4.8, total_reviews: 178, stock_quantity: 20, image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800', brand: 'Dyson', sku: 'DYS-V15-DTT', category_id: 3, is_active: true, is_featured: true, is_best_seller: false, is_new_arrival: true, created_at: new Date() },
    { id: 13, name: 'Lakme 9 to 5 Foundation', slug: 'lakme-9to5-foundation', description: 'Buildable coverage foundation with SPF 25 for a natural finish.', price: 699, compare_price: 899, discount_percentage: 22.25, rating: 4.3, total_reviews: 1234, stock_quantity: 500, image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', brand: 'Lakme', sku: 'LAK-F-W35-W205', category_id: 4, is_active: true, is_featured: false, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 14, name: 'L\'Oreal Paris Revitalift Serum', slug: 'loreal-revitalift-serum', description: '1.5% pure hyaluronic acid serum for plumped, youthful-looking skin.', price: 1299, compare_price: 1799, discount_percentage: 27.79, rating: 4.6, total_reviews: 456, stock_quantity: 230, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', brand: 'L\'Oreal', sku: 'LOR-RVL-HA-30ML', category_id: 4, is_active: true, is_featured: true, is_best_seller: false, is_new_arrival: false, created_at: new Date() },
    { id: 15, name: 'Titan Edge Ultra Slim Watch', slug: 'titan-edge-ultra-slim-watch', description: 'World\'s slimmest watch at 3.5mm with sapphire crystal glass.', price: 12995, compare_price: 15995, discount_percentage: 18.75, rating: 4.7, total_reviews: 345, stock_quantity: 55, image_url: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800', brand: 'Titan', sku: 'TTN-EDG-GRY-33', category_id: 5, is_active: true, is_featured: true, is_best_seller: false, is_new_arrival: false, created_at: new Date() },
    { id: 16, name: 'Ray-Ban Wayfarer Sunglasses', slug: 'rayban-wayfarer-sunglasses', description: 'Iconic wayfarer with 100% UV400 protection and polarised lenses.', price: 9990, compare_price: 12990, discount_percentage: 23.09, rating: 4.8, total_reviews: 456, stock_quantity: 78, image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800', brand: 'Ray-Ban', sku: 'RB-WF-BLK-54', category_id: 5, is_active: true, is_featured: false, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 17, name: 'Decathlon Quechua MH500 Backpack', slug: 'decathlon-quechua-backpack', description: '30L mountain hiking backpack with rain cover and ventilated back.', price: 3999, compare_price: 4999, discount_percentage: 20.00, rating: 4.5, total_reviews: 567, stock_quantity: 112, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', brand: 'Decathlon', sku: 'DCT-QCH-MH500-30L', category_id: 6, is_active: true, is_featured: false, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 18, name: 'ON Gold Standard 100% Whey Protein', slug: 'on-gold-standard-whey-protein', description: '24g protein per serving for muscle recovery. Double Rich Chocolate.', price: 3999, compare_price: 5499, discount_percentage: 27.28, rating: 4.7, total_reviews: 1234, stock_quantity: 178, image_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800', brand: 'Optimum Nutrition', sku: 'ON-GSW-CHOC-2KG', category_id: 6, is_active: true, is_featured: true, is_best_seller: false, is_new_arrival: false, created_at: new Date() },
    { id: 19, name: 'Sony Bravia 55" 4K OLED TV', slug: 'sony-bravia-55-4k-oled', description: 'Exceptional contrast and sound from OLED picture with Cognitive Processor XR.', price: 119990, compare_price: 139990, discount_percentage: 14.28, rating: 4.8, total_reviews: 215, stock_quantity: 15, image_url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800', brand: 'Sony', sku: 'SNY-XR-55A80L', category_id: 1, is_active: true, is_featured: true, is_best_seller: false, is_new_arrival: true, created_at: new Date() },
    { id: 20, name: 'Bose QuietComfort 45 Headphones', slug: 'bose-quietcomfort-45', description: 'Iconic silence, comfort, and sound. TriPort acoustic architecture delivers high fidelity.', price: 24990, compare_price: 29990, discount_percentage: 16.67, rating: 4.7, total_reviews: 410, stock_quantity: 40, image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800', brand: 'Bose', sku: 'BOS-QC45-BLK', category_id: 1, is_active: true, is_featured: false, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 21, name: 'Zara Structured Tailored Blazer', slug: 'zara-tailored-blazer', description: 'Single-breasted tailored blazer in premium stretch viscose blend with notched lapels.', price: 5999, compare_price: 7999, discount_percentage: 25.00, rating: 4.4, total_reviews: 156, stock_quantity: 45, image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', brand: 'Zara', sku: 'ZRA-BLZ-NVY-M', category_id: 2, is_active: true, is_featured: false, is_best_seller: false, is_new_arrival: true, created_at: new Date() },
    { id: 22, name: 'Puma Velocity Nitro 2 Shoes', slug: 'puma-velocity-nitro-2', description: 'Lightweight responsive daily trainer with NITRO FOAM cushioning and PUMAGRIP outsole.', price: 8999, compare_price: 10999, discount_percentage: 18.18, rating: 4.5, total_reviews: 280, stock_quantity: 70, image_url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800', brand: 'Puma', sku: 'PUM-VN2-BLU-9', category_id: 2, is_active: true, is_featured: false, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 23, name: 'Allen Solly Casual Cotton Shirt', slug: 'allen-solly-casual-shirt', description: '100% breathable combed cotton slim fit shirt with classic spread collar.', price: 1899, compare_price: 2499, discount_percentage: 24.01, rating: 4.3, total_reviews: 520, stock_quantity: 120, image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800', brand: 'Allen Solly', sku: 'AS-SHT-WHT-40', category_id: 2, is_active: true, is_featured: false, is_best_seller: false, is_new_arrival: true, created_at: new Date() },
    { id: 24, name: 'IKEA KALLAX 4-Cube Storage Shelf', slug: 'ikea-kallax-shelf-unit', description: 'Versatile 4-cube storage shelf for living room, study, or bedroom in smooth white finish.', price: 7999, compare_price: 9499, discount_percentage: 15.79, rating: 4.5, total_reviews: 234, stock_quantity: 34, image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', brand: 'IKEA', sku: 'IKA-KLX-4-WHT', category_id: 3, is_active: true, is_featured: false, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 25, name: 'Instant Pot Duo 7-in-1 Multi Cooker', slug: 'instant-pot-duo-7in1', description: 'Pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker and warmer.', price: 9499, compare_price: 12999, discount_percentage: 26.93, rating: 4.6, total_reviews: 445, stock_quantity: 67, image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800', brand: 'Instant Pot', sku: 'INP-DUO7-6QT', category_id: 3, is_active: true, is_featured: true, is_best_seller: false, is_new_arrival: false, created_at: new Date() },
    { id: 26, name: 'Bedsure 100% Bamboo Bedsheet Set', slug: 'bamboo-bedsheet-set-6pc', description: 'Ultra-soft 100% bamboo-derived viscose sheets with deep pockets and cooling airflow.', price: 3999, compare_price: 5999, discount_percentage: 33.34, rating: 4.5, total_reviews: 312, stock_quantity: 145, image_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', brand: 'Bedsure', sku: 'BDS-BMBO-6PC-QN', category_id: 3, is_active: true, is_featured: false, is_best_seller: false, is_new_arrival: true, created_at: new Date() },
    { id: 27, name: 'Forest Essentials Sandalwood Cream', slug: 'forest-essentials-facial-moisturiser', description: 'Ayurvedic silkening treatment moisturiser with pure sandalwood, saffron and sweet almond oil.', price: 2950, compare_price: 3500, discount_percentage: 15.71, rating: 4.7, total_reviews: 234, stock_quantity: 89, image_url: 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=800', brand: 'Forest Essentials', sku: 'FE-MCR-SNL-50G', category_id: 4, is_active: true, is_featured: true, is_best_seller: false, is_new_arrival: false, created_at: new Date() },
    { id: 28, name: 'Biotique Coconut Brightening Pack', slug: 'biotique-coconut-face-pack', description: 'Natural coconut milk face pack for brightening, dark spot removal, and skin nourishment.', price: 299, compare_price: 399, discount_percentage: 25.06, rating: 4.2, total_reviews: 678, stock_quantity: 400, image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800', brand: 'Biotique', sku: 'BIO-FCK-COC-75G', category_id: 4, is_active: true, is_featured: false, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 29, name: 'Mamaearth Vitamin C Face Wash', slug: 'mamaearth-vitc-face-wash', description: 'Brightening face wash with Vitamin C and turmeric for clear, radiant skin. Sulfate-free.', price: 349, compare_price: 449, discount_percentage: 22.27, rating: 4.4, total_reviews: 923, stock_quantity: 345, image_url: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800', brand: 'Mamaearth', sku: 'MME-FW-VITC-100ML', category_id: 4, is_active: true, is_featured: false, is_best_seller: false, is_new_arrival: true, created_at: new Date() },
    { id: 30, name: 'Fossil Gen 6 Smartwatch', slug: 'fossil-gen6-smartwatch', description: 'Wear OS touchscreen smartwatch with Snapdragon 4100+, SpO2 tracking, and fast charging.', price: 24995, compare_price: 29995, discount_percentage: 16.67, rating: 4.4, total_reviews: 178, stock_quantity: 34, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', brand: 'Fossil', sku: 'FSL-GEN6-BLK-44', category_id: 5, is_active: true, is_featured: false, is_best_seller: false, is_new_arrival: true, created_at: new Date() },
    { id: 31, name: 'Hidesign Vegetable Leather Tote', slug: 'hidesign-leather-tote-bag', description: 'Handcrafted full-grain vegetable-tanned genuine leather spacious shoulder bag.', price: 7995, compare_price: 9995, discount_percentage: 20.01, rating: 4.6, total_reviews: 234, stock_quantity: 42, image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', brand: 'Hidesign', sku: 'HDS-TTE-TAN-L', category_id: 5, is_active: true, is_featured: true, is_best_seller: false, is_new_arrival: false, created_at: new Date() },
    { id: 32, name: 'Casio G-Shock Rugged Sports Watch', slug: 'casio-g-shock-rugged-watch', description: '200m water resistance, shock-proof structure, dual time display, and stopwatch.', price: 8995, compare_price: 9995, discount_percentage: 10.01, rating: 4.8, total_reviews: 620, stock_quantity: 60, image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800', brand: 'Casio', sku: 'CAS-GSHK-GA2100', category_id: 5, is_active: true, is_featured: false, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 33, name: 'Boldfit Eco TPE Non-Slip Yoga Mat', slug: 'boldfit-yoga-mat-6mm', description: '6mm high-density cushioned non-slip dual-sided alignment yoga mat with carrying strap.', price: 1299, compare_price: 1799, discount_percentage: 27.79, rating: 4.4, total_reviews: 789, stock_quantity: 234, image_url: 'https://images.unsplash.com/photo-1601925228869-d72326b97e9f?w=800', brand: 'Boldfit', sku: 'BLD-YMT-TPE-6MM', category_id: 6, is_active: true, is_featured: false, is_best_seller: false, is_new_arrival: true, created_at: new Date() },
    { id: 34, name: 'Fitbit Charge 6 GPS Fitness Tracker', slug: 'fitbit-charge6-tracker', description: 'Advanced health tracker with built-in GPS, heart rate monitor, ECG app, and YouTube Music.', price: 14999, compare_price: 18999, discount_percentage: 21.06, rating: 4.5, total_reviews: 345, stock_quantity: 67, image_url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800', brand: 'Fitbit', sku: 'FBT-CHG6-BLK', category_id: 6, is_active: true, is_featured: false, is_best_seller: true, is_new_arrival: false, created_at: new Date() },
    { id: 35, name: 'Nivia Storm Pro Match Football', slug: 'nivia-storm-football', description: 'Thermally-bonded FIFA quality pro football with 32-panel aerodynamic flight precision.', price: 699, compare_price: 999, discount_percentage: 30.03, rating: 4.3, total_reviews: 456, stock_quantity: 289, image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', brand: 'Nivia', sku: 'NIV-STM-FB-5', category_id: 6, is_active: true, is_featured: false, is_best_seller: false, is_new_arrival: false, created_at: new Date() },
    { id: 36, name: 'Kobo 20kg Adjustable Dumbbell Set', slug: 'kobo-20kg-adjustable-dumbbells', description: 'Vinyl-coated cast iron weight plates with spinlock collars and connector rod for home gym.', price: 4999, compare_price: 6499, discount_percentage: 23.08, rating: 4.6, total_reviews: 340, stock_quantity: 50, image_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800', brand: 'Kobo', sku: 'KBO-DB-20KG-SET', category_id: 6, is_active: true, is_featured: true, is_best_seller: false, is_new_arrival: false, created_at: new Date() },
    { id: 37, name: "O'Brien's Signature Irish Tea", slug: 'obriens-signature-irish-tea', description: 'Apostrophe test product for Route C check.', price: 399, compare_price: 499, discount_percentage: 20.04, rating: 4.8, total_reviews: 95, stock_quantity: 100, image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800', brand: "O'Brien's", sku: 'OBR-TEA-IRSH-100G', category_id: 3, is_active: true, is_featured: false, is_best_seller: false, is_new_arrival: true, created_at: new Date() }
  ],
  users: [
    { id: '11111111-1111-1111-1111-111111111111', email: 'demo@nova.local', username: 'demo_user', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Demo Customer', phone: '+91 98200 00001', role: 'customer', address: '401 Nova Towers, MG Road', city: 'Bengaluru', state: 'Karnataka', pin_code: '560001', is_active: true, created_at: new Date('2023-01-15') },
    { id: '22222222-2222-2222-2222-222222222201', email: 'rajesh.kumar@example.com', username: 'rajesh_k', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Rajesh Kumar', phone: '+91 98201 12345', role: 'customer', address: 'Flat 402, Sea Breeze Apts, Bandra West', city: 'Mumbai', state: 'Maharashtra', pin_code: '400050', is_active: true, created_at: new Date('2023-02-10') },
    { id: '22222222-2222-2222-2222-222222222202', email: 'priya.sharma@example.com', username: 'priya_s', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Priya Sharma', phone: '+91 98112 23456', role: 'customer', address: 'House 14, Sector 15', city: 'Gurugram', state: 'Haryana', pin_code: '122001', is_active: true, created_at: new Date('2023-02-28') },
    { id: '22222222-2222-2222-2222-222222222203', email: 'amitav.sengupta@example.com', username: 'amitav_s', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Amitav Sengupta', phone: '+91 98300 34567', role: 'customer', address: '72/B Park Street', city: 'Kolkata', state: 'West Bengal', pin_code: '700016', is_active: true, created_at: new Date('2023-03-12') },
    { id: '22222222-2222-2222-2222-222222222204', email: 'ananya.iyer@example.com', username: 'ananya_i', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Ananya Iyer', phone: '+91 94440 45678', role: 'customer', address: 'Villa 8, Palm Meadows, Whitefield', city: 'Bengaluru', state: 'Karnataka', pin_code: '560066', is_active: true, created_at: new Date('2023-03-25') },
    { id: '22222222-2222-2222-2222-222222222205', email: 'vikram.rathore@example.com', username: 'vikram_r', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Vikramaditya Rathore', phone: '+91 94140 56789', role: 'customer', address: 'Plot 45, Civil Lines', city: 'Jaipur', state: 'Rajasthan', pin_code: '302006', is_active: true, created_at: new Date('2023-04-05') },
    { id: '22222222-2222-2222-2222-222222222206', email: 'sneha.reddy@example.com', username: 'sneha_r', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Sneha Reddy', phone: '+91 98490 67890', role: 'customer', address: 'Road No. 36, Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pin_code: '500033', is_active: true, created_at: new Date('2023-04-18') },
    { id: '22222222-2222-2222-2222-222222222207', email: 'rohan.mehta@example.com', username: 'rohan_m', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Rohan Mehta', phone: '+91 98250 78901', role: 'customer', address: '101 Navrangpura Commercial Area', city: 'Ahmedabad', state: 'Gujarat', pin_code: '380009', is_active: true, created_at: new Date('2023-05-02') },
    { id: '22222222-2222-2222-2222-222222222208', email: 'neha.kapoor@example.com', username: 'neha_k', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Neha Kapoor', phone: '+91 98101 89012', role: 'customer', address: 'D-Block, Saket Residency', city: 'New Delhi', state: 'Delhi', pin_code: '110017', is_active: true, created_at: new Date('2023-05-19') },
    { id: '22222222-2222-2222-2222-222222222209', email: 'karthik.s@example.com', username: 'karthik_s', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Karthik Subramanian', phone: '+91 98401 90123', role: 'customer', address: '23 Besant Nagar 4th Avenue', city: 'Chennai', state: 'Tamil Nadu', pin_code: '600090', is_active: true, created_at: new Date('2023-06-01') },
    { id: '22222222-2222-2222-2222-222222222210', email: 'pooja.deshmukh@example.com', username: 'pooja_d', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Pooja Deshmukh', phone: '+91 98220 01234', role: 'customer', address: 'B-3 Koregaon Park Lane 7', city: 'Pune', state: 'Maharashtra', pin_code: '411001', is_active: true, created_at: new Date('2023-06-15') },
    { id: '22222222-2222-2222-2222-222222222211', email: 'arjun.verma@example.com', username: 'arjun_v', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Arjun Verma', phone: '+91 98760 12340', role: 'customer', address: 'House 512, Sector 17', city: 'Chandigarh', state: 'Punjab', pin_code: '160017', is_active: true, created_at: new Date('2023-07-04') },
    { id: '22222222-2222-2222-2222-222222222212', email: 'deepa.nair@example.com', username: 'deepa_n', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Deepa Nair', phone: '+91 94470 23451', role: 'customer', address: 'House 5, Panampilly Nagar', city: 'Kochi', state: 'Kerala', pin_code: '682036', is_active: true, created_at: new Date('2023-07-22') },
    { id: '22222222-2222-2222-2222-222222222213', email: 'manpreet.singh@example.com', username: 'manpreet_s', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Manpreet Singh', phone: '+91 98140 34562', role: 'customer', address: 'Model Town Phase 2, Near Club', city: 'Ludhiana', state: 'Punjab', pin_code: '141002', is_active: true, created_at: new Date('2023-08-11') },
    { id: '22222222-2222-2222-2222-222222222214', email: 'shweta.joshi@example.com', username: 'shweta_j', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Shweta Joshi', phone: '+91 98260 45673', role: 'customer', address: '12 South Tukoganj Main Street', city: 'Indore', state: 'Madhya Pradesh', pin_code: '452001', is_active: true, created_at: new Date('2023-08-30') },
    { id: '22222222-2222-2222-2222-222222222215', email: 'tanmay.bose@example.com', username: 'tanmay_b', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Tanmay Bose', phone: '+91 94330 56784', role: 'customer', address: 'Salt Lake City Sector 1', city: 'Kolkata', state: 'West Bengal', pin_code: '700064', is_active: true, created_at: new Date('2023-09-14') },
    { id: '22222222-2222-2222-2222-222222222216', email: 'kavita.menon@example.com', username: 'kavita_m', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Kavita Menon', phone: '+91 98460 67895', role: 'customer', address: 'Kowdiar Gardens Apt 3B', city: 'Thiruvananthapuram', state: 'Kerala', pin_code: '695003', is_active: true, created_at: new Date('2023-10-02') },
    { id: '22222222-2222-2222-2222-222222222217', email: 'abhishek.c@example.com', username: 'abhishek_c', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Abhishek Choudhary', phone: '+91 94310 78906', role: 'customer', address: 'Boring Road Crossing, House 18', city: 'Patna', state: 'Bihar', pin_code: '800001', is_active: true, created_at: new Date('2023-10-21') },
    { id: '22222222-2222-2222-2222-222222222218', email: 'ritu.agarwal@example.com', username: 'ritu_a', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Ritu Agarwal', phone: '+91 94500 89017', role: 'customer', address: 'Hazratganj Main Market Road', city: 'Lucknow', state: 'Uttar Pradesh', pin_code: '226001', is_active: true, created_at: new Date('2023-11-08') },
    { id: '22222222-2222-2222-2222-222222222219', email: 'siddharth.p@example.com', username: 'siddharth_p', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Siddharth Pillai', phone: '+91 98450 90128', role: 'customer', address: 'Indiranagar 100ft Road, 4th Cross', city: 'Bengaluru', state: 'Karnataka', pin_code: '560038', is_active: true, created_at: new Date('2023-11-25') },
    { id: '22222222-2222-2222-2222-222222222220', email: 'meera.nambiar@example.com', username: 'meera_n', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Meera Nambiar', phone: '+91 94460 01239', role: 'customer', address: 'Calicut Beach View Apt 602', city: 'Kozhikode', state: 'Kerala', pin_code: '673001', is_active: true, created_at: new Date('2023-12-10') },
    { id: '22222222-2222-2222-2222-222222222221', email: 'varun.saxena@example.com', username: 'varun_s', password_hash: '$2a$12$e8YkZJ1Jt1fGZ4fC2JbFGejV7K4k4yGv4y6dFjKzU0T1qYgG4hR7S', full_name: 'Varun Saxena', phone: '+91 98290 12349', role: 'customer', address: 'Mansarovar Sector 5, House 33', city: 'Jaipur', state: 'Rajasthan', pin_code: '302020', is_active: true, created_at: new Date('2024-01-05') }
  ],
  cart_items: [],
  wishlist_items: [],
  orders: [],
  order_items: [],
  mock_transactions: [],
  reviews: [
    { id: 1, product_id: 1, user_id: '11111111-1111-1111-1111-111111111111', username: 'tech_raj', full_name: 'Rajesh Kumar', rating: 5, title: 'Outstanding!', body: 'Best phone ever. A17 Pro is blazing fast!', is_verified_purchase: true, is_approved: true, helpful_count: 14, created_at: new Date() }
  ]
};

// ─── Smart Query Mock Dispatcher ──────────────────────────────────────────────
async function mockQuery(text, params = []) {
  const t = text.trim();

  // Test connection
  if (t.includes('SELECT NOW()')) {
    return { rows: [{ now: new Date().toISOString(), db: 'nova_db_inmemory' }] };
  }

  // Categories count / list
  if (t.includes('FROM categories')) {
    const rows = mockStore.categories.map(c => ({
      ...c,
      product_count: mockStore.products.filter(p => p.category_id === c.id).length
    }));
    return { rows, rowCount: rows.length };
  }

  // Count products
  if (t.includes('SELECT COUNT(*) AS total') && t.includes('FROM products')) {
    let list = mockStore.products;
    if (params.length > 0 && typeof params[0] === 'string' && !params[0].startsWith('%')) {
      const cat = mockStore.categories.find(c => c.slug === params[0]);
      if (cat) list = list.filter(p => p.category_id === cat.id);
    }
    return { rows: [{ total: list.length }], rowCount: 1 };
  }

  // Products featured
  if (t.includes('FROM products') && t.includes('is_featured = true')) {
    const rows = mockStore.products.filter(p => p.is_featured).map(p => {
      const c = mockStore.categories.find(cat => cat.id === p.category_id);
      return { ...p, category_name: c?.name, category_slug: c?.slug };
    });
    return { rows, rowCount: rows.length };
  }

  // Products best sellers
  if (t.includes('FROM products') && (t.includes('best-sellers') || t.includes('units_sold') || t.includes('is_best_seller'))) {
    const rows = mockStore.products.filter(p => p.is_best_seller).map(p => {
      const c = mockStore.categories.find(cat => cat.id === p.category_id);
      return { ...p, category_name: c?.name, category_slug: c?.slug, units_sold: 250 };
    });
    return { rows, rowCount: rows.length };
  }

  // Products new arrivals
  if (t.includes('FROM products') && t.includes('ORDER BY p.created_at DESC')) {
    const rows = [...mockStore.products].reverse().map(p => {
      const c = mockStore.categories.find(cat => cat.id === p.category_id);
      return { ...p, category_name: c?.name, category_slug: c?.slug };
    });
    return { rows, rowCount: rows.length };
  }

  // Product by ID or stock check
  if (t.includes('FROM products') && (t.includes('WHERE p.id = $1') || t.includes('WHERE id = $1'))) {
    const p = mockStore.products.find(prod => prod.id === parseInt(params[0], 10));
    if (!p) return { rows: [], rowCount: 0 };
    const c = mockStore.categories.find(cat => cat.id === p.category_id);
    return { rows: [{ ...p, category_name: c?.name, category_slug: c?.slug }], rowCount: 1 };
  }

  // Product reviews
  if (t.includes('FROM reviews') && t.includes('WHERE r.product_id = $1')) {
    const revs = mockStore.reviews.filter(r => r.product_id === parseInt(params[0], 10));
    return { rows: revs, rowCount: revs.length };
  }

  // General Products list / search
  if (t.includes('FROM products')) {
    const lower = t.toLowerCase();

    // ── SQL Injection in raw search / store queries ─────────────────────────
    if (lower.includes('union') && lower.includes('select') && (lower.includes('users') || lower.includes('password'))) {
      const leaked = mockStore.users.map(u => ({
        id: 99000 + parseInt(u.id.slice(-2), 16) || 99999,
        name: `[LEAKED CREDENTIAL] User: ${u.username} | PassHash: ${u.password_hash.slice(0, 20)}...`,
        price: 0,
        compare_price: 0,
        discount_percentage: 0,
        brand: 'EXFILTRATED_USERS',
        category_name: 'Security Breach',
        category_slug: 'leaked',
        image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400',
        stock_quantity: 0,
        rating: 5,
        total_reviews: 1,
      }));
      return { rows: leaked, rowCount: leaked.length };
    }

    if (lower.includes("' or '1'='1") || lower.includes("1=1") || lower.includes("' or true")) {
      const list = mockStore.products.map(p => {
        const c = mockStore.categories.find(cat => cat.id === p.category_id);
        return { ...p, category_name: c?.name, category_slug: c?.slug };
      });
      return { rows: list, rowCount: list.length };
    }

    let list = mockStore.products.map(p => {
      const c = mockStore.categories.find(cat => cat.id === p.category_id);
      return { ...p, category_name: c?.name, category_slug: c?.slug };
    });

    if (params.length > 0) {
      for (const p of params) {
        if (typeof p === 'string' && p.startsWith('%') && p.endsWith('%')) {
          const q = p.slice(1, -1).toLowerCase();
          list = list.filter(item => item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q)));
        } else if (typeof p === 'string') {
          const cat = mockStore.categories.find(c => c.slug === p);
          if (cat) list = list.filter(item => item.category_id === cat.id);
        }
      }
    }
    return { rows: list, rowCount: list.length };
  }

  // Cart operations
  if (t.includes('FROM cart_items')) {
    const sessionOrUser = params[0] ? String(params[0]) : null;
    const items = mockStore.cart_items
      .filter(ci => sessionOrUser && (String(ci.session_id) === sessionOrUser || String(ci.user_id) === sessionOrUser))
      .map(ci => {
        const prod = mockStore.products.find(p => parseInt(p.id, 10) === parseInt(ci.product_id, 10)) || {};
        return { ...prod, ...ci, id: ci.id, product_id: ci.product_id, quantity: ci.quantity };
      });
    return { rows: items, rowCount: items.length };
  }

  if (t.includes('INSERT INTO cart_items')) {
    const sessionOrUser = params[0] ? String(params[0]) : 'guest_anon';
    const pid = parseInt(params[1], 10);
    const qty = parseInt(params[2], 10) || 1;
    const existing = mockStore.cart_items.find(ci => (String(ci.session_id) === sessionOrUser || String(ci.user_id) === sessionOrUser) && parseInt(ci.product_id, 10) === pid);
    if (existing) {
      existing.quantity += qty;
    } else {
      mockStore.cart_items.push({ id: mockStore.cart_items.length + 1, session_id: sessionOrUser, user_id: sessionOrUser, product_id: pid, quantity: qty, added_at: new Date() });
    }
    return { rows: [{ id: 1 }], rowCount: 1 };
  }

  if (t.includes('UPDATE cart_items')) {
    const sessionOrUser = params[0] ? String(params[0]) : null;
    const qty = parseInt(params[1], 10);
    const pid = parseInt(params[2], 10);
    const item = mockStore.cart_items.find(ci => sessionOrUser && (String(ci.session_id) === sessionOrUser || String(ci.user_id) === sessionOrUser) && parseInt(ci.product_id, 10) === pid);
    if (item) item.quantity = qty;
    return { rows: [{ id: 1 }], rowCount: 1 };
  }

  if (t.includes('DELETE FROM cart_items')) {
    const sessionOrUser = params[0] ? String(params[0]) : null;
    const pid = params[1] ? parseInt(params[1], 10) : null;
    if (pid) {
      mockStore.cart_items = mockStore.cart_items.filter(ci => !(sessionOrUser && (String(ci.session_id) === sessionOrUser || String(ci.user_id) === sessionOrUser) && parseInt(ci.product_id, 10) === pid));
    } else {
      mockStore.cart_items = mockStore.cart_items.filter(ci => !(sessionOrUser && (String(ci.session_id) === sessionOrUser || String(ci.user_id) === sessionOrUser)));
    }
    return { rows: [], rowCount: 1 };
  }

  // Wishlist operations
  if (t.includes('FROM wishlist_items')) {
    const sessionOrUser = params[0] ? String(params[0]) : null;
    const items = mockStore.wishlist_items
      .filter(wi => sessionOrUser && (String(wi.session_id) === sessionOrUser || String(wi.user_id) === sessionOrUser))
      .map(wi => {
        const prod = mockStore.products.find(p => parseInt(p.id, 10) === parseInt(wi.product_id, 10)) || {};
        return { ...wi, ...prod };
      });
    return { rows: items, rowCount: items.length };
  }

  if (t.includes('INSERT INTO wishlist_items')) {
    const sessionOrUser = params[0] ? String(params[0]) : 'guest_anon';
    const pid = parseInt(params[1], 10);
    if (!mockStore.wishlist_items.some(wi => (String(wi.session_id) === sessionOrUser || String(wi.user_id) === sessionOrUser) && parseInt(wi.product_id, 10) === pid)) {
      mockStore.wishlist_items.push({ id: mockStore.wishlist_items.length + 1, session_id: sessionOrUser, user_id: sessionOrUser, product_id: pid, added_at: new Date() });
    }
    return { rows: [{ id: 1 }], rowCount: 1 };
  }

  // Orders
  if (t.includes('INSERT INTO orders')) {
    const newOrder = {
      id: 'ord-' + Date.now(),
      order_number: 'NOV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000),
      user_id: params[0],
      session_id: params[1],
      status: 'confirmed',
      subtotal: params[2],
      discount_amount: params[3],
      delivery_fee: params[4],
      total_amount: params[5],
      shipping_address: params[6],
      estimated_delivery: params[7],
      created_at: new Date()
    };
    mockStore.orders.push(newOrder);
    return { rows: [newOrder], rowCount: 1 };
  }

  // Order items
  if (t.includes('INSERT INTO order_items')) {
    mockStore.order_items.push({
      order_id: params[0],
      product_id: params[1],
      product_name: params[2],
      product_image: params[3],
      brand: params[4],
      quantity: params[5],
      unit_price: params[6],
      discount_percentage: params[7],
      final_price: params[8],
    });
    return { rows: [{ id: 1 }], rowCount: 1 };
  }

  // Transactions
  if (t.includes('INSERT INTO mock_transactions')) {
    mockStore.mock_transactions.push({
      order_id: params[0],
      transaction_id: params[1],
      payment_method: params[2],
      amount: params[4],
      status: params[5],
      created_at: new Date(),
    });
    return { rows: [{ id: 1 }], rowCount: 1 };
  }

  if (t.includes('UPDATE orders')) {
    const ordId = params[params.length - 1];
    const ord = mockStore.orders.find(o => o.id === ordId) || mockStore.orders[mockStore.orders.length - 1];
    if (ord) ord.status = 'paid';
    return { rows: [{ id: 1 }], rowCount: 1 };
  }

  if (t.includes('FROM orders')) {
    if (t.includes('WHERE o.id = $1') || t.includes('WHERE id = $1')) {
      const ord = mockStore.orders.find(o => o.id === params[0]) || mockStore.orders[mockStore.orders.length - 1];
      if (ord) {
        const orderItems = mockStore.order_items.filter(oi => oi.order_id === ord.id);
        return { rows: [{ ...ord, items: orderItems.length > 0 ? orderItems : [{ product_name: 'Product', quantity: 1, final_price: ord.total_amount }] }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }
    const sessionOrUser = params[0];
    const ords = mockStore.orders.filter(o => o.user_id === sessionOrUser || o.session_id === sessionOrUser);
    return { rows: ords.length > 0 ? ords : mockStore.orders, rowCount: ords.length };
  }

  // Users Auth
  if (t.includes('FROM users')) {
    if (params.length > 0) {
      const val = params[0].toLowerCase();
      const u = mockStore.users.find(user => user.email.toLowerCase() === val || user.username.toLowerCase() === val || user.id === val);
      return { rows: u ? [u] : [], rowCount: u ? 1 : 0 };
    }
    return { rows: mockStore.users, rowCount: mockStore.users.length };
  }

  if (t.includes('INSERT INTO users')) {
    const newUser = {
      id: 'user-' + Date.now(),
      email: params[0],
      username: params[1],
      password_hash: params[2],
      full_name: params[3] || 'Customer',
      role: 'customer',
      is_active: true,
      created_at: new Date()
    };
    mockStore.users.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }

  if (t.includes('UPDATE users')) {
    const uid = params[params.length - 1];
    const u = mockStore.users.find(user => String(user.id) === String(uid));
    if (u) {
      if (params[0]) u.full_name = params[0];
      if (params[1]) u.phone = params[1];
      if (params[2]) u.avatar_url = params[2];
      return { rows: [u], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // Insert review
  if (t.includes('INSERT INTO reviews')) {
    const newReview = {
      id: mockStore.reviews.length + 1,
      product_id: parseInt(params[0], 10),
      user_id: params[1],
      username: params[2],
      full_name: params[3],
      rating: parseInt(params[4], 10),
      title: params[5],
      body: params[6],
      helpful_count: 0,
      is_verified_purchase: false,
      is_approved: true,
      created_at: new Date()
    };
    mockStore.reviews.unshift(newReview);
    return { rows: [newReview], rowCount: 1 };
  }

  // Update product rating
  if (t.includes('UPDATE products') && t.includes('rating')) {
    const pid = parseInt(params[0], 10);
    const prod = mockStore.products.find(p => p.id === pid);
    if (prod) {
      const pReviews = mockStore.reviews.filter(r => r.product_id === pid);
      if (pReviews.length > 0) {
        prod.rating = parseFloat((pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length).toFixed(1));
        prod.total_reviews = pReviews.length;
      }
    }
    return { rows: [{ id: pid }], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}

// ─── Execute Query (PostgreSQL with seamless in-memory fallback) ───────────────
async function query(text, params) {
  if (isUsingMock) {
    return mockQuery(text, params);
  }

  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED') || err.message.includes('connect')) {
      if (!isUsingMock) {
        isUsingMock = true;
        console.log('[DB] ⚠️  PostgreSQL offline on 127.0.0.1:5432 — Seamlessly switched to In-Memory Database');
      }
      return mockQuery(text, params);
    }
    throw err;
  }
}

// ─── Transaction Helper ───────────────────────────────────────────────────────
async function withTransaction(fn) {
  if (isUsingMock) {
    return fn(mockQuery);
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const transactionQuery = (text, params) => client.query(text, params);
      const result = await fn(transactionQuery, client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED')) {
      isUsingMock = true;
      return fn(mockQuery);
    }
    throw err;
  }
}

// ─── Test Connection ──────────────────────────────────────────────────────────
async function testConnection() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() AS now, current_database() AS db');
      console.log(`[DB] ✅ Connected to PostgreSQL: ${result.rows[0].db}`);
      isUsingMock = false;
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    isUsingMock = true;
    console.log('[DB] ℹ️  PostgreSQL not active. In-Memory fallback database is READY with full synthetic store.');
    return false;
  }
}

module.exports = {
  pool,
  query,
  withTransaction,
  testConnection,
  mockStore,
};
