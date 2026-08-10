-- ============================================================
-- FinanceOS Default Categories Seed
-- 001_default_categories.sql
-- Run after schema.sql — inserts global default categories (user_id NULL)
-- ============================================================

-- ============================================================
-- EXPENSE CATEGORIES
-- ============================================================

INSERT INTO categories (id, user_id, parent_id, name, type, icon, color, is_default, sort_order) VALUES

-- === Food & Dining (parent) ===
('00000000-0000-0000-0001-000000000001', NULL, NULL, 'Food & Dining',   'expense', 'utensils',      '#f97316', TRUE, 10),
('00000000-0000-0000-0001-000000000002', NULL, '00000000-0000-0000-0001-000000000001', 'Groceries',         'expense', 'shopping-basket', '#f97316', TRUE, 11),
('00000000-0000-0000-0001-000000000003', NULL, '00000000-0000-0000-0001-000000000001', 'Restaurants',       'expense', 'fork-knife',      '#fb923c', TRUE, 12),
('00000000-0000-0000-0001-000000000004', NULL, '00000000-0000-0000-0001-000000000001', 'Coffee & Drinks',   'expense', 'coffee',          '#fdba74', TRUE, 13),
('00000000-0000-0000-0001-000000000005', NULL, '00000000-0000-0000-0001-000000000001', 'Takeout & Delivery','expense', 'package',         '#fed7aa', TRUE, 14),

-- === Shopping (parent) ===
('00000000-0000-0000-0002-000000000001', NULL, NULL, 'Shopping',        'expense', 'shopping-bag',  '#ec4899', TRUE, 20),
('00000000-0000-0000-0002-000000000002', NULL, '00000000-0000-0000-0002-000000000001', 'Clothing',          'expense', 'shirt',           '#ec4899', TRUE, 21),
('00000000-0000-0000-0002-000000000003', NULL, '00000000-0000-0000-0002-000000000001', 'Electronics',       'expense', 'cpu',             '#f472b6', TRUE, 22),
('00000000-0000-0000-0002-000000000004', NULL, '00000000-0000-0000-0002-000000000001', 'Home & Garden',     'expense', 'home',            '#f9a8d4', TRUE, 23),

-- === Transportation (parent) ===
('00000000-0000-0000-0003-000000000001', NULL, NULL, 'Transportation',  'expense', 'car',           '#3b82f6', TRUE, 30),
('00000000-0000-0000-0003-000000000002', NULL, '00000000-0000-0000-0003-000000000001', 'Auto / Fuel',       'expense', 'fuel',            '#3b82f6', TRUE, 31),
('00000000-0000-0000-0003-000000000003', NULL, '00000000-0000-0000-0003-000000000001', 'Public Transit',    'expense', 'bus',             '#60a5fa', TRUE, 32),
('00000000-0000-0000-0003-000000000004', NULL, '00000000-0000-0000-0003-000000000001', 'Parking & Tolls',   'expense', 'parking-circle',  '#93c5fd', TRUE, 33),
('00000000-0000-0000-0003-000000000005', NULL, '00000000-0000-0000-0003-000000000001', 'Ride Share',        'expense', 'navigation',      '#bfdbfe', TRUE, 34),

-- === Housing (parent) ===
('00000000-0000-0000-0004-000000000001', NULL, NULL, 'Housing / Rent',  'expense', 'building-2',   '#8b5cf6', TRUE, 40),
('00000000-0000-0000-0004-000000000002', NULL, '00000000-0000-0000-0004-000000000001', 'Rent / Mortgage',   'expense', 'landmark',        '#8b5cf6', TRUE, 41),
('00000000-0000-0000-0004-000000000003', NULL, '00000000-0000-0000-0004-000000000001', 'Utilities',         'expense', 'zap',             '#a78bfa', TRUE, 42),
('00000000-0000-0000-0004-000000000004', NULL, '00000000-0000-0000-0004-000000000001', 'Internet & Phone',  'expense', 'wifi',            '#c4b5fd', TRUE, 43),
('00000000-0000-0000-0004-000000000005', NULL, '00000000-0000-0000-0004-000000000001', 'Maintenance',       'expense', 'wrench',          '#ddd6fe', TRUE, 44),

