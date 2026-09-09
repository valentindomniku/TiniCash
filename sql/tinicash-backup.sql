-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Počítač: localhost
-- Vytvořeno: Stř 09. zář 2026, 15:02
-- Verze serveru: 10.4.28-MariaDB
-- Verze PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Databáze: `tinicash`
--

-- --------------------------------------------------------

--
-- Struktura tabulky `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `numbered` tinyint(1) NOT NULL DEFAULT 0,
  `color` varchar(7) DEFAULT NULL,
  `addon_category_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Vypisuji data pro tabulku `categories`
--

INSERT INTO `categories` (`id`, `name`, `numbered`, `color`, `addon_category_id`) VALUES
(1, 'Polévky Saláty', 0, '#1565C0', NULL),
(2, 'Pizza', 0, '#7B1FA2', 7),
(3, 'Spaghetti AlForno', 0, '#2E7D32', 7),
(4, 'Penne Tortellini Gnocchi', 0, '#6A1B9A', 7),
(5, 'Masa', 0, '#00838F', 8),
(6, 'Dezerty Poháry', 0, '#AD1457', NULL),
(7, 'Přídavky na pizzu', 0, '#4527A0', NULL),
(8, 'Přílohy', 0, '#558B2F', NULL),
(9, 'Aperitivy Destiláty', 0, '#BF360C', NULL),
(10, 'Whisky Bourbon', 0, '#00695C', NULL),
(11, 'Vína Sekty', 0, '#283593', NULL),
(12, 'Piva Nealko Juice', 0, '#c2185b', NULL),
(13, 'Káva Teplé nápoje', 0, '#1565C0', NULL),
(14, 'Vinný lístek', 0, '#7B1FA2', NULL),
(15, 'Menu Jaky', 1, '#2E7D32', NULL),
(16, 'Menu Tony', 1, '#6A1B9A', NULL);

-- --------------------------------------------------------

--
-- Struktura tabulky `closings`
--

