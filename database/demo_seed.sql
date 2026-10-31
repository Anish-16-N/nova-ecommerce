-- =============================================
-- NOVA Security Lab — Demo Seed Data
-- WARNING: Contains intentionally plain-text passwords for SQL-injection demo ONLY
-- This data is entirely synthetic / fictional
-- =============================================

-- ─── demo_customers (plain-text passwords — intentional for SQLi lab) ─────────
INSERT INTO demo_customers (username, password, email, full_name, account_type, loyalty_points, customer_since) VALUES
('admin',        'admin123',       'admin@nova-demo.local',    'Admin User',      'admin',   9999, '2020-01-15'),
('john_doe',     'password123',    'john@nova-demo.local',     'John Doe',        'regular', 1500, '2021-03-22'),
('jane_smith',   'jane2024',       'jane@nova-demo.local',     'Jane Smith',      'premium', 4200, '2020-07-10'),
('raj_patel',    'raj@shop',       'raj@nova-demo.local',      'Raj Patel',       'regular',  320, '2022-11-05'),
('priya_k',      'priya123',       'priya@nova-demo.local',    'Priya Krishnan',  'regular',  890, '2021-09-18'),
('mike_t',       'mike!pass',      'mike@nova-demo.local',     'Mike Thompson',   'regular',  210, '2023-02-14'),
('sara_demo',    'sara9876',       'sara@nova-demo.local',     'Sara Davis',      'premium', 3100, '2020-12-01'),
('user001',      'test123',        'user001@nova-demo.local',  'Demo User 001',   'regular',   50, '2023-08-20'),
('user002',      'qwerty',         'user002@nova-demo.local',  'Demo User 002',   'regular',   75, '2023-09-15'),
('superuser',    'super@2024',     'super@nova-demo.local',    'Super User',      'admin',   9500, '2019-06-01'),
('test_buyer',   'buy123',         'tbuyer@nova-demo.local',   'Test Buyer',      'regular',  100, '2024-01-10'),
('alice_w',      'alice@shop',     'alice@nova-demo.local',    'Alice Wong',      'premium', 2800, '2021-04-30'),
('bob_jones',    'bobspassword',   'bob@nova-demo.local',      'Bob Jones',       'regular',  450, '2022-06-18'),
('carol_demo',   'carol2023',      'carol@nova-demo.local',    'Carol White',     'regular',  680, '2022-01-22'),
('demo_tester',  'tester@demo',    'tester@nova-demo.local',   'Demo Tester',     'regular',    0, '2024-03-01')
ON CONFLICT (username) DO NOTHING;

-- ─── demo_products (for SQL injection search demo) ─────────────────────────
INSERT INTO demo_products (name, category, price, stock, description, internal_cost, supplier_code) VALUES
('Demo Smartphone X1',             'Electronics',     15999, 45, 'Demo smartphone for lab testing.',            8000, 'SUP-001'),
('Demo Laptop Pro',                'Electronics',     54999, 12, 'Demo laptop for SQL injection demo.',         28000, 'SUP-002'),
('Demo Headphones Z',              'Electronics',      4999, 78, 'Demo wireless headphones.',                   2000, 'SUP-003'),
('Demo Running Shoes',             'Sports',           3499, 90, 'Demo sports shoes.',                          1500, 'SUP-004'),
('Demo Yoga Mat',                  'Sports',            799, 150,'Demo yoga mat for fitness lab.',               300, 'SUP-005'),
('Demo Face Serum',                'Beauty',           1499, 200,'Demo beauty serum.',                           500, 'SUP-006'),
('Demo Moisturiser',               'Beauty',            899, 180,'Demo moisturiser product.',                    350, 'SUP-007'),
('Demo Backpack 30L',              'Sports',           2999,  60,'Demo hiking backpack.',                       1200, 'SUP-008'),
('Demo Shelf Unit',                'Home',             7999,  20,'Demo furniture item.',                        3500, 'SUP-009'),
('Demo Air Fryer',                 'Home',             8499,  35,'Demo kitchen appliance.',                     4000, 'SUP-010'),
('Demo Denim Jeans',               'Fashion',          2499, 120,'Demo fashion denim.',                          900, 'SUP-011'),
('Demo Blazer Classic',            'Fashion',          4999,  55,'Demo formal blazer.',                         2000, 'SUP-012'),
('Demo Protein Powder',            'Sports',           2799,  85,'Demo nutrition supplement.',                  1100, 'SUP-013'),
('Demo Smart Watch',               'Electronics',     12999,  30,'Demo wearable device.',                      6000, 'SUP-014'),
('Demo Sunglasses',                'Accessories',      3999,  70,'Demo polarised sunglasses.',                 1500, 'SUP-015'),
('Demo Leather Bag',               'Accessories',      6499,  25,'Demo leather tote bag.',                     2800, 'SUP-016'),
('Demo Pressure Cooker',           'Home',             6999,  40,'Demo kitchen pressure cooker.',              3200, 'SUP-017'),
('Demo Foundation',                'Beauty',            649, 300,'Demo cosmetic foundation.',                    200, 'SUP-018'),
('Demo Fitness Tracker',           'Sports',           9999,  48,'Demo fitness wearable.',                     4500, 'SUP-019'),
('Demo Football',                  'Sports',            599, 200,'Demo sports football.',                        200, 'SUP-020'),
('O''Brien''s Signature Irish Tea', 'Home',             399, 100,'Apostrophe test product for Route C check.',   150, 'SUP-021')
ON CONFLICT DO NOTHING;

-- ─── demo_reviews (for XSS lab — some contain intentional test payloads) ────
-- ⚠️  INTENTIONAL XSS TEST CONTENT — FOR SECURITY LAB DEMONSTRATION ONLY
-- These strings are stored to demonstrate Stored XSS in the isolated lab.
-- They are harmless (no cookie theft, no exfiltration) and only visible in the lab UI.
INSERT INTO demo_reviews (product_id, reviewer_name, content, rating) VALUES
(1, 'Happy Customer', 'Great product! Works exactly as described. Very happy with my purchase.', 5),
(1, 'Regular Reviewer', 'Good value for money. Delivery was fast. Would recommend to friends.', 4),
(2, 'Tech Fan', 'Amazing performance. Totally worth the price. Battery life is exceptional.', 5),
-- XSS demo payloads below — harmless, change visible text/style only:
(3, 'XSS Demo User',
 '<img src=x onerror="document.getElementById(''xss-indicator'').style.background=''red''; document.getElementById(''xss-indicator'').innerText=''⚠️ Stored XSS Executed!''">',
 3),
(4, 'Script Tester',
 '<script>document.title = "XSS Demo Triggered";</script>Interesting product review.',
 2),
(5, 'Style Injector',
 '<b style="color:red">This text is bold and red</b> — demonstrates HTML injection in reviews.',
 4),
(6, 'Alert Demo',
 '<svg onload="document.getElementById(''xss-indicator'').innerText=''SVG XSS Fired!''">SVG-based injection demo</svg>',
 3),
(7, 'Normal User', 'This is a completely normal review with no HTML. Product is good, packaging was neat.', 5),
(8, 'Another User', 'Comfortable and durable. No complaints at all. Five stars from me.', 5),
(9, 'Genuine Review', 'Arrived on time and in perfect condition. Exactly as shown in the photo.', 4)
ON CONFLICT DO NOTHING;