-- === Healthcare (parent) ===
('00000000-0000-0000-0005-000000000001', NULL, NULL, 'Healthcare',      'expense', 'heart-pulse',  '#ef4444', TRUE, 50),
('00000000-0000-0000-0005-000000000002', NULL, '00000000-0000-0000-0005-000000000001', 'Medical',           'expense', 'stethoscope',     '#ef4444', TRUE, 51),
('00000000-0000-0000-0005-000000000003', NULL, '00000000-0000-0000-0005-000000000001', 'Pharmacy',          'expense', 'pill',            '#f87171', TRUE, 52),
('00000000-0000-0000-0005-000000000004', NULL, '00000000-0000-0000-0005-000000000001', 'Dental',            'expense', 'smile',           '#fca5a5', TRUE, 53),
('00000000-0000-0000-0005-000000000005', NULL, '00000000-0000-0000-0005-000000000001', 'Vision',            'expense', 'eye',             '#fecaca', TRUE, 54),

-- === Entertainment (parent) ===
('00000000-0000-0000-0006-000000000001', NULL, NULL, 'Entertainment',   'expense', 'tv-2',         '#06b6d4', TRUE, 60),
('00000000-0000-0000-0006-000000000002', NULL, '00000000-0000-0000-0006-000000000001', 'Streaming',         'expense', 'play-circle',     '#06b6d4', TRUE, 61),
('00000000-0000-0000-0006-000000000003', NULL, '00000000-0000-0000-0006-000000000001', 'Movies & Events',   'expense', 'ticket',          '#22d3ee', TRUE, 62),
('00000000-0000-0000-0006-000000000004', NULL, '00000000-0000-0000-0006-000000000001', 'Hobbies',           'expense', 'gamepad-2',       '#67e8f9', TRUE, 63),

-- === Education (parent) ===
('00000000-0000-0000-0007-000000000001', NULL, NULL, 'Education',       'expense', 'graduation-cap','#10b981', TRUE, 70),
('00000000-0000-0000-0007-000000000002', NULL, '00000000-0000-0000-0007-000000000001', 'Tuition & Fees',    'expense', 'university',      '#10b981', TRUE, 71),
('00000000-0000-0000-0007-000000000003', NULL, '00000000-0000-0000-0007-000000000001', 'Books & Supplies',  'expense', 'book-open',       '#34d399', TRUE, 72),
('00000000-0000-0000-0007-000000000004', NULL, '00000000-0000-0000-0007-000000000001', 'Online Courses',    'expense', 'monitor',         '#6ee7b7', TRUE, 73),

-- === Personal Care ===
('00000000-0000-0000-0008-000000000001', NULL, NULL, 'Personal Care',   'expense', 'sparkles',     '#d946ef', TRUE, 80),
('00000000-0000-0000-0008-000000000002', NULL, '00000000-0000-0000-0008-000000000001', 'Hair & Beauty',     'expense', 'scissors',        '#d946ef', TRUE, 81),
('00000000-0000-0000-0008-000000000003', NULL, '00000000-0000-0000-0008-000000000001', 'Gym & Fitness',     'expense', 'dumbbell',        '#e879f9', TRUE, 82),

-- === Travel ===
('00000000-0000-0000-0009-000000000001', NULL, NULL, 'Travel',          'expense', 'plane',        '#0ea5e9', TRUE, 90),
('00000000-0000-0000-0009-000000000002', NULL, '00000000-0000-0000-0009-000000000001', 'Flights',           'expense', 'plane-takeoff',   '#0ea5e9', TRUE, 91),
('00000000-0000-0000-0009-000000000003', NULL, '00000000-0000-0000-0009-000000000001', 'Hotels',            'expense', 'hotel',           '#38bdf8', TRUE, 92),
('00000000-0000-0000-0009-000000000004', NULL, '00000000-0000-0000-0009-000000000001', 'Vacation',          'expense', 'sun',             '#7dd3fc', TRUE, 93),