CREATE TABLE `closings` (
  `id` int(11) NOT NULL,
  `closed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabulky `item_closings`
--

CREATE TABLE `item_closings` (
  `id` int(11) NOT NULL,
  `closed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabulky `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `table_number` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `total_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `closed_at` datetime DEFAULT NULL,
  `payment_type` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabulky `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` decimal(5,2) NOT NULL DEFAULT 1.00,
  `unit_price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktura tabulky `owner`
--

CREATE TABLE `owner` (
  `pin_hash` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Vypisuji data pro tabulku `owner`
--

INSERT INTO `owner` (`pin_hash`) VALUES
('f3ba6e674209489e6fc4baf2589469fbbd06720bd036287bd194aabd288ca782');

-- --------------------------------------------------------

--
-- Struktura tabulky `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `print_kitchen` tinyint(1) NOT NULL DEFAULT 1,
  `sort_group` varchar(50) DEFAULT NULL,
  `sort_order` int(11) DEFAULT NULL,
  `vat_rate` tinyint(4) NOT NULL DEFAULT 12
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Vypisuji data pro tabulku `products`
--

INSERT INTO `products` (`id`, `name`, `price`, `active`, `print_kitchen`, `sort_group`, `sort_order`, `vat_rate`) VALUES
(3, 'Zeleninová polévka', 50.00, 1, 1, NULL, 1, 12),
(4, 'Rajská polévka', 50.00, 1, 1, NULL, 1, 12),
(5, 'PIZZA Margarita', 180.00, 1, 1, NULL, NULL, 12),
(6, 'PIZZA Al Funghi', 190.00, 1, 1, NULL, NULL, 12),
(7, 'PIZZA Šunková', 200.00, 1, 1, NULL, NULL, 12),
(8, 'PIZZA Capricciosa', 200.00, 1, 1, NULL, NULL, 12),
(9, 'PIZZA Brokolicová', 200.00, 1, 1, NULL, NULL, 12),
(10, 'PIZZA Tonno', 210.00, 1, 1, NULL, NULL, 12),
(11, 'PIZZA Spinaci', 200.00, 1, 1, NULL, NULL, 12),
(12, 'PIZZA Romana', 200.00, 1, 1, NULL, NULL, 12),
(13, 'PIZZA Vegetariana', 200.00, 1, 1, NULL, NULL, 12),
(14, 'PIZZA Bolognese', 200.00, 1, 1, NULL, NULL, 12),
(15, 'PIZZA Formaggi', 200.00, 1, 1, NULL, NULL, 12),
(16, 'PIZZA Stagioni', 200.00, 1, 1, NULL, NULL, 12),
(17, 'PIZZA Mexicana', 200.00, 1, 1, NULL, NULL, 12),
(18, 'PIZZA Hawai', 200.00, 1, 1, NULL, NULL, 12),
(19, 'PIZZA Peperonni', 200.00, 1, 1, NULL, NULL, 12),
(20, 'PIZZA Calzone', 200.00, 1, 1, NULL, NULL, 12),
(21, 'PIZZA Alcapone', 200.00, 1, 1, NULL, NULL, 12),
(22, 'PIZZA Pollo', 220.00, 1, 1, NULL, NULL, 12),
(23, 'PIZZA Marinara', 220.00, 1, 1, NULL, NULL, 12),
(24, 'PIZZA Pinocchio', 200.00, 1, 1, NULL, NULL, 12),
(25, 'PIZZA Parma', 220.00, 1, 1, NULL, NULL, 12),
(26, 'SPAGHETTI Al Pomodoro', 150.00, 1, 1, NULL, 1, 12),
(27, 'SPAGHETTI Spinaci', 160.00, 1, 1, NULL, 1, 12),
(28, 'SPAGHETTI Al Funghi', 160.00, 1, 1, NULL, 1, 12),
(29, 'SPAGHETTI Pollo', 200.00, 1, 1, NULL, 1, 12),
(30, 'SPAGHETTI Bolognese', 160.00, 1, 1, NULL, 1, 12),
(31, 'SPAGHETTI Carbonara', 160.00, 1, 1, NULL, 1, 12),
(32, 'SPAGHETTI Napolitana', 160.00, 1, 1, NULL, 1, 12),
(33, 'SPAGHETTI Al Tono', 200.00, 1, 1, NULL, 1, 12),
(34, 'AL FORNO Zapečené penne', 200.00, 1, 1, NULL, 2, 12),
(35, 'AL FORNO Penne Quattro Formaggi', 200.00, 1, 1, NULL, 2, 12),
(36, 'PENNE Al Pomodoro', 150.00, 1, 1, NULL, 1, 12),
(37, 'PENNE Al Proscuito E Funghi', 160.00, 1, 1, '', 1, 12),
(38, 'PENNE Spinaci', 160.00, 1, 1, '', 1, 12),
(39, 'PENNE Luciana', 200.00, 1, 1, '', 1, 12),
(40, 'PENNE Bolognese', 160.00, 1, 1, '', 1, 12),
(41, 'PENNE Al Tono', 200.00, 1, 1, '', 1, 12),
(42, 'TORTELLINI Spinaci', 200.00, 1, 1, '', 2, 12),
(43, 'TORTELLINI Al Funghi', 200.00, 1, 1, '', 2, 12),
(44, 'TORTELLINI Al Pastico', 200.00, 1, 1, '', 2, 12),
(45, 'GNOCCHI Al Pomodoro', 170.00, 1, 1, '', 3, 12),
(46, 'GNOCCHI Tomata Funghi', 170.00, 1, 1, '', 3, 12),
(47, 'GNOCCHI Al Quattro Formaggi', 170.00, 1, 1, '', 3, 12),
(48, 'GNOCCHI Al la Sorrentina', 170.00, 1, 1, '', 3, 12),
(49, 'Scaloppina Funghi', 219.00, 1, 1, NULL, 1, 12),
(50, 'Scaloppina Natur', 219.00, 1, 1, '', 1, 12),
(51, 'Scaloppina Pfeffer', 219.00, 1, 1, '', 1, 12),
(52, 'Kuřecí Gorgonzola', 200.00, 1, 1, NULL, 2, 12),
(53, 'La Piazza', 200.00, 1, 1, '', 2, 12),
(54, 'PIZZA Brusinková Hermelino', 210.00, 1, 1, NULL, NULL, 12),
(55, 'Šopský Salát', 98.00, 1, 1, NULL, 2, 12),
(56, 'Řecký Salát', 160.00, 1, 1, NULL, 2, 12),
(57, 'Tuňákový Salát', 180.00, 1, 1, NULL, 2, 12),
(58, 'Island Salát', 200.00, 1, 1, NULL, 2, 12),
(59, 'Hranolky', 50.00, 1, 1, NULL, NULL, 12),
(60, 'Krokety', 60.00, 1, 1, NULL, NULL, 12),
(61, 'Americké Brambory', 60.00, 1, 1, NULL, NULL, 12),
(62, 'Špenát', 60.00, 1, 1, NULL, NULL, 12),
(63, 'Pizza Chleba', 120.00, 1, 1, NULL, NULL, 12),
(64, 'Tatarka', 20.00, 1, 1, NULL, NULL, 12),
(65, 'Kečup', 20.00, 1, 1, NULL, NULL, 12),
(66, 'Medovník', 60.00, 1, 1, NULL, 3, 12),
(400, 'BAR', 0.00, 1, 0, NULL, NULL, 21),
(401, 'KUCHYŇ', 0.00, 1, 1, NULL, NULL, 12),
(570, 'Krabice', 10.00, 1, 1, NULL, NULL, 12),
(602, 'PIZZA Salami', 200.00, 1, 1, NULL, NULL, 12),
(603, 'PIZZA Jarina', 220.00, 1, 1, NULL, NULL, 12),
(604, 'PIZZA Vullcano', 200.00, 1, 1, NULL, NULL, 12),
(605, 'PIZZA Klodi', 220.00, 1, 1, NULL, NULL, 12),
(606, 'TORTELLINI Al Quatro Formaggi', 200.00, 1, 1, '', 2, 12),
(607, 'GNOCCHI Al Spinaci', 170.00, 1, 1, '', 3, 12),
(608, 'GNOCCHI Al Funghi', 170.00, 1, 1, '', 3, 12),
(609, 'Scaloppina Gorgonzola', 219.00, 1, 1, NULL, 1, 12),
(610, 'Kuřecí Natur', 200.00, 1, 1, NULL, 2, 12),
(611, 'Kuřecí Al Funghi', 200.00, 1, 1, NULL, 2, 12),
(612, 'Kuřecí Řízek', 190.00, 1, 1, NULL, 3, 12),
(613, 'Kuřecí Kapsa', 200.00, 1, 1, NULL, 3, 12),
(614, 'Smažený sýr, hranolky, tatarka', 170.00, 1, 1, NULL, 3, 12),
(615, 'Smažený camembert, hranolky, tatarka', 170.00, 1, 1, NULL, 3, 12),
(616, 'Pollo Salát', 180.00, 1, 1, NULL, 2, 12),
(617, 'Italia Salát', 160.00, 1, 1, NULL, 2, 12),
(618, 'AL FORNO Gnocchi Pampalini', 200.00, 1, 1, NULL, 2, 12),
(620, 'PIZZA Kokoroška', 200.00, 1, 1, NULL, NULL, 12),
(621, 'PIZZA Karma', 200.00, 1, 1, NULL, NULL, 12),
(622, 'PIZZA Brusinková Pollo', 220.00, 1, 1, NULL, NULL, 12),
(623, 'PIZZA Primavera', 200.00, 1, 1, NULL, NULL, 12),
(624, 'PIZZA Hermelino', 200.00, 1, 1, NULL, NULL, 12),
(625, 'PIZZA Olivová', 200.00, 1, 1, NULL, NULL, 12),
(626, 'PIZZA Kozí', 240.00, 1, 1, NULL, NULL, 12),
(661, 'Casa', 200.00, 1, 1, NULL, 2, 12),
(662, 'Cesar Salát', 200.00, 1, 1, NULL, 2, 12),
(700, 'SMETANOVÝ ZÁKLAD', 0.00, 1, 1, NULL, NULL, 0),
(701, 'PROPEČENÁ', 0.00, 1, 1, NULL, NULL, 0),
(702, 'ČESNEK', 0.00, 1, 1, NULL, NULL, 0),
(703, 'BEZ OBLOHY', 0.00, 1, 1, NULL, NULL, 0),
(704, 'BEZ SÝRU', 0.00, 1, 1, NULL, NULL, 0),
(705, 'ZAPÉCT', 0.00, 1, 1, NULL, NULL, 0),
(800, 'Přídavek špenát', 35.00, 1, 1, NULL, 2, 12),
(801, 'Přídavek kukuřice', 25.00, 1, 1, NULL, 1, 12),
(802, 'Přídavek olivy', 25.00, 1, 1, NULL, 1, 12),
(803, 'Přídavek žampiony', 25.00, 1, 1, NULL, 1, 12),
(804, 'Přídavek salám', 35.00, 1, 1, NULL, 2, 12),
(805, 'Přídavek šunka', 35.00, 1, 1, NULL, 2, 12),
(806, 'Přídavek hermelín', 35.00, 1, 1, NULL, 2, 12),
(807, 'Přídavek parmazán', 35.00, 1, 1, NULL, 2, 12),
(808, 'Přídavek mozzarela', 35.00, 1, 1, NULL, 2, 12),
(809, 'Přídavek kuře', 40.00, 1, 1, NULL, 3, 12),
(810, 'Přídavek niva', 35.00, 1, 1, NULL, 2, 12),
(811, 'Přídavek uzený sýr', 35.00, 1, 1, NULL, 2, 12),
(812, 'Přídavek vejce', 25.00, 1, 1, NULL, 1, 12),
(813, 'Přídavek cibule', 25.00, 1, 1, NULL, 1, 12),
(814, 'Přídavek jalapenos', 25.00, 1, 1, NULL, 1, 15),
(815, 'Přídavek paprika', 25.00, 1, 1, NULL, 1, 15),
(816, 'Přídavek chorizo', 35.00, 1, 1, NULL, 2, 12),
(817, 'Přídavek slanina', 35.00, 1, 1, NULL, 2, 12),
(818, 'Přídavek obloha', 35.00, 1, 1, NULL, 2, 12),
(819, 'Přídavek brusinky', 25.00, 1, 1, NULL, 1, 12),
(820, 'Přídavek brokolice', 35.00, 1, 1, NULL, 2, 12),
(900, '//Polévka rajská', 30.00, 1, 1, 'POLEVKA', 1, 12),
(901, '//Polévka bolognese', 40.00, 1, 1, 'POLEVKA', 1, 12),
(902, '//Pizza šunková + cibule', 150.00, 1, 1, 'PIZZA', 2, 12),
(903, '//Pizza 4 druhy sýra', 150.00, 1, 1, 'PIZZA', 2, 12),
(904, '//Pizza žampionová', 150.00, 1, 1, 'PIZZA', 2, 12),
(905, '//Pizza salám + kukuřice', 150.00, 1, 1, 'PIZZA', 2, 12),
(906, '//Pizza s mletým masem + feferonky', 150.00, 1, 1, 'PIZZA', 2, 12),
(907, '//Pizza šunková + žampiony na smetaně', 150.00, 1, 1, 'PIZZA', 2, 12),
(908, '//Pizza pikantní salám + olivy', 150.00, 1, 1, 'PIZZA', 2, 12),
(909, '//Pizza slanina + žampiony na smetaně', 150.00, 1, 1, 'PIZZA', 2, 12),
(910, '//Pizza šunková + salám na smetaně', 150.00, 1, 1, 'PIZZA', 2, 12),
(911, '//Pizza šunková + ananas', 150.00, 1, 1, 'PIZZA', 2, 12),
(912, '//Pizza pikantní salám + hermelín', 150.00, 1, 1, 'PIZZA', 2, 12),
(913, '//Pizza slanina + papriky', 150.00, 1, 1, 'PIZZA', 2, 12),
(914, '//Pizza slanina + vejce', 150.00, 1, 1, 'PIZZA', 2, 12),
(915, '//Pizza špenátová', 150.00, 1, 1, 'PIZZA', 2, 12),
(916, '//Pizza pikantní salám + rajčata', 150.00, 1, 1, 'PIZZA', 2, 12),
(917, '//Pizza šunková + olivy', 150.00, 1, 1, 'PIZZA', 2, 12),
(918, '//Pizza kuřecí maso + niva', 150.00, 1, 1, 'PIZZA', 2, 12),
(919, '//Pizza šunková + kukuřice', 150.00, 1, 1, 'PIZZA', 2, 12),
(920, '//Salát s kuřecím masem + domácí bochánek', 150.00, 1, 1, 'SALATY', 3, 12),
(921, '//Penne s kuřecím masem na smetaně', 150.00, 1, 1, 'PENNE', 4, 12),
(922, '//Penne s mletým masem na smetaně', 150.00, 1, 1, 'PENNE', 4, 12),
(923, '//Penne 4 druhy sýra', 150.00, 1, 1, 'PENNE', 4, 12),
(924, '//Penne se šunkou a žampiony na smetaně', 150.00, 1, 1, 'PENNE', 4, 12),
(925, '//Zapečené penne bolognese', 150.00, 1, 1, 'PENNE', 4, 12),
(926, '//Kuřecí plátek + sýrová omáčka + hranolky', 180.00, 1, 1, 'MASA', 5, 12),
(927, '//Kuřecí Řízek + hranolky + tatarka', 180.00, 1, 1, 'MASA', 5, 12),
(928, '//Kuřecí plátek + žampionová omáčka + hranolky', 180.00, 1, 1, 'MASA', 5, 12),
(929, '//Kuřecí plátek + špenát + hranolky', 180.00, 1, 1, 'MASA', 5, 12),
(950, '//Rajská polévka', 30.00, 1, 1, 'POLEVKA', 1, 12),
(951, '//Polévka Minestrone', 40.00, 1, 1, 'POLEVKA', 1, 12),
(952, '/Pizza šunka s žampiony', 150.00, 1, 1, 'PIZZA', 2, 12),
(953, '/Pizza čtyři druhy sýra na smetanovém základě', 150.00, 1, 1, 'PIZZA', 2, 12),
(954, '/Pizza (slanina, cibule, kukuřice)', 150.00, 1, 1, 'PIZZA', 2, 12),
(955, '/Pizza Hawai', 150.00, 1, 1, 'PIZZA', 2, 12),
(956, '/Pizza salami s kukuřicí', 150.00, 1, 1, 'PIZZA', 2, 12),
(957, '/Pizza šunka s olivy', 150.00, 1, 1, 'PIZZA', 2, 12),
(958, '/Pizza Margarita s vejcem a kukuřicí', 150.00, 1, 1, 'PIZZA', 2, 12),
(959, '/Pizza s pikantním salámem a paprikou', 150.00, 1, 1, 'PIZZA', 2, 12),
(960, '/Pizza s tuňákem a cibulí', 150.00, 1, 1, 'PIZZA', 2, 12),
(961, '/Pizza špenátová', 150.00, 1, 1, 'PIZZA', 2, 12),
(962, '/Pizza s šunkou a salámem', 150.00, 1, 1, 'PIZZA', 2, 12),
(963, '/Pizza se salámem a jalapeños', 150.00, 1, 1, 'PIZZA', 2, 12),
(964, '/Řecký salát', 150.00, 1, 1, 'SALATY', 3, 12),
(965, '/Ceasar salát', 150.00, 1, 1, 'SALATY', 3, 12),
(966, '/Italia salát', 150.00, 1, 1, 'SALATY', 3, 12),
(967, '/Penne s šunkou a žampiony na smetaně', 150.00, 1, 1, 'PENNE', 4, 12),
(968, '/Penne Pomodoro', 150.00, 1, 1, 'PENNE', 4, 12),
(969, '/Gnocchi s šunkou, žampiony a kukuřicí', 150.00, 1, 1, 'PENNE', 4, 12),
(970, '/Tortellini čtyři druhy sýra', 150.00, 1, 1, 'PENNE', 4, 12),
(971, '/Kuřecí plátek s gorgonzolovou omáčkou a hranolky', 180.00, 1, 1, 'MASA', 5, 12),
(972, '/Vepřová panenka s žampionovou omáčkou a hranolky', 180.00, 1, 1, 'MASA', 5, 12),
(973, '/Vepřová panenka s pepřovou omáčkou a hranolky', 180.00, 1, 1, 'MASA', 5, 12),
(974, '/Kuřecí řízek s hranolky a tatarkou', 180.00, 1, 1, 'MASA', 5, 12),
(1001, 'Cinzano Bianco', 70.00, 1, 0, NULL, 1, 21),
(1009, 'Vodka Finlandia', 50.00, 1, 0, NULL, 2, 21),
(1012, 'Jägermeister', 70.00, 1, 0, NULL, 2, 21),
(1013, 'Becherovka', 60.00, 1, 0, NULL, 2, 21),
(1015, 'Fernet', 50.00, 1, 0, NULL, 2, 21),
(1017, 'Rum tuzemský 40%', 45.00, 1, 0, NULL, 2, 21),
(1018, 'Slivovice Jelínek', 60.00, 1, 0, NULL, 2, 21),
(1019, 'Beefeater Gin', 60.00, 1, 0, NULL, 2, 21),
(1020, 'Tequilla Sierra Silver', 70.00, 1, 0, NULL, 2, 21),
(1023, 'Berentzen', 45.00, 1, 0, NULL, 2, 21),
(1026, 'Veltlínské zelené', 250.00, 1, 0, NULL, 1, 21),
(1027, 'Rulandské šedé', 260.00, 1, 0, NULL, 1, 21),
(1029, 'Modrý Portugal', 260.00, 1, 0, NULL, 2, 21),
(1031, 'Sauvignon', 380.00, 1, 0, NULL, 1, 21),
(1032, 'Tramín červený', 380.00, 1, 0, NULL, 1, 21),
(1034, 'Pálava', 440.00, 1, 0, NULL, 1, 21),
(1035, 'Cabernet Sauvignon', 380.00, 1, 0, NULL, 2, 21),
(1037, 'Pinot Grigio', 320.00, 1, 0, NULL, 1, 21),
(1041, 'Montepulciano', 320.00, 1, 0, NULL, 2, 21),
(1042, 'Prosecco', 350.00, 1, 0, NULL, 1, 21),
(1046, 'Jameson', 60.00, 1, 0, NULL, NULL, 21),
(1047, 'Tullamore Dew', 60.00, 1, 0, NULL, NULL, 21),
(1048, 'Jack Daniels', 70.00, 1, 0, NULL, NULL, 21),
(1051, 'Bílé odrůdové víno', 60.00, 1, 0, NULL, 1, 21),
(1052, 'Irsai sladké (bílé)', 70.00, 1, 0, NULL, 1, 21),
(1053, 'Červené odrůdové víno', 60.00, 1, 0, NULL, 2, 21),
(1065, 'Malinovka 0,3l', 35.00, 1, 0, NULL, 3, 21),
(1066, 'Radegast 12 0,5l', 50.00, 1, 0, NULL, 1, 21),
(1067, 'Radegast 12 0,3l', 40.00, 1, 0, NULL, 1, 21),
(1068, 'Domácí limonáda', 70.00, 1, 0, NULL, 2, 21),
(1069, 'Aperol', 85.00, 1, 0, NULL, 1, 21),
(1070, 'Lambrusco Rosso', 250.00, 1, 0, NULL, 3, 21),
(1072, 'Frizzantino bílé', 70.00, 1, 0, NULL, 4, 21),
(1073, 'Pivo nealko 0,5l', 45.00, 1, 0, NULL, 1, 21),
(1074, 'Bohemia sekt', 250.00, 1, 0, NULL, 5, 21),
(1080, 'Malinovka 0,5l', 45.00, 1, 0, NULL, 3, 21),
(1081, 'Birell Pomelo 0,5l', 45.00, 1, 0, NULL, 2, 21),
(1083, 'Coca-cola', 45.00, 1, 0, NULL, NULL, 21),
(1084, 'Coca-Cola zero', 45.00, 1, 0, NULL, NULL, 21),
(1085, 'Sprite', 45.00, 1, 0, NULL, NULL, 21),
(1086, 'Fanta', 45.00, 1, 0, NULL, NULL, 21),
(1089, 'Kinley Tonic', 45.00, 1, 0, NULL, NULL, 21),
(1090, 'Voda jemně', 30.00, 1, 0, NULL, 4, 21),
(1091, 'Voda neperlivá', 30.00, 1, 0, NULL, 4, 21),
(1113, 'Juice', 45.00, 1, 0, NULL, 5, 21),
(1121, 'Espresso velké', 45.00, 1, 0, NULL, 1, 21),
(1122, 'Espresso Piccolo malé', 40.00, 1, 0, NULL, 1, 21),
(1123, 'Cappuccino', 55.00, 1, 0, NULL, 1, 21),
(1124, 'Káva latte', 60.00, 1, 0, NULL, 1, 21),
(1125, 'Káva turecká', 40.00, 1, 0, NULL, 1, 21),
(1126, 'Káva vídeňská', 55.00, 1, 0, NULL, 1, 21),
(1129, 'Ledová káva', 65.00, 1, 0, NULL, 1, 21),
(1130, 'Čaj', 45.00, 1, 0, NULL, 3, 21),
(1131, 'Horký juice', 55.00, 1, 0, NULL, 3, 21),
(1132, 'Med', 15.00, 1, 0, NULL, 3, 21),
(1134, 'Svařené víno', 55.00, 1, 0, NULL, 3, 21),
(1135, 'Mléko do kávy', 5.00, 1, 0, NULL, 2, 21),
(1157, 'Ledový čaj', 45.00, 1, 0, NULL, NULL, 21),
(1158, 'Kohoutková voda 0,5l', 30.00, 1, 0, NULL, 4, 12),
(1200, 'POHÁR Zmrzlina s malinami', 80.00, 1, 1, NULL, 1, 21),
(1201, 'POHÁR Vanilková romance', 80.00, 1, 1, NULL, 1, 21),
(1202, 'POHÁR Míchaný pohár', 80.00, 1, 1, NULL, 1, 21),
(1203, 'Kopeček zmrzliny', 30.00, 1, 1, NULL, 2, 21);

-- --------------------------------------------------------

--
-- Struktura tabulky `product_categories`
--

CREATE TABLE `product_categories` (
  `product_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Vypisuji data pro tabulku `product_categories`
--

INSERT INTO `product_categories` (`product_id`, `category_id`) VALUES
(3, 1),
(4, 1),
(5, 2),
(6, 2),
(7, 2),
(8, 2),
(9, 2),
(10, 2),
(11, 2),
(12, 2),
(13, 2),
(14, 2),
(15, 2),
(16, 2),
(17, 2),
(18, 2),
(19, 2),
(20, 2),
(21, 2),
(22, 2),
(23, 2),
(24, 2),
(25, 2),
(26, 3),
(27, 3),
(28, 3),
(29, 3),
(30, 3),
(31, 3),
(32, 3),
(33, 3),
(34, 3),
(35, 3),
(36, 4),
(37, 4),
(38, 4),
(39, 4),
(40, 4),
(41, 4),
(42, 4),
(43, 4),
(44, 4),
(45, 4),
(46, 4),
(47, 4),
(48, 4),
(49, 5),
(50, 5),
(51, 5),
(52, 5),
(53, 5),
(54, 2),
(55, 1),
(56, 1),
(57, 1),
(58, 1),
(59, 8),
(60, 8),
(61, 8),
(62, 8),
(63, 8),
(64, 8),
(65, 8),
(66, 6),
(602, 2),
(603, 2),
(604, 2),
(605, 2),
(606, 4),
(607, 4),
(608, 4),
(609, 5),
(610, 5),
(611, 5),
(612, 5),
(613, 5),
(614, 5),
(615, 5),
(616, 1),
(617, 1),
(618, 3),
(620, 2),
(621, 2),
(622, 2),
(623, 2),
(624, 2),
(625, 2),
(626, 2),
(661, 1),
(662, 1),
(800, 7),
(801, 7),
(802, 7),
(803, 7),
(804, 7),
(805, 7),
(806, 7),
(807, 7),
(808, 7),
(809, 7),
(810, 7),
(811, 7),
(812, 7),
(813, 7),
(814, 7),
(815, 7),
(816, 7),
(817, 7),
(818, 7),
(819, 7),
(820, 7),
(900, 15),
(901, 15),
(902, 15),
(903, 15),
(904, 15),
(905, 15),
(906, 15),
(907, 15),
(908, 15),
(909, 15),
(910, 15),
(911, 15),
(912, 15),
(913, 15),
(914, 15),
(915, 15),
(916, 15),
(917, 15),
(918, 15),
(919, 15),
(920, 15),
(921, 15),
(922, 15),
(923, 15),
(924, 15),
(925, 15),
(926, 15),
(927, 15),
(928, 15),
(929, 15),
(950, 16),
(951, 16),
(952, 16),
(953, 16),
(954, 16),
(955, 16),
(956, 16),
(957, 16),
(958, 16),
(959, 16),
(960, 16),
(961, 16),
(962, 16),
(963, 16),
(964, 16),
(965, 16),
(966, 16),
(967, 16),
(968, 16),
(969, 16),
(970, 16),
(971, 16),
(972, 16),
(973, 16),
(974, 16),
(1001, 9),
(1009, 9),
(1012, 9),
(1013, 9),
(1015, 9),
(1017, 9),
(1018, 9),
(1019, 9),
(1020, 9),
(1023, 9),
(1026, 14),
(1027, 14),
(1029, 14),
(1031, 14),
(1032, 14),
(1034, 14),
(1035, 14),
(1037, 14),
(1041, 14),
(1042, 14),
(1046, 10),
(1047, 10),
(1048, 10),
(1051, 11),
(1052, 11),
(1053, 11),
(1065, 12),
(1066, 12),
(1067, 12),
(1068, 12),
(1069, 9),
(1070, 11),
(1072, 11),
(1073, 12),
(1074, 11),
(1080, 12),
(1081, 12),
(1083, 12),
(1084, 12),
(1085, 12),
(1086, 12),
(1089, 12),
(1090, 12),
(1091, 12),
(1113, 12),
(1121, 13),
(1122, 13),
(1123, 13),
(1124, 13),
(1125, 13),
(1126, 13),
(1129, 13),
(1130, 13),
(1131, 13),
(1132, 13),
(1134, 13),
(1135, 13),
(1157, 12),
(1158, 12),
(1200, 6),
(1201, 6),
(1202, 6),
(1203, 6);

-- --------------------------------------------------------

--
-- Struktura tabulky `void_log`
--

CREATE TABLE `void_log` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` decimal(5,2) NOT NULL DEFAULT 1.00,
  `unit_price` decimal(10,2) NOT NULL,
  `voided_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexy pro exportované tabulky
--

--
-- Indexy pro tabulku `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cat_addon` (`addon_category_id`);

--
-- Indexy pro tabulku `closings`
--
ALTER TABLE `closings`
  ADD PRIMARY KEY (`id`);

--
-- Indexy pro tabulku `item_closings`
--
ALTER TABLE `item_closings`
  ADD PRIMARY KEY (`id`);

--
-- Indexy pro tabulku `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexy pro tabulku `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `fk_oi_product` (`product_id`);

--
-- Indexy pro tabulku `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexy pro tabulku `product_categories`
--
ALTER TABLE `product_categories`
  ADD PRIMARY KEY (`product_id`,`category_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexy pro tabulku `void_log`
--
ALTER TABLE `void_log`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT pro tabulky
--

--
-- AUTO_INCREMENT pro tabulku `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT pro tabulku `closings`
--
ALTER TABLE `closings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=97;

--
-- AUTO_INCREMENT pro tabulku `item_closings`
--
ALTER TABLE `item_closings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pro tabulku `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=405;

--
-- AUTO_INCREMENT pro tabulku `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1526;

--
-- AUTO_INCREMENT pro tabulku `void_log`
--
ALTER TABLE `void_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=359;

--
-- Omezení pro exportované tabulky
--

--
-- Omezení pro tabulku `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `fk_cat_addon` FOREIGN KEY (`addon_category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Omezení pro tabulku `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_oi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Omezení pro tabulku `product_categories`
--
ALTER TABLE `product_categories`
  ADD CONSTRAINT `fk_pc_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
