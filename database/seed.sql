USE hyderabad_house;

-- 1. ROLES
INSERT INTO roles (id, name, description) VALUES
(1, 'CUSTOMER', 'Direct ordering customer with loyalty and tracking'),
(2, 'KITCHEN_STAFF', 'Kitchen staff for live order processing on KDS'),
(3, 'OUTLET_MANAGER', 'Outlet manager overseeing kitchen workload, items, and prep times'),
(4, 'CENTRAL_ADMIN', 'Central administrator managing menu, pricing, and system-wide settings'),
(5, 'CATERING_MANAGER', 'Catering manager for party orders and bulk inquiries')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- 2. USERS (Password for all demo accounts is 'password123')
-- BCrypt hash: $2b$12$6UEHKg8e7Ji4b2D6FsoXGufDzY6XNcqWqfmyB8835OWj6g629xWUG
INSERT INTO users (id, name, email, phone, password_hash, role_id, is_active) VALUES
(1, 'Central Administrator', 'admin@hyderabadhouse.com', '+919900000001', '$2b$12$6UEHKg8e7Ji4b2D6FsoXGufDzY6XNcqWqfmyB8835OWj6g629xWUG', 4, TRUE),
(2, 'Kondapur Manager', 'manager.kondapur@hyderabadhouse.com', '+919900000002', '$2b$12$6UEHKg8e7Ji4b2D6FsoXGufDzY6XNcqWqfmyB8835OWj6g629xWUG', 3, TRUE),
(3, 'Gachibowli Manager', 'manager.gachibowli@hyderabadhouse.com', '+919900000003', '$2b$12$6UEHKg8e7Ji4b2D6FsoXGufDzY6XNcqWqfmyB8835OWj6g629xWUG', 3, TRUE),
(4, 'Kondapur Chef', 'kitchen.kondapur@hyderabadhouse.com', '+919900000004', '$2b$12$6UEHKg8e7Ji4b2D6FsoXGufDzY6XNcqWqfmyB8835OWj6g629xWUG', 2, TRUE),
(5, 'Gachibowli Cloud Chef', 'kitchen.gachibowli@hyderabadhouse.com', '+919900000005', '$2b$12$6UEHKg8e7Ji4b2D6FsoXGufDzY6XNcqWqfmyB8835OWj6g629xWUG', 2, TRUE),
(6, 'Kukatpally Chef', 'kitchen.kukatpally@hyderabadhouse.com', '+919900000006', '$2b$12$6UEHKg8e7Ji4b2D6FsoXGufDzY6XNcqWqfmyB8835OWj6g629xWUG', 2, TRUE),
(7, 'Catering Manager', 'catering@hyderabadhouse.com', '+919900000007', '$2b$12$6UEHKg8e7Ji4b2D6FsoXGufDzY6XNcqWqfmyB8835OWj6g629xWUG', 5, TRUE),
(8, 'Rahul Sharma', 'customer@hyderabadhouse.com', '+919876543210', '$2b$12$6UEHKg8e7Ji4b2D6FsoXGufDzY6XNcqWqfmyB8835OWj6g629xWUG', 1, TRUE),
(9, 'Fatima Khan', 'fatima.khan@example.com', '+919876543211', '$2b$12$6UEHKg8e7Ji4b2D6FsoXGufDzY6XNcqWqfmyB8835OWj6g629xWUG', 1, TRUE),
(10, 'Vikram Reddy', 'vikram.reddy@example.com', '+919876543212', '$2b$12$6UEHKg8e7Ji4b2D6FsoXGufDzY6XNcqWqfmyB8835OWj6g629xWUG', 1, TRUE);