-- === Insurance ===
('00000000-0000-0000-0010-000000000001', NULL, NULL, 'Insurance',       'expense', 'shield-check', '#78716c', TRUE, 100),
('00000000-0000-0000-0010-000000000002', NULL, '00000000-0000-0000-0010-000000000001', 'Health Insurance',  'expense', 'heart-handshake', '#78716c', TRUE, 101),
('00000000-0000-0000-0010-000000000003', NULL, '00000000-0000-0000-0010-000000000001', 'Auto Insurance',    'expense', 'car-front',       '#a8a29e', TRUE, 102),
('00000000-0000-0000-0010-000000000004', NULL, '00000000-0000-0000-0010-000000000001', 'Home Insurance',    'expense', 'house-plus',      '#d6d3d1', TRUE, 103),
('00000000-0000-0000-0010-000000000005', NULL, '00000000-0000-0000-0010-000000000001', 'Life Insurance',    'expense', 'shield',          '#e7e5e4', TRUE, 104),

-- === Investment ===
('00000000-0000-0000-0011-000000000001', NULL, NULL, 'Investment',      'expense', 'trending-up',  '#16a34a', TRUE, 110),
('00000000-0000-0000-0011-000000000002', NULL, '00000000-0000-0000-0011-000000000001', 'Stocks & ETFs',     'expense', 'bar-chart-2',     '#16a34a', TRUE, 111),
('00000000-0000-0000-0011-000000000003', NULL, '00000000-0000-0000-0011-000000000001', 'Retirement',        'expense', 'piggy-bank',      '#22c55e', TRUE, 112),
('00000000-0000-0000-0011-000000000004', NULL, '00000000-0000-0000-0011-000000000001', 'Crypto',            'expense', 'bitcoin',         '#4ade80', TRUE, 113),

-- === Gifts & Donations ===
('00000000-0000-0000-0012-000000000001', NULL, NULL, 'Gifts & Donations','expense','gift',         '#f59e0b', TRUE, 120),
('00000000-0000-0000-0012-000000000002', NULL, '00000000-0000-0000-0012-000000000001', 'Gifts',             'expense', 'gift',            '#f59e0b', TRUE, 121),
('00000000-0000-0000-0012-000000000003', NULL, '00000000-0000-0000-0012-000000000001', 'Charity',           'expense', 'hand-heart',      '#fbbf24', TRUE, 122),

-- === Subscriptions ===
('00000000-0000-0000-0013-000000000001', NULL, NULL, 'Subscriptions',   'expense', 'repeat',       '#64748b', TRUE, 130),

-- === Miscellaneous ===
('00000000-0000-0000-0014-000000000001', NULL, NULL, 'Miscellaneous',   'expense', 'more-horizontal','#94a3b8', TRUE, 999);

-- ============================================================
-- INCOME CATEGORIES
-- ============================================================

INSERT INTO categories (id, user_id, parent_id, name, type, icon, color, is_default, sort_order) VALUES

('00000000-0000-0000-0100-000000000001', NULL, NULL, 'Salary',            'income', 'briefcase',       '#10b981', TRUE, 10),
('00000000-0000-0000-0100-000000000002', NULL, NULL, 'Business Income',   'income', 'building',        '#059669', TRUE, 20),
('00000000-0000-0000-0100-000000000003', NULL, NULL, 'Freelance',         'income', 'laptop',          '#047857', TRUE, 30),
('00000000-0000-0000-0100-000000000004', NULL, NULL, 'Interest/Dividends','income', 'percent',         '#34d399', TRUE, 40),
('00000000-0000-0000-0100-000000000005', NULL, NULL, 'Refund',            'income', 'undo-2',          '#6ee7b7', TRUE, 50),
('00000000-0000-0000-0100-000000000006', NULL, NULL, 'Rental Income',     'income', 'home',            '#a7f3d0', TRUE, 60),
('00000000-0000-0000-0100-000000000007', NULL, NULL, 'Investment Returns','income', 'trending-up',     '#0d9488', TRUE, 70),
('00000000-0000-0000-0100-000000000008', NULL, NULL, 'Gift Received',     'income', 'gift',            '#14b8a6', TRUE, 80),
('00000000-0000-0000-0100-000000000009', NULL, NULL, 'Other Income',      'income', 'plus-circle',     '#2dd4bf', TRUE, 90);
