-- Záloha databáze tinicash před migrací sort_order
-- Vytvořeno: 2026-09-09T19:00:30.467Z

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `numbered` tinyint(1) NOT NULL DEFAULT 0,
  `color` varchar(7) DEFAULT NULL,
  `addon_category_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_cat_addon` (`addon_category_id`),
  CONSTRAINT `fk_cat_addon` FOREIGN KEY (`addon_category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (1, 'Polévky Saláty', 0, '#1565C0', NULL);
INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (2, 'Pizza', 0, '#7B1FA2', 7);
INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (3, 'Spaghetti AlForno', 0, '#2E7D32', 7);
INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (4, 'Penne Tortellini Gnocchi', 0, '#6A1B9A', 7);
INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (5, 'Masa', 0, '#00838F', 8);
INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (6, 'Dezerty Poháry', 0, '#AD1457', NULL);
INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (7, 'Přídavky na pizzu', 0, '#4527A0', NULL);
INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (8, 'Přílohy', 0, '#558B2F', NULL);
INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (9, 'Aperitivy Destiláty', 0, '#BF360C', NULL);
INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (10, 'Whisky Bourbon', 0, '#00695C', NULL);
INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (11, 'Vína Sekty', 0, '#283593', NULL);
INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (12, 'Piva Nealko Juice', 0, '#c2185b', NULL);
INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (13, 'Káva Teplé nápoje', 0, '#1565C0', NULL);
INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (14, 'Vinný lístek', 0, '#7B1FA2', NULL);
INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (15, 'Menu Jaky', 1, '#2E7D32', NULL);
INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES (16, 'Menu Tony', 1, '#6A1B9A', NULL);

DROP TABLE IF EXISTS `closings`;
CREATE TABLE `closings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `closed_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `closings` (`id`, `closed_at`) VALUES (97, '2026-09-09 17:59:08');
INSERT INTO `closings` (`id`, `closed_at`) VALUES (98, '2026-09-09 18:05:41');

DROP TABLE IF EXISTS `item_closings`;
CREATE TABLE `item_closings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `closed_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `item_closings` (`id`, `closed_at`) VALUES (11, '2026-09-09 18:05:56');

DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` decimal(5,2) NOT NULL DEFAULT 1.00,
  `unit_price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `fk_oi_product` (`product_id`),
  CONSTRAINT `fk_oi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1535 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`) VALUES (1526, 405, 15, '1.00', '200.00');
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`) VALUES (1527, 406, 15, '1.00', '200.00');
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`) VALUES (1528, 407, 8, '1.00', '200.00');
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`) VALUES (1529, 408, 21, '1.00', '200.00');
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`) VALUES (1530, 408, 1090, '1.00', '30.00');
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`) VALUES (1531, 409, 15, '1.00', '200.00');
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`) VALUES (1532, 410, 15, '1.00', '200.00');
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`) VALUES (1533, 411, 21, '1.00', '200.00');
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `unit_price`) VALUES (1534, 412, 1041, '1.00', '320.00');

DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `table_number` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `total_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `closed_at` datetime DEFAULT NULL,
  `payment_type` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=413 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `orders` (`id`, `table_number`, `created_at`, `total_price`, `status`, `closed_at`, `payment_type`) VALUES (405, 25, '2026-09-09 17:55:23', '200.00', 'closed', '2026-09-09 17:55:24', 'takeaway');
INSERT INTO `orders` (`id`, `table_number`, `created_at`, `total_price`, `status`, `closed_at`, `payment_type`) VALUES (406, 25, '2026-09-09 17:56:05', '200.00', 'closed', '2026-09-09 17:56:07', 'cash');
INSERT INTO `orders` (`id`, `table_number`, `created_at`, `total_price`, `status`, `closed_at`, `payment_type`) VALUES (407, 25, '2026-09-09 17:57:29', '200.00', 'closed', '2026-09-09 17:57:30', 'takeaway');
INSERT INTO `orders` (`id`, `table_number`, `created_at`, `total_price`, `status`, `closed_at`, `payment_type`) VALUES (408, 24, '2026-09-09 17:58:12', '230.00', 'closed', '2026-09-09 17:58:14', 'takeaway');
INSERT INTO `orders` (`id`, `table_number`, `created_at`, `total_price`, `status`, `closed_at`, `payment_type`) VALUES (409, 25, '2026-09-09 18:05:09', '200.00', 'closed', '2026-09-09 18:05:10', 'takeaway');
INSERT INTO `orders` (`id`, `table_number`, `created_at`, `total_price`, `status`, `closed_at`, `payment_type`) VALUES (410, 25, '2026-09-09 18:16:12', '200.00', 'closed', '2026-09-09 18:16:25', 'cash');
INSERT INTO `orders` (`id`, `table_number`, `created_at`, `total_price`, `status`, `closed_at`, `payment_type`) VALUES (411, 25, '2026-09-09 18:21:59', '200.00', 'closed', '2026-09-09 18:22:01', 'takeaway');
INSERT INTO `orders` (`id`, `table_number`, `created_at`, `total_price`, `status`, `closed_at`, `payment_type`) VALUES (412, 23, '2026-09-09 18:30:17', '320.00', 'closed', '2026-09-09 18:30:19', 'takeaway');

DROP TABLE IF EXISTS `product_categories`;
CREATE TABLE `product_categories` (
  `product_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  PRIMARY KEY (`product_id`,`category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `fk_pc_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (3, 1);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (4, 1);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (5, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (6, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (7, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (8, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (9, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (10, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (11, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (12, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (13, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (14, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (15, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (16, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (17, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (18, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (19, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (20, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (21, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (22, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (23, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (24, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (25, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (26, 3);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (27, 3);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (28, 3);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (29, 3);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (30, 3);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (31, 3);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (32, 3);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (33, 3);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (34, 3);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (35, 3);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (36, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (37, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (38, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (39, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (40, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (41, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (42, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (43, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (44, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (45, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (46, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (47, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (48, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (49, 5);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (50, 5);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (51, 5);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (52, 5);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (53, 5);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (54, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (55, 1);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (56, 1);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (57, 1);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (58, 1);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (59, 8);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (60, 8);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (61, 8);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (62, 8);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (63, 8);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (64, 8);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (65, 8);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (66, 6);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (602, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (603, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (604, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (605, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (606, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (607, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (608, 4);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (609, 5);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (610, 5);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (611, 5);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (612, 5);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (613, 5);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (614, 5);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (615, 5);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (616, 1);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (617, 1);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (618, 3);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (620, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (621, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (622, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (623, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (624, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (625, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (626, 2);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (661, 1);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (662, 1);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (800, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (801, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (802, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (803, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (804, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (805, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (806, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (807, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (808, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (809, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (810, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (811, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (812, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (813, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (814, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (815, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (816, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (817, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (818, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (819, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (820, 7);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (900, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (901, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (902, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (903, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (904, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (905, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (906, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (907, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (908, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (909, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (910, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (911, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (912, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (913, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (914, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (915, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (916, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (917, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (918, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (919, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (920, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (921, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (922, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (923, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (924, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (925, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (926, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (927, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (928, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (929, 15);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (950, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (951, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (952, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (953, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (954, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (955, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (956, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (957, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (958, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (959, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (960, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (961, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (962, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (963, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (964, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (965, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (966, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (967, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (968, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (969, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (970, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (971, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (972, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (973, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (974, 16);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1001, 9);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1009, 9);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1012, 9);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1013, 9);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1015, 9);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1017, 9);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1018, 9);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1019, 9);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1020, 9);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1023, 9);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1026, 14);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1027, 14);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1029, 14);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1031, 14);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1032, 14);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1034, 14);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1035, 14);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1037, 14);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1041, 14);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1042, 14);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1046, 10);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1047, 10);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1048, 10);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1051, 11);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1052, 11);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1053, 11);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1065, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1066, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1067, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1068, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1069, 9);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1070, 11);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1072, 11);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1073, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1074, 11);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1080, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1081, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1083, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1084, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1085, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1086, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1089, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1090, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1091, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1113, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1121, 13);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1122, 13);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1123, 13);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1124, 13);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1125, 13);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1126, 13);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1129, 13);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1130, 13);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1131, 13);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1132, 13);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1134, 13);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1135, 13);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1157, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1158, 12);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1200, 6);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1201, 6);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1202, 6);
INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES (1203, 6);

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `print_kitchen` tinyint(1) NOT NULL DEFAULT 1,
  `sort_group` varchar(50) DEFAULT NULL,
  `sort_order` int(11) DEFAULT NULL,
  `vat_rate` tinyint(4) NOT NULL DEFAULT 12,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (3, 'Zeleninová polévka', '50.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (4, 'Rajská polévka', '50.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (5, 'PIZZA Margarita', '180.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (6, 'PIZZA Al Funghi', '190.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (7, 'PIZZA Šunková', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (8, 'PIZZA Capricciosa', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (9, 'PIZZA Brokolicová', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (10, 'PIZZA Tonno', '210.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (11, 'PIZZA Spinaci', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (12, 'PIZZA Romana', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (13, 'PIZZA Vegetariana', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (14, 'PIZZA Bolognese', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (15, 'PIZZA Formaggi', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (16, 'PIZZA Stagioni', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (17, 'PIZZA Mexicana', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (18, 'PIZZA Hawai', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (19, 'PIZZA Peperonni', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (20, 'PIZZA Calzone', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (21, 'PIZZA Alcapone', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (22, 'PIZZA Pollo', '220.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (23, 'PIZZA Marinara', '220.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (24, 'PIZZA Pinocchio', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (25, 'PIZZA Parma', '220.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (26, 'SPAGHETTI Al Pomodoro', '150.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (27, 'SPAGHETTI Spinaci', '160.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (28, 'SPAGHETTI Al Funghi', '160.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (29, 'SPAGHETTI Pollo', '200.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (30, 'SPAGHETTI Bolognese', '160.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (31, 'SPAGHETTI Carbonara', '160.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (32, 'SPAGHETTI Napolitana', '160.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (33, 'SPAGHETTI Al Tono', '200.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (34, 'AL FORNO Zapečené penne', '200.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (35, 'AL FORNO Penne Quattro Formaggi', '200.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (36, 'PENNE Al Pomodoro', '150.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (37, 'PENNE Al Proscuito E Funghi', '160.00', 1, 1, '', 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (38, 'PENNE Spinaci', '160.00', 1, 1, '', 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (39, 'PENNE Luciana', '200.00', 1, 1, '', 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (40, 'PENNE Bolognese', '160.00', 1, 1, '', 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (41, 'PENNE Al Tono', '200.00', 1, 1, '', 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (42, 'TORTELLINI Spinaci', '200.00', 1, 1, '', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (43, 'TORTELLINI Al Funghi', '200.00', 1, 1, '', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (44, 'TORTELLINI Al Pastico', '200.00', 1, 1, '', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (45, 'GNOCCHI Al Pomodoro', '170.00', 1, 1, '', 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (46, 'GNOCCHI Tomata Funghi', '170.00', 1, 1, '', 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (47, 'GNOCCHI Al Quattro Formaggi', '170.00', 1, 1, '', 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (48, 'GNOCCHI Al la Sorrentina', '170.00', 1, 1, '', 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (49, 'Scaloppina Funghi', '219.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (50, 'Scaloppina Natur', '219.00', 1, 1, '', 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (51, 'Scaloppina Pfeffer', '219.00', 1, 1, '', 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (52, 'Kuřecí Gorgonzola', '200.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (53, 'La Piazza', '200.00', 1, 1, '', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (54, 'PIZZA Brusinková Hermelino', '210.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (55, 'Šopský Salát', '98.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (56, 'Řecký Salát', '160.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (57, 'Tuňákový Salát', '180.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (58, 'Island Salát', '200.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (59, 'Hranolky', '50.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (60, 'Krokety', '60.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (61, 'Americké Brambory', '60.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (62, 'Špenát', '60.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (63, 'Pizza Chleba', '120.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (64, 'Tatarka', '20.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (65, 'Kečup', '20.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (66, 'Medovník', '60.00', 1, 1, NULL, 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (400, 'BAR', '0.00', 1, 0, NULL, NULL, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (401, 'KUCHYŇ', '0.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (570, 'Krabice', '10.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (602, 'PIZZA Salami', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (603, 'PIZZA Jarina', '220.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (604, 'PIZZA Vullcano', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (605, 'PIZZA Klodi', '220.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (606, 'TORTELLINI Al Quatro Formaggi', '200.00', 1, 1, '', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (607, 'GNOCCHI Al Spinaci', '170.00', 1, 1, '', 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (608, 'GNOCCHI Al Funghi', '170.00', 1, 1, '', 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (609, 'Scaloppina Gorgonzola', '219.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (610, 'Kuřecí Natur', '200.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (611, 'Kuřecí Al Funghi', '200.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (612, 'Kuřecí Řízek', '190.00', 1, 1, NULL, 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (613, 'Kuřecí Kapsa', '200.00', 1, 1, NULL, 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (614, 'Smažený sýr, hranolky, tatarka', '170.00', 1, 1, NULL, 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (615, 'Smažený camembert, hranolky, tatarka', '170.00', 1, 1, NULL, 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (616, 'Pollo Salát', '180.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (617, 'Italia Salát', '160.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (618, 'AL FORNO Gnocchi Pampalini', '200.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (620, 'PIZZA Kokoroška', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (621, 'PIZZA Karma', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (622, 'PIZZA Brusinková Pollo', '220.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (623, 'PIZZA Primavera', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (624, 'PIZZA Hermelino', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (625, 'PIZZA Olivová', '200.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (626, 'PIZZA Kozí', '240.00', 1, 1, NULL, NULL, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (661, 'Casa', '200.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (662, 'Cesar Salát', '200.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (700, 'SMETANOVÝ ZÁKLAD', '0.00', 1, 1, NULL, NULL, 0);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (701, 'PROPEČENÁ', '0.00', 1, 1, NULL, NULL, 0);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (702, 'ČESNEK', '0.00', 1, 1, NULL, NULL, 0);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (703, 'BEZ OBLOHY', '0.00', 1, 1, NULL, NULL, 0);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (704, 'BEZ SÝRU', '0.00', 1, 1, NULL, NULL, 0);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (705, 'ZAPÉCT', '0.00', 1, 1, NULL, NULL, 0);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (800, 'Přídavek špenát', '35.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (801, 'Přídavek kukuřice', '25.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (802, 'Přídavek olivy', '25.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (803, 'Přídavek žampiony', '25.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (804, 'Přídavek salám', '35.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (805, 'Přídavek šunka', '35.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (806, 'Přídavek hermelín', '35.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (807, 'Přídavek parmazán', '35.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (808, 'Přídavek mozzarela', '35.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (809, 'Přídavek kuře', '40.00', 1, 1, NULL, 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (810, 'Přídavek niva', '35.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (811, 'Přídavek uzený sýr', '35.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (812, 'Přídavek vejce', '25.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (813, 'Přídavek cibule', '25.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (814, 'Přídavek jalapenos', '25.00', 1, 1, NULL, 1, 15);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (815, 'Přídavek paprika', '25.00', 1, 1, NULL, 1, 15);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (816, 'Přídavek chorizo', '35.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (817, 'Přídavek slanina', '35.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (818, 'Přídavek obloha', '35.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (819, 'Přídavek brusinky', '25.00', 1, 1, NULL, 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (820, 'Přídavek brokolice', '35.00', 1, 1, NULL, 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (900, '//Polévka rajská', '30.00', 1, 1, 'POLEVKA', 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (901, '//Polévka bolognese', '40.00', 1, 1, 'POLEVKA', 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (902, '//Pizza šunková + cibule', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (903, '//Pizza 4 druhy sýra', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (904, '//Pizza žampionová', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (905, '//Pizza salám + kukuřice', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (906, '//Pizza s mletým masem + feferonky', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (907, '//Pizza šunková + žampiony na smetaně', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (908, '//Pizza pikantní salám + olivy', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (909, '//Pizza slanina + žampiony na smetaně', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (910, '//Pizza šunková + salám na smetaně', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (911, '//Pizza šunková + ananas', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (912, '//Pizza pikantní salám + hermelín', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (913, '//Pizza slanina + papriky', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (914, '//Pizza slanina + vejce', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (915, '//Pizza špenátová', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (916, '//Pizza pikantní salám + rajčata', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (917, '//Pizza šunková + olivy', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (918, '//Pizza kuřecí maso + niva', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (919, '//Pizza šunková + kukuřice', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (920, '//Salát s kuřecím masem + domácí bochánek', '150.00', 1, 1, 'SALATY', 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (921, '//Penne s kuřecím masem na smetaně', '150.00', 1, 1, 'PENNE', 4, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (922, '//Penne s mletým masem na smetaně', '150.00', 1, 1, 'PENNE', 4, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (923, '//Penne 4 druhy sýra', '150.00', 1, 1, 'PENNE', 4, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (924, '//Penne se šunkou a žampiony na smetaně', '150.00', 1, 1, 'PENNE', 4, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (925, '//Zapečené penne bolognese', '150.00', 1, 1, 'PENNE', 4, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (926, '//Kuřecí plátek + sýrová omáčka + hranolky', '180.00', 1, 1, 'MASA', 5, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (927, '//Kuřecí Řízek + hranolky + tatarka', '180.00', 1, 1, 'MASA', 5, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (928, '//Kuřecí plátek + žampionová omáčka + hranolky', '180.00', 1, 1, 'MASA', 5, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (929, '//Kuřecí plátek + špenát + hranolky', '180.00', 1, 1, 'MASA', 5, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (950, '//Rajská polévka', '30.00', 1, 1, 'POLEVKA', 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (951, '//Polévka Minestrone', '40.00', 1, 1, 'POLEVKA', 1, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (952, '/Pizza šunka s žampiony', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (953, '/Pizza čtyři druhy sýra na smetanovém základě', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (954, '/Pizza (slanina, cibule, kukuřice)', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (955, '/Pizza Hawai', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (956, '/Pizza salami s kukuřicí', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (957, '/Pizza šunka s olivy', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (958, '/Pizza Margarita s vejcem a kukuřicí', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (959, '/Pizza s pikantním salámem a paprikou', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (960, '/Pizza s tuňákem a cibulí', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (961, '/Pizza špenátová', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (962, '/Pizza s šunkou a salámem', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (963, '/Pizza se salámem a jalapeños', '150.00', 1, 1, 'PIZZA', 2, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (964, '/Řecký salát', '150.00', 1, 1, 'SALATY', 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (965, '/Ceasar salát', '150.00', 1, 1, 'SALATY', 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (966, '/Italia salát', '150.00', 1, 1, 'SALATY', 3, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (967, '/Penne s šunkou a žampiony na smetaně', '150.00', 1, 1, 'PENNE', 4, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (968, '/Penne Pomodoro', '150.00', 1, 1, 'PENNE', 4, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (969, '/Gnocchi s šunkou, žampiony a kukuřicí', '150.00', 1, 1, 'PENNE', 4, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (970, '/Tortellini čtyři druhy sýra', '150.00', 1, 1, 'PENNE', 4, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (971, '/Kuřecí plátek s gorgonzolovou omáčkou a hranolky', '180.00', 1, 1, 'MASA', 5, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (972, '/Vepřová panenka s žampionovou omáčkou a hranolky', '180.00', 1, 1, 'MASA', 5, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (973, '/Vepřová panenka s pepřovou omáčkou a hranolky', '180.00', 1, 1, 'MASA', 5, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (974, '/Kuřecí řízek s hranolky a tatarkou', '180.00', 1, 1, 'MASA', 5, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1001, 'Cinzano Bianco', '70.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1009, 'Vodka Finlandia', '50.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1012, 'Jägermeister', '70.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1013, 'Becherovka', '60.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1015, 'Fernet', '50.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1017, 'Rum tuzemský 40%', '45.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1018, 'Slivovice Jelínek', '60.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1019, 'Beefeater Gin', '60.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1020, 'Tequilla Sierra Silver', '70.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1023, 'Berentzen', '45.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1026, 'Veltlínské zelené', '250.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1027, 'Rulandské šedé', '260.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1029, 'Modrý Portugal', '260.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1031, 'Sauvignon', '380.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1032, 'Tramín červený', '380.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1034, 'Pálava', '440.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1035, 'Cabernet Sauvignon', '380.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1037, 'Pinot Grigio', '320.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1041, 'Montepulciano', '320.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1042, 'Prosecco', '350.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1046, 'Jameson', '60.00', 1, 0, NULL, NULL, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1047, 'Tullamore Dew', '60.00', 1, 0, NULL, NULL, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1048, 'Jack Daniels', '70.00', 1, 0, NULL, NULL, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1051, 'Bílé odrůdové víno', '60.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1052, 'Irsai sladké (bílé)', '70.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1053, 'Červené odrůdové víno', '60.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1065, 'Malinovka 0,3l', '35.00', 1, 0, NULL, 3, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1066, 'Radegast 12 0,5l', '50.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1067, 'Radegast 12 0,3l', '40.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1068, 'Domácí limonáda', '70.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1069, 'Aperol', '85.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1070, 'Lambrusco Rosso', '250.00', 1, 0, NULL, 3, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1072, 'Frizzantino bílé', '70.00', 1, 0, NULL, 4, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1073, 'Pivo nealko 0,5l', '45.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1074, 'Bohemia sekt', '250.00', 1, 0, NULL, 5, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1080, 'Malinovka 0,5l', '45.00', 1, 0, NULL, 3, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1081, 'Birell Pomelo 0,5l', '45.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1083, 'Coca-cola', '45.00', 1, 0, NULL, NULL, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1084, 'Coca-Cola zero', '45.00', 1, 0, NULL, NULL, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1085, 'Sprite', '45.00', 1, 0, NULL, NULL, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1086, 'Fanta', '45.00', 1, 0, NULL, NULL, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1089, 'Kinley Tonic', '45.00', 1, 0, NULL, NULL, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1090, 'Voda jemně', '30.00', 1, 0, NULL, 4, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1091, 'Voda neperlivá', '30.00', 1, 0, NULL, 4, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1113, 'Juice', '45.00', 1, 0, NULL, 5, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1121, 'Espresso velké', '45.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1122, 'Espresso Piccolo malé', '40.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1123, 'Cappuccino', '55.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1124, 'Káva latte', '60.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1125, 'Káva turecká', '40.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1126, 'Káva vídeňská', '55.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1129, 'Ledová káva', '65.00', 1, 0, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1130, 'Čaj', '45.00', 1, 0, NULL, 3, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1131, 'Horký juice', '55.00', 1, 0, NULL, 3, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1132, 'Med', '15.00', 1, 0, NULL, 3, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1134, 'Svařené víno', '55.00', 1, 0, NULL, 3, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1135, 'Mléko do kávy', '5.00', 1, 0, NULL, 2, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1157, 'Ledový čaj', '45.00', 1, 0, NULL, NULL, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1158, 'Kohoutková voda 0,5l', '30.00', 1, 0, NULL, 4, 12);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1200, 'POHÁR Zmrzlina s malinami', '80.00', 1, 1, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1201, 'POHÁR Vanilková romance', '80.00', 1, 1, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1202, 'POHÁR Míchaný pohár', '80.00', 1, 1, NULL, 1, 21);
INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES (1203, 'Kopeček zmrzliny', '30.00', 1, 1, NULL, 2, 21);

DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `skey` varchar(50) NOT NULL,
  `svalue` text DEFAULT NULL,
  PRIMARY KEY (`skey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `settings` (`skey`, `svalue`) VALUES ('shop_address', 'Prazska 14, Prelouc');
INSERT INTO `settings` (`skey`, `svalue`) VALUES ('shop_ico', '25642006');
INSERT INTO `settings` (`skey`, `svalue`) VALUES ('shop_name', 'PIZZERIA PINOCCHIO');
INSERT INTO `settings` (`skey`, `svalue`) VALUES ('shop_phone', '+420 466 959 048');
INSERT INTO `settings` (`skey`, `svalue`) VALUES ('takeaway_numbers', '16,17,18,19,23,24,25');
INSERT INTO `settings` (`skey`, `svalue`) VALUES ('valid_tables', '1-15,20-22,101-117');

DROP TABLE IF EXISTS `void_log`;
CREATE TABLE `void_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` decimal(5,2) NOT NULL DEFAULT 1.00,
  `unit_price` decimal(10,2) NOT NULL,
  `voided_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=359 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