-- 3. OUTLETS (14 Outlets + 3 Cloud Kitchens across Hyderabad)
INSERT INTO outlets (id, name, code, type, address, latitude, longitude, delivery_radius_km, min_order_amount, min_prep_time_minutes, current_workload_level, is_active, phone) VALUES
(1, 'Hyderabad House - Kondapur', 'HYD-KONDAPUR', 'DINE_IN_TAKEAWAY', 'Plot 42, Hitec City Road, Near KIMS Hospital, Kondapur, Hyderabad', 17.4699000, 78.3578000, 8.50, 199.00, 25, 'NORMAL', TRUE, '+914023450001'),
(2, 'Hyderabad House - Gachibowli Cloud Kitchen', 'HYD-CK-GACHIBOWLI', 'CLOUD_KITCHEN', 'Building 7, DLF Cyber City Lane, Gachibowli, Hyderabad', 17.4401000, 78.3489000, 9.00, 149.00, 20, 'NORMAL', TRUE, '+914023450002'),
(3, 'Hyderabad House - Kukatpally', 'HYD-KUKATPALLY', 'DINE_IN_TAKEAWAY', 'Road No 1, KPHB Colony, Kukatpally, Hyderabad', 17.4933000, 78.3995000, 7.50, 199.00, 25, 'HIGH', TRUE, '+914023450003'),
(4, 'Hyderabad House - Banjara Hills', 'HYD-BANJARA', 'DINE_IN_TAKEAWAY', 'Road No. 12, Opposite Traffic Police Station, Banjara Hills, Hyderabad', 17.4156000, 78.4350000, 8.00, 249.00, 30, 'NORMAL', TRUE, '+914023450004'),
(5, 'Hyderabad House - Jubilee Hills', 'HYD-JUBILEE', 'DINE_IN_TAKEAWAY', 'Road No. 36, Near Peddamma Temple Metro, Jubilee Hills, Hyderabad', 17.4319000, 78.4073000, 8.00, 249.00, 25, 'NORMAL', TRUE, '+914023450005'),
(6, 'Hyderabad House - Madhapur', 'HYD-MADHAPUR', 'DINE_IN_TAKEAWAY', 'Main Road, Ayyappa Society, Madhapur, Hyderabad', 17.4483000, 78.3915000, 7.00, 199.00, 20, 'NORMAL', TRUE, '+914023450006'),
(7, 'Hyderabad House - Manikonda Cloud Kitchen', 'HYD-CK-MANIKONDA', 'CLOUD_KITCHEN', 'Near Puppalguda Golden Temple, Manikonda, Hyderabad', 17.4022000, 78.3750000, 8.00, 149.00, 20, 'NORMAL', TRUE, '+914023450007'),
(8, 'Hyderabad House - Miyapur Cloud Kitchen', 'HYD-CK-MIYAPUR', 'CLOUD_KITCHEN', 'Allwyn X Roads, Miyapur, Hyderabad', 17.4968000, 78.3614000, 8.00, 149.00, 20, 'NORMAL', TRUE, '+914023450008'),
(9, 'Hyderabad House - Begumpet', 'HYD-BEGUMPET', 'DINE_IN_TAKEAWAY', 'Prakash Nagar, Airport Road, Begumpet, Hyderabad', 17.4448000, 78.4661000, 7.50, 199.00, 25, 'NORMAL', TRUE, '+914023450009'),
(10, 'Hyderabad House - Secunderabad', 'HYD-SECUNDERABAD', 'DINE_IN_TAKEAWAY', 'Clock Tower Square, SD Road, Secunderabad', 17.4399000, 78.4983000, 8.00, 199.00, 25, 'NORMAL', TRUE, '+914023450010'),
(11, 'Hyderabad House - Charminar Heritage', 'HYD-CHARMINAR', 'DINE_IN_TAKEAWAY', 'Laad Bazaar Road, Near Charminar, Old City, Hyderabad', 17.3616000, 78.4747000, 6.50, 199.00, 30, 'NORMAL', TRUE, '+914023450011'),
(12, 'Hyderabad House - Himayatnagar', 'HYD-HIMAYATNAGAR', 'DINE_IN_TAKEAWAY', 'Street No 5, Himayatnagar Main Road, Hyderabad', 17.4042000, 78.4872000, 7.00, 199.00, 20, 'NORMAL', TRUE, '+914023450012'),
(13, 'Hyderabad House - Ameerpet', 'HYD-AMEERPET', 'DINE_IN_TAKEAWAY', 'Metro Pillar 1042, Ameerpet, Hyderabad', 17.4375000, 78.4482000, 7.00, 199.00, 20, 'NORMAL', TRUE, '+914023450013'),
(14, 'Hyderabad House - Dilsukhnagar', 'HYD-DILSUKHNAGAR', 'DINE_IN_TAKEAWAY', 'Near Bus Depot, Dilsukhnagar, Hyderabad', 17.3688000, 78.5247000, 7.50, 199.00, 25, 'NORMAL', TRUE, '+914023450014'),
(15, 'Hyderabad House - Mehdipatnam', 'HYD-MEHDIPATNAM', 'DINE_IN_TAKEAWAY', 'Ring Road, Rythu Bazaar Junction, Mehdipatnam, Hyderabad', 17.3916000, 78.4399000, 7.00, 199.00, 20, 'NORMAL', TRUE, '+914023450015'),
(16, 'Hyderabad House - Hitec City Express', 'HYD-HITEC', 'DINE_IN_TAKEAWAY', 'Cyber Towers Intersection, Hitec City, Hyderabad', 17.4504000, 78.3808000, 6.00, 149.00, 15, 'NORMAL', TRUE, '+914023450016'),
(17, 'Hyderabad House - Financial District', 'HYD-FINANCIAL', 'DINE_IN_TAKEAWAY', 'Nanakramguda Circle, Financial District, Hyderabad', 17.4140000, 78.3400000, 7.00, 199.00, 20, 'NORMAL', TRUE, '+914023450017');

-- 4. OUTLET STAFF
INSERT INTO outlet_staff (user_id, outlet_id, role_type) VALUES
(2, 1, 'OUTLET_MANAGER'),
(3, 2, 'OUTLET_MANAGER'),
(4, 1, 'KITCHEN_STAFF'),
(5, 2, 'KITCHEN_STAFF'),
(6, 3, 'KITCHEN_STAFF');

