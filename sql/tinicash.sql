-- Schéma databáze TiniCash (prázdné, bez dat).
-- Odpovídá stavu k 9. 9. 2026 včetně sloupců sort_order, numbered, color a addon_category_id.
-- Data k ostrému nasazení jsou v posledním souboru tinicash_zaloha_*.sql.

CREATE DATABASE IF NOT EXISTS tinicash
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE tinicash;

-- -----------------------------------------------------
-- Kategorie
--   numbered          = tlačítka se popisují skupinou a pořadím ("PIZZA 3") místo
--                       názvu produktu; bez vyplněné skupiny jen pořadovým číslem
--   color             = barva tlačítek produktů v této kategorii (#rrggbb)
--   addon_category_id = pod produkty se navíc vypíšou produkty z jiné kategorie
--                       (např. pod Pizzu se přidají Přídavky)
-- -----------------------------------------------------
CREATE TABLE categories (
  id                INT          NOT NULL AUTO_INCREMENT,
  name              VARCHAR(100) NOT NULL,
  numbered          TINYINT(1)   NOT NULL DEFAULT 0,
  color             VARCHAR(7)   DEFAULT NULL,
  addon_category_id INT          DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_cat_addon (addon_category_id),
  CONSTRAINT fk_cat_addon FOREIGN KEY (addon_category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- -----------------------------------------------------
-- Produkty (id = PLU, zadává se ručně, proto bez AUTO_INCREMENT)
--   sort_group = název skupiny uvnitř kategorie (jen popisek, nic neřadí)
--   sort_order = pořadí; menší číslo je dřív, NULL jde nakonec.
--                Mezera v mřížce vzniká tam, kde se změní sort_order nebo sort_group.
-- -----------------------------------------------------
CREATE TABLE products (
  id            INT            NOT NULL,
  name          VARCHAR(200)   NOT NULL,
  price         DECIMAL(10, 2) NOT NULL,
  active        TINYINT(1)     NOT NULL DEFAULT 1,
  print_kitchen TINYINT(1)     NOT NULL DEFAULT 1,
  sort_group    VARCHAR(50)    DEFAULT NULL,
  sort_order    INT            DEFAULT NULL,
  vat_rate      TINYINT(4)     NOT NULL DEFAULT 12,
  PRIMARY KEY (id)
);

-- -----------------------------------------------------
-- Vazba produkt <-> kategorie (M:N)
-- -----------------------------------------------------
CREATE TABLE product_categories (
  product_id  INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (product_id, category_id),
  KEY category_id (category_id),
  CONSTRAINT fk_pc_product          FOREIGN KEY (product_id)  REFERENCES products(id)   ON DELETE CASCADE,
  CONSTRAINT product_categories_ibfk_2 FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Objednávky (účty stolů)
-- -----------------------------------------------------
CREATE TABLE orders (
  id           INT            NOT NULL AUTO_INCREMENT,
  table_number INT            NOT NULL,
  created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_price  DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status       ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  closed_at    DATETIME       DEFAULT NULL,
  payment_type VARCHAR(20)    DEFAULT NULL,
  PRIMARY KEY (id)
);

-- -----------------------------------------------------
-- Položky objednávky (quantity je DECIMAL kvůli půlkám)
-- -----------------------------------------------------
CREATE TABLE order_items (
  id         INT            NOT NULL AUTO_INCREMENT,
  order_id   INT            NOT NULL,
  product_id INT            NOT NULL,
  quantity   DECIMAL(5, 2)  NOT NULL DEFAULT 1.00,
  unit_price DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (id),
  KEY order_id (order_id),
  KEY fk_oi_product (product_id),
  CONSTRAINT order_items_ibfk_1 FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_product      FOREIGN KEY (product_id) REFERENCES products(id)
);

-- -----------------------------------------------------
-- Storna (co se smazalo z už rozepsaného účtu).
-- quantity je 1 u celého kusu, 0.50 u půlky.
-- -----------------------------------------------------
CREATE TABLE void_log (
  id         INT            NOT NULL AUTO_INCREMENT,
  order_id   INT            NOT NULL,
  product_id INT            NOT NULL,
  quantity   DECIMAL(5, 2)  NOT NULL DEFAULT 1.00,
  unit_price DECIMAL(10, 2) NOT NULL,
  voided_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- -----------------------------------------------------
-- Hranice denních uzávěrek
-- -----------------------------------------------------
CREATE TABLE closings (
  id        INT      NOT NULL AUTO_INCREMENT,
  closed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- -----------------------------------------------------
-- Hranice položkových uzávěrek (nezávislá na denních)
-- -----------------------------------------------------
CREATE TABLE item_closings (
  id        INT      NOT NULL AUTO_INCREMENT,
  closed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