-- 5. CUSTOMER ADDRESSES
INSERT INTO customer_addresses (user_id, label, address_line, landmark, city, postal_code, latitude, longitude, is_default) VALUES
(8, 'Home', 'Flat 402, Royal Palms, Botanical Garden Road, Kondapur', 'Near Botanical Garden Gate 2', 'Hyderabad', '500084', 17.4650000, 78.3600000, TRUE),
(8, 'Work', 'T-Hub Phase 2, Knowledge City, Silpa Gram Craft Village, Madhapur', 'Knowledge City', 'Hyderabad', '500081', 17.4435000, 78.3775000, FALSE),
(9, 'Home', 'Villa 18, Gachibowli Green Meadows, Telecom Nagar, Gachibowli', 'Behind Radisson Hotel', 'Hyderabad', '500032', 17.4410000, 78.3510000, TRUE),
(10, 'Home', 'House 5-3-120, Phase 3, KPHB Colony, Kukatpally', 'Near Shiva Parvathi Theatre', 'Hyderabad', '500072', 17.4920000, 78.3980000, TRUE);

-- 6. MENU CATEGORIES
INSERT INTO menu_categories (id, name, slug, description, display_order, image_url, is_active) VALUES
(1, 'Chicken Biryani', 'chicken-biryani', 'Authentic Nizami slow-cooked dum biryani with marinated tender chicken and fragrant long-grain basmati rice.', 1, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80', TRUE),
(2, 'Mutton Biryani', 'mutton-biryani', 'Royal Hyderabadi mutton dum biryani layered with succulent bone-in lamb and infused with saffron and desi ghee.', 2, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80', TRUE),
(3, 'Veg Biryani', 'veg-biryani', 'Garden fresh vegetables and paneer dum-cooked in aromatic spices and saffron-scented basmati rice.', 3, 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=800&q=80', TRUE),
(4, 'Starters', 'starters', 'Crispy, spiced Hyderabadi appetizers, chicken 65, crispy corn and paneer delicacies.', 4, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&q=80', TRUE),
(5, 'Kebabs', 'kebabs', 'Tandoori and charcoal-grilled skewers with royal marinades and mint chutney.', 5, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80', TRUE),
(6, 'Haleem', 'haleem', 'World-famous GI-tagged Hyderabadi Haleem slow-cooked for 12 hours with pounded wheat, mutton, and pure ghee.', 6, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80', TRUE),
(7, 'Desserts', 'desserts', 'Traditional Nawabi sweet treats including Double Ka Meetha and Shahi Qubani Ka Meetha.', 7, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80', TRUE),
(8, 'Beverages', 'beverages', 'Refreshing Irani Chai, Masala Buttermilk, Mango Lassi and fresh coolers.', 8, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80', TRUE);

-- 7. MENU ITEMS (28 realistic items, prices including 5% GST)
INSERT INTO menu_items (id, category_id, name, description, base_price, is_veg, spice_level, portion_size, image_url, allergen_info, prep_time_minutes, is_active) VALUES
-- Chicken Biryani
(1, 1, 'Chicken Dum Biryani (Single)', 'Classic Hyderabadi chicken dum biryani portion for one, served with mirchi ka salan and dahi ki chutney.', 240.00, FALSE, 'MEDIUM', 'Single (1 piece chicken)', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80', 'Contains Dairy', 20, TRUE),
(2, 1, 'Chicken Dum Biryani (Regular)', 'Signature feast for one hungry food lover with two juicy chicken pieces, boiled egg, mirchi ka salan and raita.', 360.00, FALSE, 'MEDIUM', 'Regular (2 pieces chicken + 1 egg)', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80', 'Contains Dairy, Egg', 25, TRUE),
(3, 1, 'Chicken Dum Biryani (Family Pack)', 'Generous family feast with four succulent chicken pieces, two boiled eggs, double salan and dahi chutney.', 880.00, FALSE, 'MEDIUM', 'Family Pack (Serves 3-4)', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80', 'Contains Dairy, Egg', 30, TRUE),
(4, 1, 'Special Boneless Chicken Biryani', 'Juicy marinated boneless chicken cubes layered over flavorful saffron biryani rice.', 410.00, FALSE, 'SPICY', 'Regular', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80', 'Contains Dairy', 25, TRUE),

-- Mutton Biryani
(5, 2, 'Hyderabadi Mutton Dum Biryani', 'Tender baby goat meat marinated overnight in spices, layered with royal basmati rice and saffron ghee.', 440.00, FALSE, 'MEDIUM', 'Regular', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80', 'Contains Dairy', 25, TRUE),
(6, 2, 'Special Mutton Biryani (Double Gosht)', 'Extra portion of succulent mutton chunks infused with rich Hyderabadi potli masala.', 540.00, FALSE, 'SPICY', 'Regular', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80', 'Contains Dairy', 30, TRUE),
(7, 2, 'Mutton Biryani (Family Pack)', 'King size pot of Mutton Biryani with tender meat pieces, serves 3-4 persons, includes salan and raita.', 1190.00, FALSE, 'MEDIUM', 'Family Pack (Serves 3-4)', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80', 'Contains Dairy', 35, TRUE),

-- Veg Biryani
(8, 3, 'Hyderabadi Veg Dum Biryani', 'Layered fragrant basmati rice with cauliflower, carrots, beans, and aromatic whole spices.', 240.00, TRUE, 'MEDIUM', 'Regular', 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=800&q=80', 'Contains Dairy', 20, TRUE),
(9, 3, 'Paneer Tikka Biryani', 'Smoky clay-oven grilled paneer cubes layered with spicy biryani rice and caramelized onions.', 290.00, TRUE, 'MEDIUM', 'Regular', 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=800&q=80', 'Contains Dairy', 20, TRUE),
(10, 3, 'Mushroom & Corn Dum Biryani', 'Tender button mushrooms and sweet corn kernels cooked dum style with mint and saffron.', 270.00, TRUE, 'MILD', 'Regular', 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=800&q=80', 'Contains Dairy', 20, TRUE),

-- Starters
(11, 4, 'Hyderabadi Chicken 65', 'Iconic deep-fried spiced chicken morsels tossed with curry leaves, green chilies, and yogurt.', 280.00, FALSE, 'SPICY', 'Regular (8-10 pcs)', 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&q=80', 'Contains Dairy', 15, TRUE),
(12, 4, 'Apollo Fish', 'Famous Andhra-Hyderabadi batter-fried fish fillets tossed in spicy garlic red chili sauce.', 340.00, FALSE, 'SPICY', 'Regular', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80', 'Contains Fish', 18, TRUE),
(13, 4, 'Crispy Corn Salt & Pepper', 'Golden crispy American sweet corn tossed with freshly ground pepper and spring onions.', 220.00, TRUE, 'MILD', 'Regular', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80', 'None', 15, TRUE),
(14, 4, 'Paneer 65', 'Crisp cottage cheese cubes coated in authentic spicy batter and tempered with mustard seeds.', 260.00, TRUE, 'SPICY', 'Regular', 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&q=80', 'Contains Dairy', 15, TRUE),

-- Kebabs
(15, 5, 'Tandoori Murgh (Half)', 'Tender chicken marinated in mustard oil, yogurt and Kashmiri spices roasted in clay oven.', 290.00, FALSE, 'MEDIUM', 'Half (4 pcs)', 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80', 'Contains Dairy', 20, TRUE),
(16, 5, 'Murgh Malai Kebab', 'Melt-in-mouth chicken chunks marinated in cream, cheese, cardamom and grilled over charcoal.', 320.00, FALSE, 'MILD', '6 pieces', 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80', 'Contains Dairy, Nuts', 20, TRUE),
(17, 5, 'Mutton Sheekh Kebab', 'Minced spiced mutton mixed with herbs, skewered and cooked to juicy perfection.', 390.00, FALSE, 'SPICY', '4 skewers', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', 'None', 20, TRUE),
(18, 5, 'Tandoori Paneer Tikka', 'Cubes of fresh malai paneer with bell peppers, onions and tandoori masala.', 270.00, TRUE, 'MEDIUM', '6 pieces', 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80', 'Contains Dairy', 18, TRUE),

-- Haleem
(19, 6, 'Royal Hyderabadi Mutton Haleem', 'Authentic GI-tagged delicacy made with broken wheat, tender mutton, lentils, and pure ghee topped with fried onions and cashew.', 350.00, FALSE, 'MEDIUM', '350 ml (Serves 1-2)', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80', 'Contains Gluten, Dairy, Nuts', 15, TRUE),
(20, 6, 'Special Irani Chicken Haleem', 'Light and flavorful chicken haleem cooked slowly with roasted spices, mint and lime.', 290.00, FALSE, 'MEDIUM', '350 ml (Serves 1-2)', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80', 'Contains Gluten, Dairy', 15, TRUE),
(21, 6, 'Hyderabadi Mirchi Ka Salan (Side)', 'Traditional tangy peanut and sesame seed curry with roasted Bhavnagri green chilies.', 160.00, TRUE, 'SPICY', '250 ml', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80', 'Contains Peanuts, Sesame', 10, TRUE),

-- Desserts
(22, 7, 'Double Ka Meetha', 'Royal Hyderabadi bread pudding soaked in saffron cardamom milk, condensed milk and ghee with fried dry fruits.', 150.00, TRUE, 'MILD', 'Single portion', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80', 'Contains Dairy, Gluten, Nuts', 10, TRUE),
(23, 7, 'Shahi Qubani Ka Meetha', 'Traditional stewed apricot dessert garnished with apricot kernels and fresh clotted cream (malai).', 180.00, TRUE, 'MILD', 'Single portion', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80', 'Contains Nuts, Dairy', 10, TRUE),
(24, 7, 'Gulab Jamun (2 pcs)', 'Soft milk-solid dumplings dipped in rose-cardamom sugar syrup.', 90.00, TRUE, 'MILD', '2 pieces', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80', 'Contains Dairy, Gluten', 5, TRUE),

-- Beverages
(25, 8, 'Hyderabadi Irani Chai (Thermos Flask)', 'Rich and creamy slow-simmered Nizami tea served piping hot.', 80.00, TRUE, 'MILD', '250 ml', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80', 'Contains Dairy', 5, TRUE),
(26, 8, 'Masala Buttermilk (Chaas)', 'Cooling churned curd infused with ginger, green chilies, cilantro and roasted cumin.', 60.00, TRUE, 'MILD', '300 ml', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80', 'Contains Dairy', 5, TRUE),
(27, 8, 'Mango Lassi', 'Thick creamy Alphonso mango yogurt beverage served chilled.', 120.00, TRUE, 'MILD', '300 ml', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80', 'Contains Dairy', 5, TRUE),
(28, 8, 'Fresh Lime Soda (Sweet & Salt)', 'Crisp sparkling soda with fresh squeezed lime juice and rock salt.', 70.00, TRUE, 'MILD', '300 ml', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80', 'None', 5, TRUE);

-- 8. OUTLET MENU AVAILABILITY (Populate for Kondapur, Gachibowli, Kukatpally, etc.)
INSERT INTO outlet_menu (outlet_id, menu_item_id, custom_price, is_available, is_featured)
SELECT o.id, m.id, NULL, TRUE, (m.id IN (1, 2, 5, 8, 11, 19, 22))
FROM outlets o CROSS JOIN menu_items m;

-- 9. ADD-ONS
INSERT INTO add_ons (id, menu_item_id, name, price, is_available) VALUES
(1, NULL, 'Extra Mirchi Ka Salan (150ml)', 40.00, TRUE),
(2, NULL, 'Extra Dahi Ki Chutney / Raita', 30.00, TRUE),
(3, NULL, 'Boiled Egg (Single)', 20.00, TRUE),
(4, NULL, 'Crispy Fried Biryani Onions (Birista)', 35.00, TRUE),
(5, NULL, 'Extra Desi Ghee Drizzle', 25.00, TRUE),
(6, NULL, 'Extra Basmati Rice Portion', 90.00, TRUE),
(7, 22, 'Extra Scoop of Malai / Vanilla Ice Cream', 40.00, TRUE),
(8, 23, 'Extra Clotted Malai Garnish', 45.00, TRUE);

-- 10. PRESERVED REQUIRED ORDERS & HISTORICAL SAMPLES
-- Order 1: WEB-778120
-- Kondapur (outlet_id 1), Chicken Dum Biryani family pack × 1, Double Ka Meetha × 2, ₹1,180, UPI, Preparing.
INSERT INTO orders (id, order_number, customer_id, outlet_id, order_type, status, subtotal, tax_amount, delivery_fee, discount_amount, loyalty_discount, total_amount, payment_status, payment_method, delivery_address, customer_name, customer_phone, special_instructions, promised_prep_time_minutes, estimated_ready_time, placed_at, confirmed_at, preparing_at, is_late, late_alert_sent) VALUES
(1, 'WEB-778120', 8, 1, 'DELIVERY', 'PREPARING', 1180.00, 56.19, 0.00, 0.00, 0.00, 1180.00, 'PAID', 'UPI', 'Flat 402, Royal Palms, Botanical Garden Road, Kondapur, Hyderabad', 'Rahul Sharma', '+919876543210', 'Extra salan and spicy', 35, DATE_ADD(NOW(), INTERVAL 15 MINUTE), DATE_SUB(NOW(), INTERVAL 20 MINUTE), DATE_SUB(NOW(), INTERVAL 18 MINUTE), DATE_SUB(NOW(), INTERVAL 12 MINUTE), FALSE, FALSE);

INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, portion_size, unit_price, spice_level, special_instructions, total_price) VALUES
(1, 3, 'Chicken Dum Biryani (Family Pack)', 1, 'Family Pack (Serves 3-4)', 880.00, 'SPICY', 'Extra spicy salan', 880.00),
(1, 22, 'Double Ka Meetha', 2, 'Single portion', 150.00, 'MILD', 'Serve with dry fruits', 300.00);

INSERT INTO payments (order_id, transaction_ref, payment_method, amount, status, gateway_response) VALUES
(1, 'TXN-UPI-778120', 'UPI', 1180.00, 'SUCCESS', '{"upi_id":"rahul@okhdfcbank","bank_ref":"B00192348"}');

INSERT INTO order_status_history (order_id, status, notes, updated_by_user_id, created_at) VALUES
(1, 'PLACED', 'Order placed via website', 8, DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
(1, 'CONFIRMED', 'Order auto-confirmed by Kondapur kitchen', 4, DATE_SUB(NOW(), INTERVAL 18 MINUTE)),
(1, 'PREPARING', 'Biryani dum opened, family pack assembly started', 4, DATE_SUB(NOW(), INTERVAL 12 MINUTE));

-- Order 2: WEB-778131
-- Gachibowli cloud kitchen (outlet_id 2), Veg Biryani × 2, Mirchi Ka Salan × 1, ₹640, Card, Ready for pickup.
INSERT INTO orders (id, order_number, customer_id, outlet_id, order_type, status, subtotal, tax_amount, delivery_fee, discount_amount, loyalty_discount, total_amount, payment_status, payment_method, delivery_address, customer_name, customer_phone, special_instructions, promised_prep_time_minutes, estimated_ready_time, placed_at, confirmed_at, preparing_at, ready_at, is_late, late_alert_sent) VALUES
(2, 'WEB-778131', 9, 2, 'PICKUP', 'READY_FOR_PICKUP', 640.00, 30.48, 0.00, 0.00, 0.00, 640.00, 'PAID', 'CARD', 'Pickup at DLF Cyber City Lane counter', 'Fatima Khan', '+919876543211', 'Pack disposable spoons', 25, DATE_SUB(NOW(), INTERVAL 3 MINUTE), DATE_SUB(NOW(), INTERVAL 28 MINUTE), DATE_SUB(NOW(), INTERVAL 26 MINUTE), DATE_SUB(NOW(), INTERVAL 22 MINUTE), DATE_SUB(NOW(), INTERVAL 3 MINUTE), FALSE, FALSE);

INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, portion_size, unit_price, spice_level, special_instructions, total_price) VALUES
(2, 8, 'Hyderabadi Veg Dum Biryani', 2, 'Regular', 240.00, 'MEDIUM', 'No onion garlic in salan if possible', 480.00),
(2, 21, 'Hyderabadi Mirchi Ka Salan (Side)', 1, '250 ml', 160.00, 'SPICY', NULL, 160.00);

INSERT INTO payments (order_id, transaction_ref, payment_method, amount, status, gateway_response) VALUES
(2, 'TXN-CARD-778131', 'CARD', 640.00, 'SUCCESS', '{"card_last4":"4312","network":"VISA"}');

INSERT INTO order_status_history (order_id, status, notes, updated_by_user_id, created_at) VALUES
(2, 'PLACED', 'Order placed for takeaway', 9, DATE_SUB(NOW(), INTERVAL 28 MINUTE)),
(2, 'CONFIRMED', 'Confirmed by Gachibowli cloud kitchen', 5, DATE_SUB(NOW(), INTERVAL 26 MINUTE)),
(2, 'PREPARING', 'Dishes being packed', 5, DATE_SUB(NOW(), INTERVAL 22 MINUTE)),
(2, 'READY_FOR_PICKUP', 'Order bagged and staged at counter', 5, DATE_SUB(NOW(), INTERVAL 3 MINUTE));

-- Order 3: WEB-778146
-- Kukatpally (outlet_id 3), Mutton Haleem × 3, ₹1,050, UPI, Late by 4 minutes.
INSERT INTO orders (id, order_number, customer_id, outlet_id, order_type, status, subtotal, tax_amount, delivery_fee, discount_amount, loyalty_discount, total_amount, payment_status, payment_method, delivery_address, customer_name, customer_phone, special_instructions, promised_prep_time_minutes, estimated_ready_time, placed_at, confirmed_at, preparing_at, is_late, late_alert_sent) VALUES
(3, 'WEB-778146', 10, 3, 'DELIVERY', 'PREPARING', 1050.00, 50.00, 0.00, 0.00, 0.00, 1050.00, 'PAID', 'UPI', 'House 5-3-120, Phase 3, KPHB Colony, Kukatpally, Hyderabad', 'Vikram Reddy', '+919876543212', 'Extra fried onions and pure ghee garnish', 25, DATE_SUB(NOW(), INTERVAL 4 MINUTE), DATE_SUB(NOW(), INTERVAL 29 MINUTE), DATE_SUB(NOW(), INTERVAL 27 MINUTE), DATE_SUB(NOW(), INTERVAL 23 MINUTE), TRUE, TRUE);

INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, portion_size, unit_price, spice_level, special_instructions, total_price) VALUES
(3, 19, 'Royal Hyderabadi Mutton Haleem', 3, '350 ml (Serves 1-2)', 350.00, 'MEDIUM', 'Extra fried onions on all 3 packs', 1050.00);

INSERT INTO payments (order_id, transaction_ref, payment_method, amount, status, gateway_response) VALUES
(3, 'TXN-UPI-778146', 'UPI', 1050.00, 'SUCCESS', '{"upi_id":"vikram@icici","bank_ref":"B00881923"}');

INSERT INTO order_status_history (order_id, status, notes, updated_by_user_id, created_at) VALUES
(3, 'PLACED', 'Order placed', 10, DATE_SUB(NOW(), INTERVAL 29 MINUTE)),
(3, 'CONFIRMED', 'Kitchen accepted', 6, DATE_SUB(NOW(), INTERVAL 27 MINUTE)),
(3, 'PREPARING', 'Haleem deg opening delayed due to rush', 6, DATE_SUB(NOW(), INTERVAL 23 MINUTE));

-- Additional Sample Completed Orders to populate rich analytics
INSERT INTO orders (id, order_number, customer_id, outlet_id, order_type, status, subtotal, tax_amount, delivery_fee, discount_amount, loyalty_discount, total_amount, payment_status, payment_method, delivery_address, customer_name, customer_phone, special_instructions, promised_prep_time_minutes, estimated_ready_time, placed_at, confirmed_at, preparing_at, ready_at, handed_off_at, completed_at, is_late) VALUES
(4, 'WEB-777010', 8, 1, 'DELIVERY', 'COMPLETED', 600.00, 28.57, 0.00, 50.00, 0.00, 550.00, 'PAID', 'UPI', 'Flat 402, Royal Palms, Kondapur', 'Rahul Sharma', '+919876543210', NULL, 25, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), FALSE),
(5, 'WEB-777025', 9, 2, 'DELIVERY', 'COMPLETED', 880.00, 41.90, 0.00, 0.00, 0.00, 880.00, 'PAID', 'CARD', 'Villa 18, Gachibowli Green Meadows', 'Fatima Khan', '+919876543211', NULL, 30, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), FALSE),
(6, 'WEB-777038', 10, 4, 'PICKUP', 'COMPLETED', 1450.00, 69.05, 0.00, 100.00, 0.00, 1350.00, 'PAID', 'UPI', 'Road No. 12, Banjara Hills', 'Vikram Reddy', '+919876543212', NULL, 30, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), FALSE);

INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, portion_size, unit_price, spice_level, special_instructions, total_price) VALUES
(4, 2, 'Chicken Dum Biryani (Regular)', 1, 'Regular', 360.00, 'MEDIUM', NULL, 360.00),
(4, 1, 'Chicken Dum Biryani (Single)', 1, 'Single', 240.00, 'MEDIUM', NULL, 240.00),
(5, 3, 'Chicken Dum Biryani (Family Pack)', 1, 'Family Pack', 880.00, 'MEDIUM', NULL, 880.00),
(6, 5, 'Hyderabadi Mutton Dum Biryani', 2, 'Regular', 440.00, 'MEDIUM', NULL, 880.00),
(6, 11, 'Hyderabadi Chicken 65', 1, 'Regular', 280.00, 'SPICY', NULL, 280.00),
(6, 17, 'Mutton Sheekh Kebab', 1, '4 skewers', 390.00, 'SPICY', NULL, 390.00);

-- 11. COUPONS
INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount, valid_from, valid_until, is_active) VALUES
(1, 'HYD100', 'Flat ₹100 discount on orders above ₹499', 'FIXED', 100.00, 499.00, 100.00, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 60 DAY), TRUE),
(2, 'BIRYANI50', 'Flat ₹50 off on orders above ₹299', 'FIXED', 50.00, 299.00, 50.00, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 60 DAY), TRUE),
(3, 'NIZAM20', '20% discount up to ₹150 for royal members', 'PERCENTAGE', 20.00, 399.00, 150.00, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 60 DAY), TRUE);

-- 12. LOYALTY ACCOUNTS
INSERT INTO loyalty_accounts (id, user_id, points_balance, lifetime_points_earned, tier) VALUES
(1, 8, 350, 650, 'SILVER'),
(2, 9, 820, 1400, 'GOLD'),
(3, 10, 150, 250, 'BRONZE');

INSERT INTO loyalty_transactions (account_id, order_id, transaction_type, points, description) VALUES
(1, 4, 'EARNED', 55, 'Points earned for order WEB-777010'),
(2, 5, 'EARNED', 88, 'Points earned for order WEB-777025'),
(3, 6, 'EARNED', 135, 'Points earned for order WEB-777038');

-- 13. PARTY ORDERS
INSERT INTO party_orders (id, customer_name, phone_number, email, event_date, event_time, number_of_guests, outlet_id, food_selections_json, estimated_budget, special_instructions, status, catering_manager_notes) VALUES
(1, 'CyberTech Solutions Annual Meet', '+919876543210', 'hr@cybertechhyd.com', DATE_ADD(CURDATE(), INTERVAL 10 DAY), '19:30', 80, 1, '[{"item":"Chicken Dum Biryani (Family Pack)","qty":20},{"item":"Apollo Fish","qty":15},{"item":"Double Ka Meetha","qty":80}]', 35000.00, 'Requires chafing dishes and live service staff.', 'APPROVED', 'Confirmed date. Kondapur outlet team notified. 50% advance received.'),
(2, 'Ananya Birthday Celebration', '+919876543211', 'fatima.khan@example.com', DATE_ADD(CURDATE(), INTERVAL 14 DAY), '13:00', 35, 5, '[{"item":"Mutton Dum Biryani","qty":25},{"item":"Paneer Tikka Biryani","qty":10},{"item":"Shahi Qubani Ka Meetha","qty":35}]', 18500.00, 'Mild spice level for kids section.', 'PENDING', 'Under review for Jubilee Hills banquet delivery.');

-- 14. NOTIFICATIONS
INSERT INTO notifications (user_id, order_id, outlet_id, title, message, type, is_read) VALUES
(8, 1, 1, 'Order Confirmed!', 'Your order WEB-778120 has been confirmed by Hyderabad House Kondapur and is now being prepared.', 'PREPARING', FALSE),
(9, 2, 2, 'Order Ready for Pickup!', 'Your order WEB-778131 is packed and ready at Gachibowli Cloud Kitchen counter.', 'READY', FALSE),
(10, 3, 3, 'Prep Update: Order Experiencing Slight Delay', 'Your order WEB-778146 is currently in dum pot opening. Promised time extended by 4 mins. Our chef is ensuring the finest aroma.', 'LATE_ALERT', FALSE),
(2, 3, 3, 'Late Order Alert: WEB-778146', 'Order WEB-778146 at Kukatpally is 4 minutes past promised time. Please prioritize dispatch.', 'LATE_ALERT', FALSE);

-- 15. PREP HISTORY (50+ rows for Scikit-learn AI training)
INSERT INTO prep_history (outlet_id, menu_category, total_quantity, item_count, current_pending_orders, actual_prep_time_minutes) VALUES
(1, 'Chicken Biryani', 1, 1, 2, 18),
(1, 'Chicken Biryani', 2, 2, 4, 22),
(1, 'Chicken Biryani', 4, 2, 6, 28),
(1, 'Mutton Biryani', 1, 1, 3, 22),
(1, 'Mutton Biryani', 3, 2, 7, 32),
(1, 'Veg Biryani', 1, 1, 1, 15),
(1, 'Veg Biryani', 2, 2, 5, 20),
(1, 'Starters', 2, 1, 3, 14),
(1, 'Kebabs', 3, 2, 5, 24),
(1, 'Haleem', 2, 1, 4, 12),
(1, 'Haleem', 4, 2, 8, 18),
(2, 'Chicken Biryani', 1, 1, 1, 16),
(2, 'Chicken Biryani', 2, 2, 3, 20),
(2, 'Mutton Biryani', 2, 1, 4, 24),
(2, 'Veg Biryani', 2, 2, 2, 18),
(2, 'Starters', 1, 1, 2, 12),
(2, 'Kebabs', 2, 2, 3, 18),
(2, 'Haleem', 3, 1, 5, 15),
(3, 'Chicken Biryani', 2, 1, 5, 25),
(3, 'Chicken Biryani', 4, 2, 9, 34),
(3, 'Mutton Biryani', 2, 2, 8, 30),
(3, 'Mutton Biryani', 3, 1, 10, 35),
(3, 'Haleem', 3, 1, 9, 29),
(3, 'Starters', 2, 2, 6, 20),
(4, 'Chicken Biryani', 2, 1, 3, 22),
(4, 'Mutton Biryani', 2, 2, 4, 28),
(4, 'Kebabs', 4, 2, 6, 26),
(5, 'Chicken Biryani', 3, 2, 5, 25),
(5, 'Mutton Biryani', 3, 2, 6, 30),
(6, 'Chicken Biryani', 1, 1, 2, 17),
(6, 'Starters', 3, 2, 4, 18),
(7, 'Veg Biryani', 2, 1, 2, 16),
(8, 'Chicken Biryani', 2, 1, 3, 20),
(9, 'Mutton Biryani', 2, 1, 4, 25),
(10, 'Chicken Biryani', 4, 2, 7, 30),
(11, 'Haleem', 4, 2, 6, 20),
(12, 'Chicken Biryani', 2, 1, 3, 21),
(13, 'Kebabs', 2, 1, 4, 20),
(14, 'Mutton Biryani', 3, 2, 6, 29),
(15, 'Chicken Biryani', 2, 1, 4, 23);

-- 16. CUSTOMER MARKETING PREFERENCES (DPDP Act 2023 Compliant)
INSERT INTO customer_marketing_preferences (user_id, email_promotions, sms_promotions, whatsapp_updates, consent_timestamp, privacy_policy_version) VALUES
(8, TRUE, FALSE, TRUE, NOW(), 'v1.0-2024'),
(9, FALSE, FALSE, TRUE, NOW(), 'v1.0-2024'),
(10, FALSE, FALSE, FALSE, NOW(), 'v1.0-2024');
